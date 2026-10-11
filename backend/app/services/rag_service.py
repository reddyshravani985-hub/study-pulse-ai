import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

class RAGService:
    def __init__(self):
        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(settings.CHROMA_PERSIST_DIR),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection_name = "study_notes_rag"
        # Collection uses Chroma's default embedding function by default,
        # which allows offline/fallback support as well as custom embeddings.
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Study Assistant PDF chunks"}
        )

    def add_document_chunks(
        self,
        doc_id: str,
        chunks: List[Dict[str, Any]],
        gemini_client: Optional[Any] = None
    ) -> bool:
        """
        Store chunks in ChromaDB with metadata. Uses Gemini text-embedding-004
        if gemini_client is available, otherwise uses Chroma's built-in embedding.
        """
        if not chunks:
            return True

        # Remove any existing chunks for this document first
        try:
            self.collection.delete(where={"document_id": doc_id})
        except Exception:
            pass

        ids = [chunk["chunk_id"] for chunk in chunks]
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [
            {
                "document_id": doc_id,
                "page_number": int(chunk["page_number"]),
                "char_count": int(chunk["char_count"])
            }
            for chunk in chunks
        ]

        embeddings = None
        if gemini_client and settings.GEMINI_API_KEY:
            try:
                embeddings = self._get_gemini_embeddings(texts, gemini_client)
            except Exception as e:
                print(f"Warning: Gemini embedding failed ({e}), falling back to Chroma default embedding.")
                embeddings = None

        # Add in batches of 50
        batch_size = 50
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_texts = texts[i:i + batch_size]
            batch_metadatas = metadatas[i:i + batch_size]
            
            if embeddings:
                batch_embeddings = embeddings[i:i + batch_size]
                self.collection.add(
                    ids=batch_ids,
                    documents=batch_texts,
                    metadatas=batch_metadatas,
                    embeddings=batch_embeddings
                )
            else:
                self.collection.add(
                    ids=batch_ids,
                    documents=batch_texts,
                    metadatas=batch_metadatas
                )

        return True

    def _get_gemini_embeddings(self, texts: List[str], gemini_client: Any) -> List[List[float]]:
        """
        Generate embeddings using Google GenAI SDK.
        """
        all_embeddings: List[List[float]] = []
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            res = gemini_client.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=batch,
            )
            if hasattr(res, "embeddings"):
                for emb in res.embeddings:
                    all_embeddings.append(emb.values)
            else:
                raise ValueError("Unexpected response structure from embed_content")
        return all_embeddings

    def query_relevant_chunks(
        self,
        doc_id: str,
        query: str,
        top_k: int = 5,
        gemini_client: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve the top_k most relevant chunks for a document.
        """
        results = []
        query_embeddings = None

        if gemini_client and settings.GEMINI_API_KEY:
            try:
                res = gemini_client.models.embed_content(
                    model=settings.EMBEDDING_MODEL,
                    contents=[query],
                )
                if hasattr(res, "embeddings") and len(res.embeddings) > 0:
                    query_embeddings = [res.embeddings[0].values]
            except Exception as e:
                print(f"Warning: Gemini query embedding failed ({e}), using query text search.")
                query_embeddings = None

        try:
            where_filter = {"document_id": doc_id}

            if query_embeddings:
                query_res = self.collection.query(
                    query_embeddings=query_embeddings,
                    where=where_filter,
                    n_results=top_k
                )
            else:
                query_res = self.collection.query(
                    query_texts=[query],
                    where=where_filter,
                    n_results=top_k
                )

            docs = query_res.get("documents", [[]])[0]
            ids = query_res.get("ids", [[]])[0]
            metas = query_res.get("metadatas", [[]])[0]
            distances = query_res.get("distances", [[]])[0] if query_res.get("distances") else []

            for idx, text in enumerate(docs):
                meta = metas[idx] if idx < len(metas) else {}
                chunk_id = ids[idx] if idx < len(ids) else f"chunk_{idx}"
                dist = distances[idx] if idx < len(distances) else None
                # Normalize distance to relevance score (0.0 to 1.0)
                relevance = None
                if dist is not None:
                    relevance = max(0.0, round(1.0 - (dist / 2.0), 3))

                results.append({
                    "chunk_id": chunk_id,
                    "page_number": int(meta.get("page_number", 1)),
                    "text": text,
                    "relevance_score": relevance
                })

        except Exception as e:
            print(f"Error querying ChromaDB: {e}")
            return []

        # Sort by page number then relevance
        return results

    def delete_document(self, doc_id: str):
        try:
            self.collection.delete(where={"document_id": doc_id})
        except Exception as e:
            print(f"Error deleting chunks for {doc_id}: {e}")

rag_service = RAGService()
