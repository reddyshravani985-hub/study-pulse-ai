// API client for backend communication

const API_BASE = '/api/v1';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health & API Key
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getApiKeyStatus() {
    const res = await fetch(`${API_BASE}/health/api-key`);
    return handleResponse(res);
  },

  async updateApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/health/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    return handleResponse(res);
  },

  // Documents
  async listDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return handleResponse(res);
  },

  async getDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`);
    return handleResponse(res);
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async loadSampleDocument() {
    const res = await fetch(`${API_BASE}/documents/load-sample`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Summarize
  async generateSummary(docId, length = 'medium') {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId, length }),
    });
    return handleResponse(res);
  },

  // Chat / RAG
  async askQuestion(docId, message, history = []) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: docId,
        message,
        history,
      }),
    });
    return handleResponse(res);
  },

  // Quiz
  async generateQuiz(docId, numQuestions = 5, difficulty = 'medium') {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: docId,
        num_questions: numQuestions,
        difficulty,
      }),
    });
    return handleResponse(res);
  },

  async submitQuiz(quizId, answers) {
    // answers format: [{ question_id: 1, selected_option_index: 2 }, ...]
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: quizId,
        answers,
      }),
    });
    return handleResponse(res);
  },
};
