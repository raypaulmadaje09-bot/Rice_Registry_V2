import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface SignInToastProps {
  isOpen: boolean;
  name?: string;
  role?: string;
  station?: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const SignInToast: React.FC<SignInToastProps> = ({
  isOpen,
  name,
  role = 'Central Admin',
  station = 'Central Office',
  onDismiss,
  autoDismissMs = 2000
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const dynamicDisplayName =
    name?.trim() || (role === 'Central Admin' ? 'Admin' : 'Field Officer / Ka-Agri');

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      return;
    }

    // Schedule dismiss after autoDismissMs (2000ms)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(1600, autoDismissMs - 350));

    const dismissTimer = setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, autoDismissMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [isOpen, autoDismissMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-auto ${
        isExiting
          ? 'opacity-0 -translate-y-4 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4 duration-300'
      }`}
    >
      <div className="bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl rounded-xl px-5 py-3 flex items-center gap-3 backdrop-blur-md min-w-[320px] max-w-[90vw] ring-1 ring-white/10 select-none">
        {/* Emerald Verified Shield Badge Icon */}
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white tracking-wide truncate">
              Signed In: {dynamicDisplayName}
            </h4>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
          <p className="text-[11px] text-emerald-300/90 font-medium truncate mt-0.5">
            Authenticated as {role} ({station})
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => {
            setIsExiting(true);
            setTimeout(onDismiss, 200);
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0 cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
