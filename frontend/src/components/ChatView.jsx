import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Trash2, 
  Loader2,
  BookOpen,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function ChatView({
  activeDocument,
  onOpenUpload,
  showToast
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSourceDoc, setSelectedSourceDoc] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What are the most important concepts in these notes?",
    "What formulas or mathematical expressions are mentioned?",
    "Explain the key definitions and how they relate.",
    "What topics should I focus on for an upcoming exam?"
  ];

  useEffect(() => {
    // If activeDocument changes and messages are empty, load welcome message
    if (activeDocument && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your AI Study Assistant. I have indexed **"${activeDocument.filename}"** (${activeDocument.total_pages} pages, ${activeDocument.total_chunks} passages).\n\nAsk me any question about your notes. I will retrieve relevant passages, answer with exact page citations, and notify you if any topic is outside your study material.`,
          sources: [],
          pagesCited: [],
          isSupported: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeDocument]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || !activeDocument || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build lightweight conversation history
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      
      const res = await api.askQuestion(activeDocument.id, query, history);

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        pagesCited: res.pages_cited || [],
        isSupported: res.is_supported !== false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      showToast(err.message || 'Failed to get answer', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to retrieve answer. Please try again.'}`,
          sources: [],
          pagesCited: [],
          isSupported: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Clear this chat conversation?')) {
      setMessages([]);
      showToast('Chat history cleared', 'info');
    }
  };

  if (!activeDocument) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Select Study Material First</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Upload a PDF or choose a document from the dashboard to start an AI Q&A session with citations.
        </p>
        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Choose Document
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-300">
      
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Ask AI (RAG Grounded)</h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Citing Pages
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              Knowledge base: <span className="text-slate-300 font-medium">{activeDocument.filename}</span>
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Clear Conversation"
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-600/30 border border-purple-500/30 text-purple-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Unsupported Alert Badge */}
                  {!isUser && !msg.isSupported && (
                    <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span>Notice: This question cannot be answered from the uploaded study notes.</span>
                    </div>
                  )}

                  {/* Cited Page Badges */}
                  {!isUser && msg.pagesCited && msg.pagesCited.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">Cited Sources:</span>
                      {msg.pagesCited.map((pageNum) => (
                        <span
                          key={pageNum}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold"
                        >
                          <BookOpen className="w-3 h-3 text-purple-400" />
                          Page {pageNum}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inspect Context Sources Button */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <button
                    onClick={() => setSelectedSourceDoc(selectedSourceDoc === msg.id ? null : msg.id)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors ml-1 font-medium"
                  >
                    <Info className="w-3 h-3 text-indigo-400" />
                    {selectedSourceDoc === msg.id ? 'Hide Retrieved Passages' : `View ${msg.sources.length} Retrieved Passages`}
                    {selectedSourceDoc === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}

                {/* Expanded Source Details */}
                {!isUser && selectedSourceDoc === msg.id && msg.sources && (
                  <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 text-xs">
                    <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                      Grounding Passages From PDF
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {msg.sources.map((s, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          <div className="flex items-center justify-between text-[11px] text-indigo-300 mb-1 font-medium">
                            <span>Page {s.page_number}</span>
                            {s.relevance_score && (
                              <span className="text-slate-500">Relevance: {Math.round(s.relevance_score * 100)}%</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed italic">
                            "{s.excerpt}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className={`text-[10px] text-slate-500 ${isUser ? 'text-right' : 'text-left'} px-1`}>
                  {msg.timestamp}
                </p>

              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700/80 text-slate-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-xs font-medium">Searching notes & verifying page citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions (if few messages) */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 border-t border-slate-800/80 bg-slate-900/40">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">Suggested Questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask anything about "${activeDocument.filename}"...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
