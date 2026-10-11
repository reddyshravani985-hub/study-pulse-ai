import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root if present
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")

class Settings:
    PROJECT_NAME: str = "GenAI Study Assistant"
    API_V1_STR: str = "/api/v1"
    
    # Gemini API settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-004").strip()
    
    # Storage settings
    DATA_DIR: Path = backend_dir / "data"
    CHROMA_PERSIST_DIR: Path = DATA_DIR / "chroma"
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    
    # Limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Chunking settings
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()

# Ensure required directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
