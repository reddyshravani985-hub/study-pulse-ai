from fastapi import APIRouter, HTTPException, status
from app.models.schemas import SummaryRequest, SummaryResponse
from app.services.storage_service import storage_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/summarize", tags=["summarize"])

@router.post("", response_model=SummaryResponse)
async def summarize_document(req: SummaryRequest):
    """
    Generate an AI study summary for a document: short, medium, or detailed,
    with executive summary, key concepts, definitions, formulas, and revision points.
    """
    doc = storage_service.get_document(req.document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {req.document_id} was not found."
        )

    full_text = doc.get("full_text", "")
    chunks = doc.get("chunks", [])

    if not full_text.strip() or len(full_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The document does not contain sufficient text to summarize."
        )

    summary = ai_service.generate_summary(
        doc_id=doc["id"],
        doc_name=doc["filename"],
        full_text=full_text,
        chunks=chunks,
        length=req.length
    )

    return summary
