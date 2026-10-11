import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import documents, summarize, chat, quiz, health

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI-powered Student Study Assistant",
    version="1.0.0"
)

# CORS Configuration for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected internal error occurred: {str(exc)}"}
    )

# Include Routers with versioned prefix /api/v1
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(summarize.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(quiz.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)

# Also support /api/* aliases for proxy convenience
app.include_router(documents.router, prefix="/api")
app.include_router(summarize.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(health.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "ready"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
