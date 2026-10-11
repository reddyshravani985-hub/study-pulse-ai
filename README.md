# 🎓 StudyPulse AI — GenAI-Powered Student Study Assistant

A complete web application built for students to supercharge their learning workflow. Students can upload lecture notes and course materials in PDF format, generate structured multi-length AI summaries, chat with their notes with verified page citations via RAG, and generate interactive multiple-choice practice quizzes.

---

## 🌟 Key Features

### 1. 📄 Smart PDF Processing & Ingestion
- **Preserved Page Numbering**: Extracts text page-by-page using PyMuPDF (`fitz`), retaining precise page attribution for academic citations.
- **Intelligent Chunking & Overlap**: Splits notes into semantic chunks with sliding overlap for optimal vector retrieval.
- **Error & Edge-Case Handling**:
  - File size validation (up to 25MB).
  - PDF magic header checks (`%PDF`).
  - Scanned / Image-only PDF detection with clear alerts recommending OCR.
  - Empty or corrupted PDF rejection.
- **Instant Sample Material**: Built-in 1-click sample notes generator (*Artificial Intelligence & Machine Learning Fundamentals*) for instant testing.

### 2. ⚡ AI Notes Summarizer
- **Multi-Tier Length Modes**:
  - **Short**: Quick high-level review (1–2 crisp paragraphs).
  - **Medium**: Balanced, structured study guide.
  - **Detailed**: Comprehensive breakdown with in-depth analysis.
- **Hierarchical Summarization**: Automatically synthesizes long lecture documents by summarizing chunk clusters first before synthesizing master takeaways.
- **Structured Knowledge Extraction**:
  - Executive Summary.
  - Key Concepts & Principles.
  - Key Definitions & Terminology.
  - Formulas & Core Mathematical Expressions.
  - Actionable Revision Points / Checklists.
- **Export Options**: Copy directly to clipboard or download as a `.md` Markdown file.

### 3. 💬 AI Question Answering (RAG with Citations)
- **Vector Retrieval**: Indexed into **ChromaDB** with similarity search.
- **Page-Level Grounding**: Every answer cites the exact pages (e.g. `[Page 2]`, `[Page 3]`) where facts were retrieved.
- **Strict Anti-Hallucination Guardrails**: Explicitly states *"This information is not found in the uploaded study notes"* when questions are outside the provided course material.
- **Source Inspection Drawer**: Students can inspect the exact context snippets and relevance scores retrieved from the PDF.

### 4. 📝 Practice Quiz Arena
- **Customizable Quizzes**: Configure question count (3, 5, 10) and difficulty (*Easy*, *Medium*, *Hard*).
- **Strict Multiple-Choice Format**: 4 distinct options (A, B, C, D) per question, validated with **Pydantic**.
- **Interactive Quiz Taker**: Visual progress tracker, question carousel, and flagged review.
- **Instant Grading & Analytics**:
  - Percentage score and letter grade (A+, A, B, C, Needs Revision).
  - Question-by-question review showing selected option vs. correct option.
  - Step-by-step pedagogical explanations for why the correct answer is right and why distractors are wrong.
  - Retake or generate new quizzes at any time.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast HMR, component-driven UI |
| **Styling** | Tailwind CSS v4 | Dark mode, glassmorphism, responsive |
| **Icons** | Lucide React | Modern study & interface iconography |
| **Backend** | Python 3.12 + FastAPI | High-performance asynchronous API |
| **AI / LLM** | Google Gemini 2.5 Flash | Official `google-genai` Python SDK |
| **Embeddings & RAG**| ChromaDB + `text-embedding-004` | Local persistent vector store with cosine search |
| **PDF Extraction** | PyMuPDF (`fitz`) | Fast text and layout parsing |
| **Data Validation** | Pydantic v2 | Type safety and strict JSON schema validation |

---

## 📁 Project Structure

