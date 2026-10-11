import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  FileText, 
  Upload, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Zap,
  GraduationCap
} from 'lucide-react';

export default function DashboardView({
  documents,
  activeDocument,
  setActiveDocument,
  onOpenUpload,
  setActiveTab
}) {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            AI-Powered Academic Supercharger
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Study Smarter, Not Harder With <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Gemini AI</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300/90 leading-relaxed">
            Upload your lecture notes or textbooks. Generate executive summaries, ask questions with exact page citations, and test your knowledge with interactive practice quizzes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              Upload PDF Notes
            </button>
            {activeDocument && (
              <button
                onClick={() => setActiveTab('summarize')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-indigo-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Summarize Notes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Document Spotlight */}
      {activeDocument ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                    {activeDocument.filename}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded {new Date(activeDocument.upload_timestamp).toLocaleDateString()} • {formatFileSize(activeDocument.file_size_bytes)}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenUpload}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Switch Document →
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
              <p className="text-xs text-slate-400">Total Pages</p>
              <p className="text-xl font-bold text-white mt-1">{activeDocument.total_pages}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
              <p className="text-xs text-slate-400">Vector Chunks</p>
              <p className="text-xl font-bold text-white mt-1">{activeDocument.total_chunks}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
              <p className="text-xs text-slate-400">Word Count</p>
              <p className="text-xl font-bold text-white mt-1">~{activeDocument.word_count.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
              <p className="text-xs text-slate-400">Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                {activeDocument.status === 'scanned_warning' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Scanned PDF</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Ready for AI</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl p-8 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-indigo-400/60 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Study Material Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload your course notes, syllabus, or lecture slides to start summarizing, asking questions, and generating quizzes.
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF or Load Sample
          </button>
        </div>
      )}

      {/* Feature Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Summarizer Card */}
        <div 
          onClick={() => setActiveTab('summarize')}
          className="group relative bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            AI Notes Summarizer
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Generate Short, Medium, or Detailed study guides. Automatically extracts key concepts, definitions, formulas, and revision points.
          </p>
          <div className="mt-5 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
            Open Summarizer <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Ask AI Card */}
        <div 
          onClick={() => setActiveTab('chat')}
          className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
            Ask AI with RAG
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Chat with your notes. Answers are strictly grounded in your study material with exact page citations and excerpts.
          </p>
          <div className="mt-5 flex items-center text-xs font-semibold text-purple-400 group-hover:text-purple-300">
            Start Asking <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Practice Quiz Card */}
        <div 
          onClick={() => setActiveTab('quiz')}
          className="group relative bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
            Practice Quiz Arena
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Generate multiple-choice quizzes with 4 options, instant scoring, letter grades, and step-by-step explanations.
          </p>
          <div className="mt-5 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            Take a Quiz <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Student Study Tips */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Pro Study Technique: Active Recall & Spaced Repetition</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Use the <strong className="text-slate-300">Summarizer</strong> for initial comprehension, test yourself immediately with the <strong className="text-slate-300">Practice Quiz</strong> to identify knowledge gaps, and use <strong className="text-slate-300">Ask AI</strong> to drill down into confusing page references before exam day.
          </p>
        </div>
      </div>

    </div>
  );
}
