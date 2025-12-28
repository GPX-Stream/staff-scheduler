import { Cloud, CloudOff, RefreshCw, AlertTriangle, Circle } from 'lucide-react';

export const SyncStatus = ({
  isOnline,
  isSaving,
  syncError,
  hasConflict,
  hasUnsavedChanges,
}) => {
  if (hasConflict) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Conflict - use Cancel to reload</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <CloudOff className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Offline</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-blue-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm hidden sm:inline">Saving...</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Sync error</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <Circle className="w-3 h-3 fill-current" />
        <span className="text-sm hidden sm:inline">Unsaved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <Cloud className="w-4 h-4" />
      <span className="text-sm hidden sm:inline">Synced</span>
    </div>
  );
};
