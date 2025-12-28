import { useState } from 'react';
import { Download, Edit3, Save, LogOut, User, X, Moon, Sun, Settings, Menu } from 'lucide-react';
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
  onOpenAdmin,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => setIsDrawerOpen(false);

  // Wrapper to close drawer after action
  const withCloseDrawer = (action) => () => {
    action?.();
    closeDrawer();
  };

  // Control buttons shared between desktop and mobile
  const ControlButtons = ({ isMobile = false }) => (
    <>
      {/* User info */}
      {user && (
        <div className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 ${isMobile ? 'w-full' : ''}`}>
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
          onClick={isMobile ? withCloseDrawer(() => setIsEditMode(true)) : () => setIsEditMode(true)}
          className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 rounded-lg text-sm font-medium transition-colors ${isMobile ? 'w-full' : ''}`}
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
      )}

      {/* Save & Cancel Buttons - Only show in edit mode for admins */}
      {isEditMode && canEdit && (
        <>
          <button
            onClick={isMobile ? withCloseDrawer(onSave) : onSave}
            disabled={syncStatus?.isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
          >
            <Save className="w-4 h-4" />
            {syncStatus?.isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={isMobile ? withCloseDrawer(onCancel) : onCancel}
            disabled={syncStatus?.isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </>
      )}

      {/* Export Button */}
      <button
        onClick={isMobile ? withCloseDrawer(onExportPDF) : onExportPDF}
        className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 transition-colors ${isMobile ? 'w-full' : ''}`}
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>

      {/* Admin Settings Button - Only show for admins */}
      {canEdit && onOpenAdmin && (
        <button
          onClick={isMobile ? withCloseDrawer(onOpenAdmin) : onOpenAdmin}
          className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 transition-colors ${isMobile ? 'w-full' : ''}`}
          title="Admin Settings"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      )}

      {/* Dark Mode Toggle */}
      <button
        onClick={isMobile ? withCloseDrawer(onToggleDarkMode) : onToggleDarkMode}
        className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 transition-colors ${isMobile ? 'w-full' : ''}`}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {isMobile && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
      </button>

      {/* Logout Button */}
      {onLogout && (
        <button
          onClick={isMobile ? withCloseDrawer(onLogout) : onLogout}
          className={`flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 active:bg-red-100 transition-colors ${isMobile ? 'w-full' : ''}`}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      )}
    </>
  );

  return (
    <>
      <header className="mb-4 md:mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Staff Schedule Planner</h1>
            <p className="hidden md:block text-slate-500 dark:text-slate-400 text-sm">Plan your weekly staff coverage across time zones</p>
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

        {/* Desktop Controls - hidden on mobile */}
        <div className="hidden md:flex gap-2 flex-wrap items-center">
          <ControlButtons />
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Menu</h2>
          <button
            onClick={closeDrawer}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-65px)]">
          <ControlButtons isMobile={true} />
        </div>
      </div>
    </>
  );
};
