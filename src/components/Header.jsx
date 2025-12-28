import { Download, Edit3, Save, LogOut, User, X, Moon, Sun } from 'lucide-react';
import { SyncStatus } from './SyncStatus';

export const Header = ({
  user,
  canEdit,
  isEditMode,
  setIsEditMode,
  onLogout,
  onExportPDF,
  onSave,
  onCancel,
  syncStatus,
  darkMode,
  onToggleDarkMode,
}) => {

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Staff Schedule Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Plan your weekly staff coverage across time zones</p>
        </div>
        {syncStatus && (
          <SyncStatus
            isOnline={syncStatus.isOnline}
            isSaving={syncStatus.isSaving}
            syncError={syncStatus.syncError}
            hasConflict={syncStatus.hasConflict}
            hasUnsavedChanges={syncStatus.hasUnsavedChanges}
          />
        )}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4" />
            <span>{user.displayName}</span>
            {user.role === 'admin' && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                Admin
              </span>
            )}
          </div>
        )}

        {/* Edit/Save Button - Only show for admins */}
        {canEdit && setIsEditMode && !isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}

        {/* Save & Cancel Buttons - Only show in edit mode for admins */}
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
              onClick={onCancel}
              disabled={syncStatus?.isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}

        {/* Export Button */}
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </header>
  );
};
