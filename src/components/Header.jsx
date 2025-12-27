import { Download, Edit3, Eye, Upload, RotateCcw, Save, LogOut, User } from 'lucide-react';
import { useRef } from 'react';
import { SyncStatus } from './SyncStatus';

export const Header = ({
  user,
  canEdit,
  isEditMode,
  setIsEditMode,
  onLogout,
  onExportPDF,
  onExportJSON,
  onImportJSON,
  onResetToDefaults,
  onSave,
  onSaveAndExit,
  syncStatus,
  onRefresh,
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Staff Schedule Planner</h1>
          <p className="text-slate-500 text-sm">Plan your weekly staff coverage across time zones</p>
        </div>
        {syncStatus && (
          <SyncStatus
            isOnline={syncStatus.isOnline}
            isSaving={syncStatus.isSaving}
            syncError={syncStatus.syncError}
            hasConflict={syncStatus.hasConflict}
            hasUnsavedChanges={syncStatus.hasUnsavedChanges}
            onRefresh={onRefresh}
          />
        )}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span>{user.displayName}</span>
            {user.role === 'admin' && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                Admin
              </span>
            )}
          </div>
        )}

        {/* Edit Mode Toggle - Only show for admins */}
        {canEdit && setIsEditMode && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditMode
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isEditMode ? 'Editing' : 'View Only'}
          </button>
        )}

        {/* Save Buttons - Only show in edit mode for admins */}
        {isEditMode && canEdit && (
          <>
            <button
              onClick={onSave}
              disabled={syncStatus?.isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {syncStatus?.isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onSaveAndExit}
              disabled={syncStatus?.isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {syncStatus?.isSaving ? 'Saving...' : 'Save & Exit'}
            </button>
          </>
        )}

        {/* Export/Import Buttons */}
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={onExportJSON}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          JSON
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          onClick={onResetToDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </header>
  );
};
