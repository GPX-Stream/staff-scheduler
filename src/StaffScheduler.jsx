import { useState, useEffect, useCallback } from 'react';
import { useScheduleSync, useScheduleBlocks, useDragSelection, useStaffManager, useConfig } from './hooks';
import { Header } from './components/Header';
import { TimezoneSelector } from './components/TimezoneSelector';
import { StaffList } from './components/StaffList';
import { ScheduleGrid } from './components/ScheduleGrid';
import { CoverageSummary } from './components/CoverageSummary';
import { AdminPanel } from './components/AdminPanel';

export default function StaffScheduler({ user, isAdmin, onLogout }) {
  // Non-admins can never edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('tier1');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const canEdit = isAdmin;

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // App configuration from database
  const { config, roles, isLoading: isConfigLoading, error: configError, saveConfig } = useConfig();

  // Core sync hook - single source of truth
  const {
    staff,
    blocks,
    setStaff,
    setBlocks,
    isLoading,
    isSaving,
    isOnline,
    syncError,
    hasConflict,
    hasUnsavedChanges,
    save,
    refreshFromServer,
  } = useScheduleSync();

  // Schedule blocks operations (using synced state)
  const {
    updateBlocks,
    removeStaffBlocks,
    clearAll,
    getStaffHours,
  } = useScheduleBlocks(blocks, setBlocks);

  // Staff management (using synced state)
  const {
    selectedStaff,
    setSelectedStaff,
    hiddenStaff,
    setHiddenStaff,
    hiddenRoles,
    hiddenGlobalRoles,
    displayTimezone,
    setDisplayTimezone,
    addStaff,
    removeStaff,
    updateStaffTimezone,
    updateStaffRole,
    toggleStaffVisibility,
    toggleRoleVisibility,
    toggleGlobalRoleVisibility,
    showAllStaff,
  } = useStaffManager({ staff, setStaff, removeStaffBlocks, colors: config?.colors, timezones: config?.timezones });

  // Sync selectedRole and displayTimezone when selecting new staff (only in edit mode)
  useEffect(() => {
    if (selectedStaff && isEditMode) {
      setSelectedRole(selectedStaff.defaultRole || 'tier1');
      setDisplayTimezone(selectedStaff.timezone);
    }
  }, [selectedStaff?.id, isEditMode, setDisplayTimezone]);

  // Drag selection handlers
  const dragHandlers = useDragSelection({
    selectedStaff,
    displayTimezone,
    blocks,
    updateBlocks,
    isEditMode,
    selectedRole,
  });

  // Find current user's staff ID
  const currentUserStaffId = staff.find(s =>
    s.id === user?.staffId ||
    s.username === user?.username ||
    s.name === user?.displayName
  )?.id;

  // Print handler - uses browser print with CSS media queries
  const handlePrint = useCallback((exportMode = 'all') => {
    if (exportMode === 'current' && currentUserStaffId) {
      // "My Schedule Only" - temporarily hide all other staff
      const previousHidden = new Set(hiddenStaff);
      const hideOthers = new Set(staff.filter(s => s.id !== currentUserStaffId).map(s => s.id));
      setHiddenStaff(hideOthers);

      // Wait for re-render, then print, then restore
      setTimeout(() => {
        window.print();
        // Restore after print dialog closes
        setTimeout(() => {
          setHiddenStaff(previousHidden);
        }, 100);
      }, 100);
    } else {
      // "All Users" - print what's currently visible
      window.print();
    }
  }, [currentUserStaffId, hiddenStaff, staff, setHiddenStaff]);

  // Save handlers
  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      setIsEditMode(false);
    } else {
      alert(`Save failed: ${result.error}`);
    }
  };

  const handleCancel = async () => {
    // Revert to last saved state from server
    await refreshFromServer();
    setIsEditMode(false);
  };

  // Loading state
  if (isLoading || isConfigLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  // Config error state - no fallback, must have database connection
  if (configError || !config) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Configuration Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{configError || 'Unable to load configuration from database'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 md:px-6 md:pt-6 pb-0">
        <Header
          user={user}
          canEdit={canEdit}
          isEditMode={isEditMode && canEdit}
          setIsEditMode={canEdit ? setIsEditMode : undefined}
          onLogout={onLogout}
          onExportPDF={handlePrint}
          currentUserStaffId={currentUserStaffId}
          onSave={handleSave}
          onCancel={handleCancel}
          syncStatus={{ isOnline, isSaving, syncError, hasConflict, hasUnsavedChanges }}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onOpenAdmin={canEdit ? () => setIsAdminPanelOpen(true) : undefined}
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:px-6 md:pb-6 pt-0 min-h-0">
        {/* Left Sidebar - Edit Controls (only for admins in edit mode) */}
        {isEditMode && canEdit && (
          <div className="flex-shrink-0 w-full lg:w-56 space-y-4 order-1">
            <TimezoneSelector
              displayTimezone={displayTimezone}
              setDisplayTimezone={setDisplayTimezone}
              timezones={config.timezones}
            />
            <StaffList
              staff={staff}
              selectedStaff={selectedStaff}
              onSelectStaff={setSelectedStaff}
              onClearAll={clearAll}
              onClearStaff={removeStaffBlocks}
              roles={roles}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col order-2">
          {(!isEditMode || !canEdit) && (
            <TimezoneSelector
              displayTimezone={displayTimezone}
              setDisplayTimezone={setDisplayTimezone}
              timezones={config.timezones}
              compact
            />
          )}
          <div className="flex-1 min-h-0">
            <ScheduleGrid
              staff={staff}
              blocks={blocks}
              displayTimezone={displayTimezone}
              hiddenStaff={hiddenStaff}
              hiddenRoles={hiddenRoles}
              hiddenGlobalRoles={hiddenGlobalRoles}
              selectedStaff={selectedStaff}
              isEditMode={isEditMode && canEdit}
              dragHandlers={dragHandlers}
              coverage={config.coverage}
              timezones={config.timezones}
              roles={roles}
            />
          </div>
        </div>

        {/* Right Sidebar - Coverage Summary */}
        <div className="flex-shrink-0 order-3 -mb-4 md:-mb-6 lg:mb-0 lg:-mr-6">
          <CoverageSummary
            staff={staff}
            blocks={blocks}
            hiddenStaff={hiddenStaff}
            hiddenRoles={hiddenRoles}
            hiddenGlobalRoles={hiddenGlobalRoles}
            onToggleVisibility={toggleStaffVisibility}
            onToggleRoleVisibility={toggleRoleVisibility}
            onToggleGlobalRoleVisibility={toggleGlobalRoleVisibility}
            onShowAll={showAllStaff}
            roles={roles}
            timezones={config.timezones}
          />
        </div>
      </div>

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        config={config}
        saveConfig={saveConfig}
        onRefreshData={refreshFromServer}
        currentUser={user}
      />
    </div>
  );
}
