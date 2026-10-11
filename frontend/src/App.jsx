import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import SummarizerView from './components/SummarizerView';
import ChatView from './components/ChatView';
import QuizView from './components/QuizView';
import DocumentUploadModal from './components/DocumentUploadModal';
import ApiKeyModal from './components/ApiKeyModal';
import Toast from './components/Toast';
import { api } from './api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    async function initApp() {
      try {
        // Fetch API key status
        const keyStatus = await api.getApiKeyStatus();
        setApiKeyConfigured(keyStatus.configured);

        // Fetch documents
        const docs = await api.listDocuments();
        setDocuments(docs);
        if (docs.length > 0) {
          setActiveDocument(docs[0]);
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    initApp();
  }, []);

  const handleDocumentAdded = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
    setActiveDocument(newDoc);
  };

  const handleDocumentDeleted = (deletedId) => {
    setDocuments((prev) => {
      const filtered = prev.filter(d => d.id !== deletedId);
      if (activeDocument?.id === deletedId) {
        setActiveDocument(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading StudyPulse AI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        activeDocument={activeDocument}
        setActiveDocument={setActiveDocument}
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenApiKey={() => setApiKeyModalOpen(true)}
        apiKeyConfigured={apiKeyConfigured}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            documents={documents}
            activeDocument={activeDocument}
            setActiveDocument={setActiveDocument}
            onOpenUpload={() => setUploadModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'summarize' && (
          <SummarizerView
            activeDocument={activeDocument}
            onOpenUpload={() => setUploadModalOpen(true)}
            showToast={showToast}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            activeDocument={activeDocument}
            onOpenUpload={() => setUploadModalOpen(true)}
            showToast={showToast}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            activeDocument={activeDocument}
            onOpenUpload={() => setUploadModalOpen(true)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} StudyPulse AI — GenAI-Powered Student Study Assistant.</p>
          <div className="flex items-center gap-4">
            <span>FastAPI + PyMuPDF</span>
            <span>•</span>
            <span>ChromaDB RAG</span>
            <span>•</span>
            <span>Google Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        documents={documents}
        activeDocument={activeDocument}
        setActiveDocument={setActiveDocument}
        onDocumentAdded={handleDocumentAdded}
        onDocumentDeleted={handleDocumentDeleted}
        showToast={showToast}
      />

      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        apiKeyConfigured={apiKeyConfigured}
        onKeyUpdated={(configured) => setApiKeyConfigured(configured)}
        showToast={showToast}
      />

      {/* Global Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
