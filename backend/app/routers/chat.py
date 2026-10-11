from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.services.storage_service import storage_service
from app.services.rag_service import rag_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def ask_question(req: ChatRequest):
    """
    RAG-powered conversational QA answering questions strictly based on the uploaded notes.
    Cites specific page numbers and clearly indicates if information is outside the material.
    """
    if not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question message cannot be empty."
        )

    doc = storage_service.get_document(req.document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {req.document_id} was not found."
        )

    # Retrieve top 5 most relevant passages from ChromaDB
    retrieved_chunks = rag_service.query_relevant_chunks(
        doc_id=req.document_id,
        query=req.message,
        top_k=5,
        gemini_client=ai_service.get_client()
    )

    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

    response = ai_service.answer_question_rag(
        doc_id=req.document_id,
        question=req.message,
        retrieved_chunks=retrieved_chunks,
        conversation_history=history_dicts
    )

    return response
