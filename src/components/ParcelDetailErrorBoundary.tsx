import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ParcelDetailErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ParcelDetailModal / FarmerDossier render error:', error, errorInfo);
  }

  public handleClose = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-rose-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950">Farmer Dossier Display Issue</h3>
                  <p className="text-xs text-slate-500">
                    A temporary formatting problem prevented this profile from rendering.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={this.handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown render error in Farmer Profile Dossier'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

