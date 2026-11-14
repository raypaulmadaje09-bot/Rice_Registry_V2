import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sanitizeBackupPayload, stripUnsafeObjectKeys } from '../../utils/security';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onDataRestored }) => {
  const { parcels, resetParcels, permissions } = useApp();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !permissions.isCentralAdmin) return null;

  const handleExportJson = () => {
    try {
      const rawSettings = JSON.parse(localStorage.getItem('silago_app_settings') || '{}');
      const backup = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        system: 'Silago MAO Rice Farm Registry and Georeferencing Geographic Information System',
        municipality: 'Silago, Southern Leyte',
        parcels: parcels,
        legalDecrees: JSON.parse(localStorage.getItem('silago_legal_decrees') || '[]'),
        settings: stripUnsafeObjectKeys(rawSettings),
      };
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DA_Silago_Rice_Registry_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Full database exported successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Failed to export database backup.');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sanitized = sanitizeBackupPayload(parsed);

        if (sanitized && sanitized.parcels) {
          localStorage.setItem('rice_registry_parcels', JSON.stringify(sanitized.parcels));
          localStorage.setItem('silago_cached_parcels', JSON.stringify(sanitized.parcels));

          if (sanitized.legalDecrees) {
            localStorage.setItem('silago_legal_decrees', JSON.stringify(sanitized.legalDecrees));
          }
          if (sanitized.settings) {
            localStorage.setItem('silago_app_settings', JSON.stringify(sanitized.settings));
          }

          setSuccessMessage('Database restored successfully from file! Refreshing data...');
          onDataRestored?.();
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
            window.location.reload();
          }, 1200);
        } else {
          setErrorMessage('Invalid backup file structure.');
        }
      } catch {
        setErrorMessage('Failed to read or parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all records to the official Silago municipal baseline? Any unsaved offline additions will be replaced.'
      )
    ) {
      resetParcels();
      setSuccessMessage('Database restored to official Silago municipal baseline!');
      onDataRestored?.();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#123b2b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Database Backup &amp; Recovery Hub</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <p className="text-slate-600 leading-relaxed">
            Protect your municipal farm records against data loss. Export complete snapshots of georeferenced parcels, farmer RSBSA dossiers, and legal registries.
          </p>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* 1. Export JSON */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Export Complete JSON Backup</strong>
                <span className="text-[11px] text-slate-500">
                  Includes all {parcels.length} rice parcels, coordinates, and farmer profiles.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* 2. Import JSON */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Restore from Backup File</strong>
                <span className="text-[11px] text-slate-500">Upload a previously exported JSON database backup file.</span>
              </div>
              <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 shrink-0 shadow-2xs transition cursor-pointer">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Reset Baseline */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-4">
              <div>
                <strong className="text-amber-950 block text-xs">Reset to Municipal Baseline</strong>
                <span className="text-[11px] text-amber-800/80">Re-seed standard demo parcel registry across all 15 barangays.</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
