from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DocumentStatus(str, Enum):
    READY = "ready"
    PROCESSING = "processing"
    SCANNED_WARNING = "scanned_warning"
    ERROR = "error"

class DocumentInfo(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    total_pages: int
    total_chunks: int
    word_count: int
    status: DocumentStatus
    status_message: Optional[str] = None
    upload_timestamp: str

class DocumentPage(BaseModel):
    page_number: int
    char_count: int
    preview_text: str

class DocumentDetail(DocumentInfo):
    pages: List[DocumentPage] = []

# --- Summarization Models ---

class SummaryLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    DETAILED = "detailed"

class SummaryRequest(BaseModel):
    document_id: str
    length: SummaryLength = SummaryLength.MEDIUM

class DefinitionItem(BaseModel):
    term: str
    definition: str

class FormulaItem(BaseModel):
    formula: str
    explanation: str

class SummaryResponse(BaseModel):
    document_id: str
    document_name: str
    length: SummaryLength
    executive_summary: str
    key_concepts: List[str] = Field(default_factory=list)
    definitions: List[DefinitionItem] = Field(default_factory=list)
    formulas: List[FormulaItem] = Field(default_factory=list)
    revision_points: List[str] = Field(default_factory=list)
    generated_at: str

# --- Chat / RAG Models ---

class ChatSource(BaseModel):
    chunk_id: str
    page_number: int
    excerpt: str
    relevance_score: Optional[float] = None

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    document_id: str
    message: str
    history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource] = Field(default_factory=list)
    pages_cited: List[int] = Field(default_factory=list)
    is_supported: bool = True

# --- Quiz Models ---

class QuizDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_answer_index: int = Field(..., ge=0, le=3)
    explanation: str
    source_page: Optional[int] = None
    topic: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    document_id: str
    num_questions: int = Field(5, ge=1, le=15)
    difficulty: QuizDifficulty = QuizDifficulty.MEDIUM

class QuizResponse(BaseModel):
    quiz_id: str
    document_id: str
    document_name: str
    difficulty: QuizDifficulty
    total_questions: int
    questions: List[QuizQuestion]

class QuizSubmitAnswer(BaseModel):
    question_id: int
    selected_option_index: Optional[int] = None

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[QuizSubmitAnswer]

class QuizGradedQuestion(BaseModel):
    question_id: int
    question: str
    options: List[str]
    selected_option_index: Optional[int] = None
    correct_answer_index: int
    is_correct: bool
    explanation: str
    source_page: Optional[int] = None

class QuizResultResponse(BaseModel):
    quiz_id: str
    document_id: str
    total_questions: int
    score: int
    percentage: float
    grade_letter: str
    feedback: str
    details: List[QuizGradedQuestion]

# --- Health / API Key ---

class APIKeyStatus(BaseModel):
    configured: bool
    source: str # "environment" or "runtime"
    model: str
    embedding_model: str
