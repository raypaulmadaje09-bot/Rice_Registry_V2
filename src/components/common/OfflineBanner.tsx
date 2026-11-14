import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, offlineQueueCount, syncOfflineQueue } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
      setSyncSuccess(`Synchronized offline records with cloud database!`);
      setTimeout(() => setSyncSuccess(null), 3500);
    } catch {
      // handled inside AppContext
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && offlineQueueCount === 0 && !syncSuccess) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white px-4 py-2 text-xs sm:text-sm shadow-md flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 sticky top-0 z-50">
      <div className="flex items-center gap-2 font-medium">
        {!isOnline ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
            <span>
              <strong>Offline Mode Active (No Internet)</strong> — All farm parcels, GIS boundary plots, and farmer updates are safely cached in local storage.
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>
              Internet Restored. You have <strong>{offlineQueueCount}</strong> pending update{offlineQueueCount > 1 ? 's' : ''} to synchronize with Supabase.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {offlineQueueCount > 0 && (
          <span className="bg-amber-900/60 text-amber-100 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 border border-amber-400/40">
            <Database className="w-3 h-3 text-amber-300" />
            {offlineQueueCount} Queued
          </span>
        )}

        {isOnline && offlineQueueCount > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1 rounded-lg bg-white text-emerald-950 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-50 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Upload Now'}</span>
          </button>
        )}

        {syncSuccess && (
          <span className="bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            {syncSuccess}
          </span>
        )}
      </div>
    </div>
  );
};
