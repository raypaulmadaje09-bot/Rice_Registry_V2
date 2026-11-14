import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        id="btn-pwa-install"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs transition text-xs cursor-pointer ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
        } ${className}`}
        title="Install Silago Rice Registry for Offline Field Use"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="btn-ios-install-guide"
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition cursor-pointer ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          } ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install (iOS)</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-700" /> Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">1</span>
                  <span>Tap the <strong className="inline-flex items-center gap-1 text-slate-800"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari toolbar.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">2</span>
                  <span>Scroll down and tap <strong className="inline-flex items-center gap-1 text-slate-800"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">3</span>
                  <span>Open the Rice Registry anytime from your home screen — fully functional in remote field barangays even with no signal!</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
