import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.config import settings

class StorageService:
    def __init__(self):
        self.meta_file = settings.DATA_DIR / "documents_meta.json"
        self.quizzes_file = settings.DATA_DIR / "quizzes.json"
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.quizzes: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if self.meta_file.exists():
            try:
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception:
                self.documents = {}

        if self.quizzes_file.exists():
            try:
                with open(self.quizzes_file, "r", encoding="utf-8") as f:
                    self.quizzes = json.load(f)
            except Exception:
                self.quizzes = {}

    def _save_docs(self):
        try:
            with open(self.meta_file, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving document metadata: {e}")

    def _save_quizzes(self):
        try:
            with open(self.quizzes_file, "w", encoding="utf-8") as f:
                json.dump(self.quizzes, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving quizzes: {e}")

    # Document management
    def save_document(self, doc_data: Dict[str, Any]):
        doc_id = doc_data["id"]
        self.documents[doc_id] = doc_data
        self._save_docs()

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return self.documents.get(doc_id)

    def list_documents(self) -> List[Dict[str, Any]]:
        # Return sorted by upload_timestamp descending
        docs = list(self.documents.values())
        return sorted(docs, key=lambda x: x.get("upload_timestamp", ""), reverse=True)

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            self._save_docs()
            return True
        return False

    # Quiz management
    def save_quiz(self, quiz_data: Dict[str, Any]):
        quiz_id = quiz_data["quiz_id"]
        self.quizzes[quiz_id] = quiz_data
        self._save_quizzes()

    def get_quiz(self, quiz_id: str) -> Optional[Dict[str, Any]]:
        return self.quizzes.get(quiz_id)

storage_service = StorageService()
