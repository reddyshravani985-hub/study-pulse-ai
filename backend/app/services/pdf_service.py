import re
import fitz  # PyMuPDF
from typing import Dict, List, Any, Tuple
from app.config import settings

class PDFService:
    @staticmethod
    def extract_and_chunk_pdf(pdf_bytes: bytes, doc_id: str, filename: str) -> Dict[str, Any]:
        """
        Extract text from PDF preserving page numbers, detect scanned/empty PDFs,
        and generate overlapping text chunks with page attribution.
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Corrupted or invalid PDF file: {str(e)}")

        total_pages = len(doc)
        if total_pages == 0:
            return {
                "status": "error",
                "status_message": "The PDF document contains 0 pages.",
                "total_pages": 0,
                "total_chunks": 0,
                "word_count": 0,
                "pages": [],
                "chunks": [],
                "full_text": ""
            }

        pages_data: List[Dict[str, Any]] = []
        all_chunks: List[Dict[str, Any]] = []
        full_text_list: List[str] = []
        total_chars = 0
        total_words = 0

        chunk_counter = 0

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            raw_text = page.get_text("text") or ""
            # Normalize whitespace
            cleaned_text = re.sub(r'[ \t]+', ' ', raw_text).strip()
            
            char_count = len(cleaned_text)
            words = cleaned_text.split()
            word_count = len(words)
            
            total_chars += char_count
            total_words += word_count
            
            pages_data.append({
                "page_number": page_num,
                "char_count": char_count,
                "preview_text": cleaned_text[:200] + ("..." if len(cleaned_text) > 200 else ""),
                "full_text": cleaned_text
            })
            
            if cleaned_text:
                full_text_list.append(f"--- Page {page_num} ---\n{cleaned_text}")

                # Create chunks for this page
                page_chunks = PDFService._chunk_page_text(
                    cleaned_text,
                    page_num=page_num,
                    doc_id=doc_id,
                    start_chunk_idx=chunk_counter,
                    chunk_size=settings.CHUNK_SIZE,
                    overlap=settings.CHUNK_OVERLAP
                )
                chunk_counter += len(page_chunks)
                all_chunks.extend(page_chunks)

        doc.close()

        # Check for scanned or empty document
        status = "ready"
        status_message = "Document processed successfully."

        if total_chars < 50:
            status = "scanned_warning"
            status_message = (
                "This document appears to be an image-only or scanned PDF without selectable text. "
                "Only minimal text was found. Optical Character Recognition (OCR) is recommended."
            )
        elif all_chunks == 0:
            status = "error"
            status_message = "No text content could be extracted from this document."

        full_document_text = "\n\n".join(full_text_list)

        return {
            "status": status,
            "status_message": status_message,
            "total_pages": total_pages,
            "total_chunks": len(all_chunks),
            "word_count": total_words,
            "pages": pages_data,
            "chunks": all_chunks,
            "full_text": full_document_text
        }

    @staticmethod
    def _chunk_page_text(
        text: str,
        page_num: int,
        doc_id: str,
        start_chunk_idx: int,
        chunk_size: int = 800,
        overlap: int = 150
    ) -> List[Dict[str, Any]]:
        """
        Split a page's text into overlapping chunks, attempting sentence boundaries.
        """
        if not text:
            return []

        if len(text) <= chunk_size:
            return [{
                "chunk_id": f"{doc_id}_c{start_chunk_idx}",
                "doc_id": doc_id,
                "page_number": page_num,
                "text": text,
                "char_count": len(text)
            }]

        chunks = []
        current_start = 0
        text_length = len(text)
        current_idx = start_chunk_idx

        while current_start < text_length:
            end = min(current_start + chunk_size, text_length)
            
            # If not at the end, try to find a natural sentence break (. ! ? \n)
            if end < text_length:
                # Look backwards up to 100 chars for punctuation
                lookback = text[max(current_start, end - 100):end]
                match = re.search(r'[.!?\n]\s+', lookback)
                if match:
                    end = max(current_start, end - 100) + match.end()

            chunk_text = text[current_start:end].strip()
            if chunk_text:
                chunks.append({
                    "chunk_id": f"{doc_id}_c{current_idx}",
                    "doc_id": doc_id,
                    "page_number": page_num,
                    "text": chunk_text,
                    "char_count": len(chunk_text)
                })
                current_idx += 1

            if end >= text_length:
                break

            current_start = max(current_start + 1, end - overlap)

        return chunks

pdf_service = PDFService()