```
study-assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # Environment variables and limits
│   │   ├── main.py               # FastAPI application & CORS
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py        # Pydantic schemas (Docs, Summaries, RAG, Quiz)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── documents.py      # Upload, sample loader, listing, delete
│   │   │   ├── summarize.py      # AI Summarization endpoint
│   │   │   ├── chat.py           # RAG Q&A with citations endpoint
│   │   │   ├── quiz.py           # Quiz generation and grading endpoint
│   │   │   └── health.py         # Health check and API key manager
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── storage_service.py # Metadata and quiz session persistence
│   │       ├── pdf_service.py     # PyMuPDF extraction, validation, chunking
│   │       ├── rag_service.py     # ChromaDB vector collection & retrieval
│   │       └── ai_service.py      # Google Gemini client, prompts & fallback
│   ├── data/                     # Local storage for ChromaDB and metadata
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api.js                # Frontend API client
│   │   ├── App.jsx               # Root application component
│   │   ├── main.jsx              # Entry point
│   │   ├── index.css             # Tailwind CSS & theme tokens
│   │   └── components/
│   │       ├── Navbar.jsx        # Navigation, active doc selector, API key button
│   │       ├── DashboardView.jsx # Hero banner, stats, quick feature cards
│   │       ├── SummarizerView.jsx# Multi-length summary, concepts, formulas
│   │       ├── ChatView.jsx      # Conversational Q&A with page citations
│   │       ├── QuizView.jsx      # Quiz config, interactive taker & scorecard
│   │       ├── DocumentUploadModal.jsx # Dropzone, validation, sample loader
│   │       ├── ApiKeyModal.jsx   # Live Gemini API key configuration
│   │       └── Toast.jsx         # Animated toast feedback
│   ├── package.json
│   └── vite.config.js            # Vite config with Tailwind & proxy
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** and **npm**

---

### Step 1: Clone or Navigate to the Project

```bash
cd /Users/chinnyreddy/study-assistant
```

---

### Step 2: Configure the Backend

1. **Create and activate a Python virtual environment**:
   ```bash
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

3. **Configure your Google Gemini API Key**:
   - Copy the `.env.example` file to `backend/.env`:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Open `backend/.env` and paste your Google Gemini API key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     GEMINI_MODEL=gemini-2.5-flash
     EMBEDDING_MODEL=text-embedding-004
     MAX_FILE_SIZE_MB=25
     ```
   > 💡 **Get a free Gemini API key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
   > *Note: If no API key is provided, the application runs seamlessly in **Interactive Demo Mode**, allowing you to test all workflows.* You can also set your API key directly in the web UI!

---

### Step 3: Configure the Frontend

1. **Install Node dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

### Step 4: Run the Application

You can start the backend and frontend in two separate terminal windows:

#### Terminal 1 — Backend (FastAPI):
```bash
cd /Users/chinnyreddy/study-assistant
source backend/venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/v1/health`

#### Terminal 2 — Frontend (Vite + React):
```bash
cd /Users/chinnyreddy/study-assistant/frontend
npm run dev
```
- Web Application: **`http://127.0.0.1:5173`**

---

## 🧪 Testing the Application

### 1. Automated Integration Tests
Run the comprehensive 10-point backend integration test suite:
```bash
PYTHONPATH=backend ./backend/venv/bin/python3 -c "
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print(client.get('/api/v1/health').json())
"
```

### 2. Manual Testing in the Browser
1. Open `http://127.0.0.1:5173` in your web browser.
2. Click **"Upload PDF Notes"** or **"Load Sample Notes"** to load the pre-configured *Machine Learning Core Principles* lecture document.
3. Switch to the **Summarizer** tab and click **"Generate Summary"** (toggle between Short, Medium, and Detailed).
4. Switch to the **Ask AI** tab and ask a question (e.g. *"What is the formula for Mean Squared Error?"* or *"What is the Sigmoid function?"*). Check the cited page badges.
5. Ask an unsupported question (e.g. *"Who was the 16th president of the US?"*) and verify the anti-hallucination warning.
6. Switch to the **Practice Quiz** tab, generate a 3 or 5-question quiz, answer the questions, submit, and inspect your score and detailed explanations!

---

## 🔒 Security & Best Practices
- **API Key Security**: The Gemini API key is never bundled or exposed to frontend code; all AI calls are securely proxied through the FastAPI backend.
- **Input Validation**: Strict file type (`.pdf`), header signature (`%PDF`), and file size limits (25MB) prevent malformed or oversized inputs.
- **CORS Configured**: Secure local origins configured for development (`http://localhost:5173`).
