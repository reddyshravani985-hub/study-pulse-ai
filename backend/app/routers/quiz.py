from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    QuizGenerateRequest,
    QuizResponse,
    QuizSubmission,
    QuizResultResponse
)
from app.services.storage_service import storage_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(req: QuizGenerateRequest):
    """
    Generate interactive practice multiple-choice questions from the uploaded notes.
    Validates with Pydantic and includes 4 options, answer key, and rationale.
    """
    doc = storage_service.get_document(req.document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {req.document_id} was not found."
        )

    full_text = doc.get("full_text", "")
    if not full_text.strip() or len(full_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The document does not contain sufficient study text to generate a quiz."
        )

    quiz = ai_service.generate_quiz(
        doc_id=doc["id"],
        doc_name=doc["filename"],
        context_text=full_text,
        num_questions=req.num_questions,
        difficulty=req.difficulty
    )

    # Save to storage for grading
    storage_service.save_quiz(quiz.model_dump())

    return quiz

@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(submission: QuizSubmission):
    """
    Grade a student's quiz submission, computing score percentage,
    grade letter, and detailed explanations for every question.
    """
    quiz_data = storage_service.get_quiz(submission.quiz_id)
    if not quiz_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz session with ID {submission.quiz_id} was not found."
        )

    result = ai_service.grade_quiz(
        quiz_data=quiz_data,
        user_answers=submission.answers
    )

    return result

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: str):
    """Retrieve an existing generated quiz session."""
    quiz_data = storage_service.get_quiz(quiz_id)
    if not quiz_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz session with ID {quiz_id} was not found."
        )
    return QuizResponse(**quiz_data)
