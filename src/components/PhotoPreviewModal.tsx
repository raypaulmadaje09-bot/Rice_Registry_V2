import React, { useEffect } from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { FarmParcel } from '../types';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  photoType: 'profile' | 'field';
  parcel?: FarmParcel | null;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  photoType,
  parcel
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  const photoTitle = photoType === 'profile'
    ? (parcel?.raiserName ? `${parcel.raiserName} — Profile Photo` : 'Farmer Profile Photo')
    : (parcel?.swineNameOrId ? `Field Photo — RSBSA ${parcel.swineNameOrId}` : 'Farmland / Field Georeferenced Photo');

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Click propagation prevention on inner modal container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col items-center max-w-4xl w-full max-h-[92vh] my-auto"
      >
        {/* Floating Minimal Header Bar */}
        <div className="w-full flex items-center justify-between px-3 py-2 mb-3 bg-slate-900/90 text-white rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pl-1">
            <span className="p-1 rounded-lg bg-white/10 text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-200 truncate font-mono">
              {photoTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Full Size</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-slate-200 hover:text-white transition cursor-pointer"
              title="Close image preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Centered High-Resolution Photo Display */}
        <div className="relative flex items-center justify-center w-full max-h-[78vh] overflow-hidden rounded-2xl bg-black/60 border border-white/10 shadow-2xl p-2">
          <img
            src={photoUrl}
            alt={photoTitle}
            referrerPolicy="no-referrer"
            className="max-h-[74vh] max-w-full w-auto h-auto object-contain rounded-xl select-none"
          />
        </div>
      </div>
    </div>
  );
};

