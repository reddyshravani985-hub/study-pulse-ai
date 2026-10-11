import os
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from google import genai
from google.genai import types

from app.config import settings
from app.models.schemas import (
    SummaryLength,
    SummaryResponse,
    DefinitionItem,
    FormulaItem,
    ChatResponse,
    ChatSource,
    QuizResponse,
    QuizQuestion,
    QuizDifficulty,
    QuizResultResponse,
    QuizGradedQuestion,
    QuizSubmitAnswer,
)

class AIService:
    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._init_client()

    def _init_client(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")
                self._client = None
        else:
            self._client = None

    def set_api_key(self, api_key: str):
        settings.GEMINI_API_KEY = api_key.strip()
        self._init_client()

    def is_configured(self) -> bool:
        return self._client is not None

    def get_client(self) -> Optional[genai.Client]:
        if not self._client and settings.GEMINI_API_KEY:
            self._init_client()
        return self._client

    # -------------------------------------------------------------
    # Feature 2: Summarization (with Hierarchical support for long docs)
    # -------------------------------------------------------------
    def generate_summary(
        self,
        doc_id: str,
        doc_name: str,
        full_text: str,
        chunks: List[Dict[str, Any]],
        length: SummaryLength = SummaryLength.MEDIUM
    ) -> SummaryResponse:
        client = self.get_client()

        if not client:
            return self._generate_fallback_summary(doc_id, doc_name, full_text, length)

        try:
            # Check if long document needs hierarchical summarization
            # If text is longer than 15,000 characters or more than 8 chunks
            if len(full_text) > 15000 and len(chunks) > 8:
                context_for_summary = self._hierarchical_summarize(chunks, client)
            else:
                context_for_summary = full_text[:25000] # Safe token limit for flash

            length_instruction = {
                SummaryLength.SHORT: "Provide a concise high-level overview (1-2 crisp paragraphs) with 3-4 key concepts and 3 core revision points.",
                SummaryLength.MEDIUM: "Provide a balanced, structured summary (3-4 paragraphs) covering the main arguments, with 5-7 key concepts, definitions, formulas if present, and 5 revision points.",
                SummaryLength.DETAILED: "Provide an in-depth comprehensive breakdown (5+ paragraphs) explaining all major themes thoroughly, comprehensive list of concepts, all definitions, formulas if any, and detailed revision points."
            }.get(length, "Provide a balanced summary.")

            prompt = f"""
You are an expert academic tutor and study assistant.
Analyze the following student study notes and create a high quality study guide.

Summary style requested: {length.value.upper()}
Instructions for style: {length_instruction}

Study Notes Context:
\"\"\"
{context_for_summary}
\"\"\"

You MUST respond strictly with a valid JSON object matching this schema:
{{
  "executive_summary": "A coherent, well-structured explanation of the notes according to the requested length style.",
  "key_concepts": ["Core concept 1 with brief explanation", "Core concept 2 with brief explanation"],
  "definitions": [
    {{"term": "Term Name", "definition": "Clear concise definition from the text"}}
  ],
  "formulas": [
    {{"formula": "Formula or key rule/equation", "explanation": "What each variable or component means"}}
  ],
  "revision_points": ["Quick review bullet 1", "Quick review bullet 2"]
}}

Note: If no formulas or mathematical equations exist in the text, you may leave the "formulas" list empty.
Return ONLY raw JSON, with no markdown code fences.
"""

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )

            response_text = response.text.strip()
            # Clean possible markdown wrapping if any
            if response_text.startswith("```"):
                response_text = re.sub(r"^```(?:json)?\n", "", response_text)
                response_text = re.sub(r"\n```$", "", response_text)

            data = json.loads(response_text)

            return SummaryResponse(
                document_id=doc_id,
                document_name=doc_name,
                length=length,
                executive_summary=data.get("executive_summary", "Summary unavailable."),
                key_concepts=data.get("key_concepts", []),
                definitions=[
                    DefinitionItem(term=d.get("term", ""), definition=d.get("definition", ""))
                    for d in data.get("definitions", [])
                    if d.get("term")
                ],
                formulas=[
                    FormulaItem(formula=f.get("formula", ""), explanation=f.get("explanation", ""))
                    for f in data.get("formulas", [])
                    if f.get("formula")
                ],
                revision_points=data.get("revision_points", []),
                generated_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            print(f"Gemini summarization error: {e}")
            return self._generate_fallback_summary(doc_id, doc_name, full_text, length, error=str(e))

    def _hierarchical_summarize(self, chunks: List[Dict[str, Any]], client: genai.Client) -> str:
        """
        Group chunks into section clusters, summarize each section, and return the joined intermediate summaries.
        """
        cluster_size = 5
        intermediate_summaries = []

        for i in range(0, len(chunks), cluster_size):
            cluster = chunks[i:i + cluster_size]
            cluster_text = "\n\n".join([f"[Page {c['page_number']}] {c['text']}" for c in cluster])
            
            prompt = f"""
Summarize the key takeaways and concepts from this section of study notes:
\"\"\"
{cluster_text}
\"\"\"
Include important terms, equations, and facts.
"""
            try:
                res = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.2)
                )
                if res.text:
                    intermediate_summaries.append(res.text.strip())
            except Exception as e:
                print(f"Hierarchical intermediate summarization failed: {e}")
                # Fallback to raw text
                intermediate_summaries.append(cluster_text[:2000])

        return "\n\n=== Section Summary ===\n".join(intermediate_summaries)

    # -------------------------------------------------------------
    # Feature 3: AI Question Answering with RAG
    # -------------------------------------------------------------
    def answer_question_rag(
        self,
        doc_id: str,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> ChatResponse:
        client = self.get_client()

        # Format sources for response
        sources = [
            ChatSource(
                chunk_id=c["chunk_id"],
                page_number=c["page_number"],
                excerpt=c["text"][:250] + ("..." if len(c["text"]) > 250 else ""),
                relevance_score=c.get("relevance_score")
            )
            for c in retrieved_chunks
        ]

        if not client:
            return self._generate_fallback_chat(question, retrieved_chunks, sources)

        # Build context string with explicit page markers
        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks):
            context_blocks.append(
                f"[Source Passage {idx+1} | Page {chunk['page_number']}]:\n{chunk['text']}"
            )
        context_str = "\n\n".join(context_blocks)

        prompt = f"""
You are an academic study assistant helping a student understand their uploaded course material.
Your task is to answer the student's question accurately using ONLY the provided study material passages.

RULES:
1. Answer directly, clearly, and concisely based strictly on the provided passages.
2. Explicitly cite the page numbers where the information is found, using the format [Page X].
3. CRITICAL: If the provided study notes do NOT contain sufficient information to answer the question, you MUST clearly state:
   "This information is not found in the uploaded study notes."
   Do NOT extrapolate or invent facts beyond what is in the text.
4. If the question is partially answered, answer what is present in the notes, cite the page, and note what aspect is missing.

Retrieved Study Material Passages:
\"\"\"
{context_str}
\"\"\"

Student's Question:
{question}

Provide your response in JSON format with the following keys:
{{
  "answer": "Your detailed answer citing [Page X] or clearly stating the information is not found in the notes.",
  "pages_cited": [1, 2],
  "is_supported": true or false (false if the notes do not have the answer)
}}
Return ONLY valid JSON.
"""

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )

            res_text = response.text.strip()
            if res_text.startswith("```"):
                res_text = re.sub(r"^```(?:json)?\n", "", res_text)
                res_text = re.sub(r"\n```$", "", res_text)

            data = json.loads(res_text)

            pages_cited = data.get("pages_cited", [])
            # Also extract page citations with regex if empty
            if not pages_cited:
                regex_pages = [int(p) for p in re.findall(r'\[Page\s+(\d+)\]', data.get("answer", ""))]
                pages_cited = list(sorted(set(regex_pages)))

            is_supported = data.get("is_supported", True)
            if "not found in the uploaded study notes" in data.get("answer", "").lower():
                is_supported = False

            return ChatResponse(
                answer=data.get("answer", "No answer could be generated."),
                sources=sources,
                pages_cited=pages_cited,
                is_supported=is_supported
            )

        except Exception as e:
            print(f"Gemini Q&A error: {e}")
            return self._generate_fallback_chat(question, retrieved_chunks, sources, error=str(e))

    # -------------------------------------------------------------
    # Feature 4: Practice Quiz Generator
    # -------------------------------------------------------------
    def generate_quiz(
        self,
        doc_id: str,
        doc_name: str,
        context_text: str,
        num_questions: int = 5,
        difficulty: QuizDifficulty = QuizDifficulty.MEDIUM
    ) -> QuizResponse:
        import uuid
        quiz_id = str(uuid.uuid4())[:8]

        client = self.get_client()

        if not client:
            return self._generate_fallback_quiz(quiz_id, doc_id, doc_name, num_questions, difficulty)

        prompt = f"""
You are an expert professor and assessment creator.
Generate a high quality multiple-choice practice quiz for a student based strictly on the provided study notes.

Parameters:
- Number of questions: {num_questions}
- Target Difficulty: {difficulty.value.upper()}
  * Easy: Straightforward recall, definitions, direct facts.
  * Medium: Conceptual understanding, relationships, practical application.
  * Hard: Analysis, edge cases, synthesis of multiple ideas, complex problem-solving.

Study Notes Content:
\"\"\"
{context_text[:20000]}
\"\"\"

REQUIREMENTS FOR EACH QUESTION:
1. Four distinct, plausible answer options.
2. Exactly one correct answer.
3. Index of correct answer (0 for option 1, 1 for option 2, 2 for option 3, 3 for option 4).
4. Detailed explanation explaining why the correct answer is right and why the other options are incorrect.
5. If a page reference is identifiable in the text (e.g. 'Page X'), include it as an integer in 'source_page'.

Output format MUST be a strict JSON object:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Clear, challenging question prompt?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer_index": 0,
      "explanation": "Why Option A is correct based on the study notes...",
      "source_page": 1,
      "topic": "Key topic name"
    }}
  ]
}}
Return ONLY valid JSON.
"""

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )

            res_text = response.text.strip()
            if res_text.startswith("```"):
                res_text = re.sub(r"^```(?:json)?\n", "", res_text)
                res_text = re.sub(r"\n```$", "", res_text)

            data = json.loads(res_text)
            raw_questions = data.get("questions", [])

            validated_questions: List[QuizQuestion] = []
            for i, q in enumerate(raw_questions[:num_questions]):
                options = q.get("options", [])
                # Ensure 4 options
                while len(options) < 4:
                    options.append(f"Additional Option {len(options)+1}")
                options = options[:4]

                corr_idx = q.get("correct_answer_index", 0)
                if not isinstance(corr_idx, int) or corr_idx < 0 or corr_idx > 3:
                    corr_idx = 0

                validated_questions.append(
                    QuizQuestion(
                        id=i + 1,
                        question=q.get("question", f"Question {i+1}"),
                        options=options,
                        correct_answer_index=corr_idx,
                        explanation=q.get("explanation", "Correct based on the study material."),
                        source_page=q.get("source_page"),
                        topic=q.get("topic")
                    )
                )

            return QuizResponse(
                quiz_id=quiz_id,
                document_id=doc_id,
                document_name=doc_name,
                difficulty=difficulty,
                total_questions=len(validated_questions),
                questions=validated_questions
            )

        except Exception as e:
            print(f"Gemini Quiz generation error: {e}")
            return self._generate_fallback_quiz(quiz_id, doc_id, doc_name, num_questions, difficulty, error=str(e))

    # -------------------------------------------------------------
    # Quiz Grading and Analytics
    # -------------------------------------------------------------
    def grade_quiz(
        self,
        quiz_data: Dict[str, Any],
        user_answers: List[QuizSubmitAnswer]
    ) -> QuizResultResponse:
        questions_map = {q["id"]: q for q in quiz_data["questions"]}
        answer_map = {a.question_id: a.selected_option_index for a in user_answers}

        total_questions = len(quiz_data["questions"])
        correct_count = 0
        details: List[QuizGradedQuestion] = []

        for q_dict in quiz_data["questions"]:
            q_id = q_dict["id"]
            selected_idx = answer_map.get(q_id)
            correct_idx = q_dict["correct_answer_index"]
            is_correct = (selected_idx is not None and selected_idx == correct_idx)

            if is_correct:
                correct_count += 1

            details.append(
                QuizGradedQuestion(
                    question_id=q_id,
                    question=q_dict["question"],
                    options=q_dict["options"],
                    selected_option_index=selected_idx,
                    correct_answer_index=correct_idx,
                    is_correct=is_correct,
                    explanation=q_dict["explanation"],
                    source_page=q_dict.get("source_page")
                )
            )

        percentage = round((correct_count / max(1, total_questions)) * 100, 1)

        if percentage >= 90:
            grade_letter = "A+"
            feedback = "Outstanding! You have mastered this study material."
        elif percentage >= 80:
            grade_letter = "A"
            feedback = "Great work! Solid understanding of the core concepts."
        elif percentage >= 70:
            grade_letter = "B"
            feedback = "Good effort! Review the missed questions to reinforce key definitions."
        elif percentage >= 60:
            grade_letter = "C"
            feedback = "Passing grade, but several fundamental concepts need revision."
        else:
            grade_letter = "Needs Revision"
            feedback = "Recommended: Reread the highlighted study notes and try the quiz again."

        return QuizResultResponse(
            quiz_id=quiz_data["quiz_id"],
            document_id=quiz_data["document_id"],
            total_questions=total_questions,
            score=correct_count,
            percentage=percentage,
            grade_letter=grade_letter,
            feedback=feedback,
            details=details
        )

    # -------------------------------------------------------------
    # Fallback / Demo generators when GEMINI_API_KEY is not configured
    # -------------------------------------------------------------
    def _generate_fallback_summary(
        self,
        doc_id: str,
        doc_name: str,
        full_text: str,
        length: SummaryLength,
        error: Optional[str] = None
    ) -> SummaryResponse:
        # Extract first few sentences and lines from text
        lines = [line.strip() for line in full_text.split("\n") if line.strip() and not line.startswith("---")]
        preview = " ".join(lines[:6]) if lines else "Uploaded document summary."
        
        notice = " [Note: Add GEMINI_API_KEY to backend/.env for AI synthesis]" if not settings.GEMINI_API_KEY else ""

        key_concepts = [
            f"Overview of core topics discussed in {doc_name}",
            "Key principles and methodologies outlined in the text",
            "Synthesized findings and analytical observations"
        ]

        definitions = [
            DefinitionItem(
                term="Primary Subject",
                definition=f"The central academic discipline and topics introduced in {doc_name}."
            ),
            DefinitionItem(
                term="Key Terminology",
                definition="Fundamental vocabulary and concepts defined throughout the lecture notes."
            )
        ]

        formulas = []
        # Check if text mentions formulas
        if any(w in full_text.lower() for w in ["formula", "equation", "=", "theorem"]):
            formulas.append(
                FormulaItem(
                    formula="Mathematical / Theoretical Expression",
                    explanation="Key quantitative formula referenced in the study text."
                )
            )

        revision_points = [
            f"Review the foundational concepts established in the introductory sections of {doc_name}.",
            "Pay close attention to key definitions and technical terminology.",
            "Use the 'Ask AI' tab to query specific definitions and page references.",
            "Test your knowledge using the Practice Quiz generator."
        ]

        if length == SummaryLength.SHORT:
            exec_summary = f"{preview[:350]}...{notice}"
        elif length == SummaryLength.DETAILED:
            exec_summary = (
                f"Comprehensive Study Guide for {doc_name}.\n\n"
                f"{preview}\n\n"
                f"The material details foundational theory, procedural frameworks, and relevant examples. "
                f"Students should focus on the interconnected relationships between the primary definitions and applied methods.{notice}"
            )
        else:
            exec_summary = f"{preview[:600]}...{notice}"

        return SummaryResponse(
            document_id=doc_id,
            document_name=doc_name,
            length=length,
            executive_summary=exec_summary,
            key_concepts=key_concepts,
            definitions=definitions,
            formulas=formulas,
            revision_points=revision_points,
            generated_at=datetime.utcnow().isoformat()
        )

    def _generate_fallback_chat(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        sources: List[ChatSource],
        error: Optional[str] = None
    ) -> ChatResponse:
        pages = list(sorted(set([c["page_number"] for c in retrieved_chunks])))
        
        if not retrieved_chunks:
            return ChatResponse(
                answer="This information is not found in the uploaded study notes.",
                sources=[],
                pages_cited=[],
                is_supported=False
            )

        best_chunk = retrieved_chunks[0]
        page_num = best_chunk["page_number"]
        
        # Check if meaningful query tokens appear in retrieved chunks (exclude stop words)
        stopwords = {
            "a", "an", "the", "is", "are", "was", "were", "what", "who", "which",
            "where", "when", "why", "how", "in", "on", "at", "by", "for", "with",
            "about", "against", "between", "into", "through", "during", "before",
            "after", "above", "below", "to", "from", "up", "down", "in", "out",
            "of", "off", "over", "under", "again", "further", "then", "once",
            "here", "there", "all", "any", "both", "each", "few", "more", "most",
            "other", "some", "such", "no", "nor", "not", "only", "own", "same",
            "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
            "should", "now", "does", "did", "do"
        }
        q_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', question.lower())) - stopwords
        chunk_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', best_chunk["text"].lower()))
        overlap = q_words.intersection(chunk_words)

        if not overlap:
            return ChatResponse(
                answer="This information is not found in the uploaded study notes.",
                sources=[],
                pages_cited=[],
                is_supported=False
            )

        answer_text = (
            f"Based on your study notes [Page {page_num}]:\n\n"
            f"\"{best_chunk['text'][:350]}...\"\n\n"
            f"(Configure GEMINI_API_KEY in backend/.env for AI reasoning and direct synthesis)."
        )

        return ChatResponse(
            answer=answer_text,
            sources=sources,
            pages_cited=[page_num],
            is_supported=True
        )

    def _generate_fallback_quiz(
        self,
        quiz_id: str,
        doc_id: str,
        doc_name: str,
        num_questions: int,
        difficulty: QuizDifficulty,
        error: Optional[str] = None
    ) -> QuizResponse:
        questions: List[QuizQuestion] = []
        for i in range(min(num_questions, 5)):
            q_num = i + 1
            questions.append(
                QuizQuestion(
                    id=q_num,
                    question=f"Which of the following is a primary concept covered in {doc_name} regarding Section {q_num}?",
                    options=[
                        f"Core foundational definition introduced in Topic {q_num}",
                        "An unrelated historical principle from an external field",
                        "A disproven hypothesis contradictory to the text",
                        "A placeholder assumption without experimental backing"
                    ],
                    correct_answer_index=0,
                    explanation=f"Option A directly reflects the concepts presented in {doc_name}. Options B, C, and D are distractors.",
                    source_page=q_num,
                    topic=f"Study Concept {q_num}"
                )
            )

        return QuizResponse(
            quiz_id=quiz_id,
            document_id=doc_id,
            document_name=doc_name,
            difficulty=difficulty,
            total_questions=len(questions),
            questions=questions
        )

ai_service = AIService()
