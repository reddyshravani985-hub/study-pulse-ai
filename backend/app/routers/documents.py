import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings
from app.services.pdf_service import pdf_service
from app.services.rag_service import rag_service
from app.services.storage_service import storage_service
from app.services.ai_service import ai_service
from app.models.schemas import DocumentInfo, DocumentDetail, DocumentPage, DocumentStatus

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentInfo)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF study document, extract text preserving page numbers,
    detect empty/scanned documents, and index chunks into ChromaDB for RAG.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are supported."
        )

    # Read content with size check
    pdf_bytes = await file.read()
    file_size = len(pdf_bytes)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Check PDF header magic bytes '%PDF'
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file format. Missing standard PDF file signature."
        )

    doc_id = str(uuid.uuid4())[:8]

    try:
        extracted = pdf_service.extract_and_chunk_pdf(
            pdf_bytes=pdf_bytes,
            doc_id=doc_id,
            filename=file.filename
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse PDF: {str(e)}"
        )

    # Index chunks in vector store
    if extracted.get("chunks"):
        rag_service.add_document_chunks(
            doc_id=doc_id,
            chunks=extracted["chunks"],
            gemini_client=ai_service.get_client()
        )

    doc_data = {
        "id": doc_id,
        "filename": file.filename,
        "file_size_bytes": file_size,
        "total_pages": extracted["total_pages"],
        "total_chunks": extracted["total_chunks"],
        "word_count": extracted["word_count"],
        "status": extracted["status"],
        "status_message": extracted["status_message"],
        "upload_timestamp": datetime.utcnow().isoformat(),
        "pages": extracted["pages"],
        "chunks": extracted["chunks"],
        "full_text": extracted["full_text"]
    }

    storage_service.save_document(doc_data)

    return DocumentInfo(
        id=doc_id,
        filename=file.filename,
        file_size_bytes=file_size,
        total_pages=extracted["total_pages"],
        total_chunks=extracted["total_chunks"],
        word_count=extracted["word_count"],
        status=DocumentStatus(extracted["status"]),
        status_message=extracted["status_message"],
        upload_timestamp=doc_data["upload_timestamp"]
    )

