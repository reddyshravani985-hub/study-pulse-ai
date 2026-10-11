import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
    error: 'bg-red-950/90 border-red-500/50 text-red-200',
    info: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200',
  };

  const Icon = icons[toast.type] || Info;
  const colorClass = colors[toast.type] || colors.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${colorClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-xs font-medium leading-relaxed flex-1">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
