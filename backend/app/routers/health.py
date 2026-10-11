from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings
from app.services.ai_service import ai_service
from app.services.storage_service import storage_service
from app.models.schemas import APIKeyStatus

router = APIRouter(prefix="/health", tags=["health"])

class SetAPIKeyRequest(BaseModel):
    api_key: str

@router.get("")
async def health_check():
    docs_count = len(storage_service.list_documents())
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "documents_loaded": docs_count,
        "gemini_configured": ai_service.is_configured(),
        "model": settings.GEMINI_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL
    }

@router.get("/api-key", response_model=APIKeyStatus)
async def get_api_key_status():
    configured = ai_service.is_configured()
    source = "environment" if settings.GEMINI_API_KEY else "none"
    return APIKeyStatus(
        configured=configured,
        source=source,
        model=settings.GEMINI_MODEL,
        embedding_model=settings.EMBEDDING_MODEL
    )

@router.post("/api-key")
async def update_api_key(req: SetAPIKeyRequest):
    key = req.api_key.strip()
    ai_service.set_api_key(key)
    return {
        "configured": ai_service.is_configured(),
        "message": "Gemini API key updated successfully." if ai_service.is_configured() else "Invalid API key format."
    }