@router.post("/load-sample", response_model=DocumentInfo)
async def load_sample_document():
    """
    Generates a sample academic study document in-memory for instant testing.
    Topic: Artificial Intelligence & Machine Learning Fundamentals
    """
    import fitz

    doc_id = str(uuid.uuid4())[:8]
    filename = "Machine_Learning_Core_Principles.pdf"

    # Create a realistic 3-page study note PDF using PyMuPDF
    doc = fitz.open()

    page1_text = """
COURSE: CS401 - Artificial Intelligence & Machine Learning
MODULE 1: Supervised Learning & Linear Models
LECTURE NOTES - WEEK 2

1. Introduction to Supervised Learning
Supervised learning is an approach to machine learning where an algorithm learns a mapping function from input variables (features X) to an output variable (target y), using labeled training data:
D = {(x_1, y_1), (x_2, y_2), ..., (x_n, y_n)}.

Key Concepts:
- Features: The individual measurable properties or characteristics of a phenomenon being observed.
- Target Variable: The actual ground-truth label we seek to predict.
- Loss Function: A mathematical function L(y_hat, y) quantifying the error between prediction y_hat and ground truth y.

Important Formulas:
- Mean Squared Error (MSE): MSE = (1/n) * sum((y_i - y_hat_i)^2) from i=1 to n.
- Linear Regression Hypothesis: h_theta(x) = theta_0 + theta_1*x_1 + ... + theta_p*x_p = theta^T * x.

Gradient Descent Update Rule:
theta_j := theta_j - alpha * (1/n) * sum((h_theta(x_i) - y_i) * x_ij)
Where alpha represents the learning rate, controlling step size in parameter space.
"""

    page2_text = """
MODULE 2: Classification, Logistic Regression & Overfitting
LECTURE NOTES - WEEK 3

2. Logistic Regression & Binary Classification
Unlike linear regression, logistic regression predicts categorical outcomes. It uses the Sigmoid (logistic) function to squash real-valued predictions into probabilities between 0 and 1:
sigma(z) = 1 / (1 + e^(-z))

Definitions:
- Odds Ratio: The ratio of the probability of success to the probability of failure: p / (1 - p).
- Log-Odds (Logit): log(p / (1 - p)) = theta^T * x.
- Cross-Entropy Loss: J(theta) = - (1/n) * sum[ y_i * log(y_hat_i) + (1 - y_i) * log(1 - y_hat_i) ].

3. The Bias-Variance Tradeoff:
- High Bias (Underfitting): Model is overly simplistic and cannot capture underlying trends. Training error is high, validation error is high.
- High Variance (Overfitting): Model fits training noise and memorizes data. Training error is low, but validation/test error is significantly higher.
- Regularization (L1 Lasso and L2 Ridge): Adds penalty terms to the loss function to constrain model complexity.
L2 Penalty: Loss + lambda * sum(theta_j^2).
L1 Penalty: Loss + lambda * sum(|theta_j|).
"""

    page3_text = """
MODULE 3: Neural Networks & Evaluation Metrics
LECTURE NOTES - WEEK 4

4. Artificial Neural Networks (ANN):
Neural networks consist of an input layer, one or more hidden layers, and an output layer.
Each neuron computes an affine transformation followed by a non-linear activation function:
a = f(W * x + b).

Common Activation Functions:
- ReLU (Rectified Linear Unit): f(x) = max(0, x). Solves vanishing gradient problem for positive activations.
- Softmax Function: Normalizes an array of logits into a probability distribution summing to 1.0:
  Softmax(z_i) = e^(z_i) / sum(e^(z_j)).

5. Model Evaluation Metrics:
- Confusion Matrix: True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN).
- Accuracy: (TP + TN) / (TP + TN + FP + FN). Can be misleading with imbalanced datasets.
- Precision: TP / (TP + FP). Measures correctness among predicted positives.
- Recall (Sensitivity): TP / (TP + FN). Measures ability to find all actual positive cases.
- F1-Score: The harmonic mean of Precision and Recall: 2 * (Precision * Recall) / (Precision + Recall).
"""

    for p_text in [page1_text, page2_text, page3_text]:
        p = doc.new_page()
        p.insert_text((50, 60), p_text.strip(), fontsize=11)

    pdf_bytes = doc.tobytes()
    doc.close()

    extracted = pdf_service.extract_and_chunk_pdf(
        pdf_bytes=pdf_bytes,
        doc_id=doc_id,
        filename=filename
    )

    rag_service.add_document_chunks(
        doc_id=doc_id,
        chunks=extracted["chunks"],
        gemini_client=ai_service.get_client()
    )

    doc_data = {
        "id": doc_id,
        "filename": filename,
        "file_size_bytes": len(pdf_bytes),
        "total_pages": extracted["total_pages"],
        "total_chunks": extracted["total_chunks"],
        "word_count": extracted["word_count"],
        "status": extracted["status"],
        "status_message": extracted["status_message"],
        "upload_timestamp": datetime.utcnow().isoformat(),
        "pages": extracted["pages"],
        "chunks": extracted["chunks"],
        "full_text": extracted["full_text"]
    }

    storage_service.save_document(doc_data)

    return DocumentInfo(
        id=doc_id,
        filename=filename,
        file_size_bytes=len(pdf_bytes),
        total_pages=extracted["total_pages"],
        total_chunks=extracted["total_chunks"],
        word_count=extracted["word_count"],
        status=DocumentStatus(extracted["status"]),
        status_message=extracted["status_message"],
        upload_timestamp=doc_data["upload_timestamp"]
    )

@router.get("", response_model=list[DocumentInfo])
async def list_documents():
    """List all uploaded and sample documents."""
    docs = storage_service.list_documents()
    return [
        DocumentInfo(
            id=d["id"],
            filename=d["filename"],
            file_size_bytes=d["file_size_bytes"],
            total_pages=d["total_pages"],
            total_chunks=d["total_chunks"],
            word_count=d["word_count"],
            status=DocumentStatus(d.get("status", "ready")),
            status_message=d.get("status_message"),
            upload_timestamp=d["upload_timestamp"]
        )
        for d in docs
    ]

@router.get("/{doc_id}", response_model=DocumentDetail)
async def get_document(doc_id: str):
    """Get detailed document information including page previews."""
    doc = storage_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    pages = [
        DocumentPage(
            page_number=p["page_number"],
            char_count=p["char_count"],
            preview_text=p["preview_text"]
        )
        for p in doc.get("pages", [])
    ]

    return DocumentDetail(
        id=doc["id"],
        filename=doc["filename"],
        file_size_bytes=doc["file_size_bytes"],
        total_pages=doc["total_pages"],
        total_chunks=doc["total_chunks"],
        word_count=doc["word_count"],
        status=DocumentStatus(doc.get("status", "ready")),
        status_message=doc.get("status_message"),
        upload_timestamp=doc["upload_timestamp"],
        pages=pages
    )

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its indexed vector chunks."""
    doc = storage_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    rag_service.delete_document(doc_id)
    storage_service.delete_document(doc_id)
    return {"message": "Document deleted successfully", "id": doc_id}
