import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../api';

export default function DocumentUploadModal({
  isOpen,
  onClose,
  documents,
  activeDocument,
  setActiveDocument,
  onDocumentAdded,
  onDocumentDeleted,
  showToast
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setErrorMsg('');

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files (.pdf) are supported.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 25MB limit.');
      return;
    }

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      onDocumentAdded(doc);
      if (doc.status === 'scanned_warning') {
        showToast('Document uploaded, but appears to be a scanned image with minimal text.', 'warning');
      } else {
        showToast(`"${file.name}" uploaded and indexed successfully!`, 'success');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process document');
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setErrorMsg('');
    setLoadingSample(true);
    try {
      const doc = await api.loadSampleDocument();
      onDocumentAdded(doc);
      showToast('Sample Study Notes (Machine Learning) loaded successfully!', 'success');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load sample document');
      showToast(err.message || 'Failed to load sample', 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (confirm(`Are you sure you want to delete "${docName}"?`)) {
      try {
        await api.deleteDocument(docId);
        onDocumentDeleted(docId);
        showToast(`"${docName}" deleted`, 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete', 'error');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Study Notes Manager</h2>
              <p className="text-xs text-slate-400">Upload PDF documents or switch active material</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Upload Error</p>
                <p className="text-xs text-red-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-700 hover:border-indigo-500/60 bg-slate-800/40 hover:bg-slate-800/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {uploading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-slate-200">
                  Processing PDF and indexing text passages...
                </p>
                <p className="text-xs text-slate-400">
                  Extracting pages, detecting headings, generating RAG chunks
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to select or drag & drop PDF notes
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Maximum file size: 25MB • Preserves page numbers for citations
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-300 hover:bg-slate-700/80 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Option */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Don't have a PDF ready?</p>
                <p className="text-[11px] text-slate-400">Load sample lecture notes on Machine Learning & AI</p>
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={loadingSample || uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
            >
              {loadingSample ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  Load Sample Notes
                </>
              )}
            </button>
          </div>

          {/* Existing Documents List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Uploaded Documents ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-800/30 border border-slate-800 text-slate-400 text-xs">
                No documents uploaded yet. Upload a PDF or load the sample notes above to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isActive = activeDocument?.id === doc.id;
                  const isWarning = doc.status === 'scanned_warning';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActiveDocument(doc);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>{doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'}</span>
                            <span>•</span>
                            <span>{doc.total_chunks} chunks</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size_bytes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isWarning && (
                          <span 
                            title={doc.status_message} 
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/40"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Scanned
                          </span>
                        )}

                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                            Active
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id, doc.filename);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
