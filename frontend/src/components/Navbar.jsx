import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  FileText, 
  Upload, 
  Key, 
  Menu, 
  X,
  Layers
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  documents,
  activeDocument,
  setActiveDocument,
  onOpenUpload,
  onOpenApiKey,
  apiKeyConfigured
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'summarize', label: 'Summarizer', icon: Sparkles },
    { id: 'chat', label: 'Ask AI', icon: MessageSquare },
    { id: 'quiz', label: 'Practice Quiz', icon: CheckSquare },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                  StudyPulse
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  AI
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center ml-8 space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Active Document Selector */}
            {documents.length > 0 ? (
              <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-400 mr-2 flex-shrink-0" />
                <select
                  value={activeDocument ? activeDocument.id : ''}
                  onChange={(e) => {
                    const found = documents.find(d => d.id === e.target.value);
                    if (found) setActiveDocument(found);
                  }}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none max-w-[150px] truncate cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-slate-800 text-slate-200">
                      {doc.filename}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PDF
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={onOpenApiKey}
              title={apiKeyConfigured ? 'Gemini API Key Configured' : 'Configure Gemini API Key'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                apiKeyConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiKeyConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <Key className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {apiKeyConfigured ? 'Gemini 2.5' : 'Demo Mode'}
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="p-1.5 rounded-lg bg-indigo-600 text-white text-xs"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenApiKey();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-xs text-slate-300 py-1"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              Configure Gemini Key ({apiKeyConfigured ? 'Active' : 'Demo'})
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
