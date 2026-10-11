import React, { useState } from 'react';
import { X, Key, ExternalLink, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function ApiKeyModal({
  isOpen,
  onClose,
  apiKeyConfigured,
  onKeyUpdated,
  showToast
}) {
  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!keyInput.trim()) {
      setErrorMsg('Please enter a valid Gemini API key.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateApiKey(keyInput.trim());
      if (res.configured) {
        onKeyUpdated(true);
        showToast('Gemini API key updated and verified!', 'success');
        onClose();
      } else {
        setErrorMsg('The API key could not be initialized.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Gemini API Setup</h2>
              <p className="text-xs text-slate-400">Configure your Google GenAI credentials</p>
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Status badge */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            apiKeyConfigured 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {apiKeyConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-semibold">
                {apiKeyConfigured ? 'Gemini API is Active' : 'Running in Interactive Demo Mode'}
              </p>
              <p className="text-slate-300/80 mt-0.5">
                {apiKeyConfigured 
                  ? 'All summarization, Q&A, and quizzes are powered by Gemini 2.5 Flash.' 
                  : 'Add your Gemini API key below to unlock live AI generation.'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Never exposed to browser clients
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !keyInput.trim()}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Activate'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
