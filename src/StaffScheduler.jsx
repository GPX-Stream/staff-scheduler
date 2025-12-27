import { useState } from 'react';
import { useScheduleSync, useScheduleBlocks, useDragSelection, useStaffManager } from './hooks';
import { Header } from './components/Header';
import { TimezoneSelector } from './components/TimezoneSelector';
import { StaffList } from './components/StaffList';
import { ScheduleGrid } from './components/ScheduleGrid';
import { CoverageSummary } from './components/CoverageSummary';
import { exportToPDF } from './services/pdfExport';
import { exportToJSON, importFromJSON } from './services/storage';

export default function StaffScheduler({ user, isAdmin, onLogout }) {
  // Non-admins can never edit
  const [isEditMode, setIsEditMode] = useState(false);
  const canEdit = isAdmin;

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
    resetToDefaults: resetBlocksToDefaults,
    getStaffHours,
  } = useScheduleBlocks(blocks, setBlocks);

  // Staff management (using synced state)
  const {
    selectedStaff,
    setSelectedStaff,
    hiddenStaff,
    displayOffset,
    setDisplayOffset,
    addStaff,
    removeStaff,
    updateStaffTimezone,
    toggleStaffVisibility,
    showAllStaff,
    resetToDefaults: resetStaffToDefaults,
  } = useStaffManager({ staff, setStaff, removeStaffBlocks });

  // Drag selection handlers
  const dragHandlers = useDragSelection({
    selectedStaff,
    displayOffset,
    blocks,
    updateBlocks,
    isEditMode,
  });

  // Export handlers
  const handleExportPDF = () => {
    exportToPDF({ staff, blocks, displayOffset, hiddenStaff });
  };

  const handleExportJSON = () => {
    exportToJSON({ staff, blocks });
  };

  const handleImportJSON = async (file) => {
    try {
      const { staff: importedStaff, blocks: importedBlocks } = await importFromJSON(file);
      setStaff(importedStaff);
      setBlocks(importedBlocks);
      if (importedStaff.length > 0) {
        setSelectedStaff(importedStaff[0]);
        setDisplayOffset(importedStaff[0].timezoneOffset);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      resetStaffToDefaults();
      resetBlocksToDefaults();
    }
  };

  // Save handlers
  const handleSave = async () => {
    const result = await save();
    if (!result.success) {
      alert(`Save failed: ${result.error}`);
    }
  };

  const handleSaveAndExit = async () => {
    const result = await save();
    if (result.success) {
      setIsEditMode(false);
    } else {
      alert(`Save failed: ${result.error}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        <Header
          user={user}
          canEdit={canEdit}
          isEditMode={isEditMode && canEdit}
          setIsEditMode={canEdit ? setIsEditMode : undefined}
          onLogout={onLogout}
          onExportPDF={handleExportPDF}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onResetToDefaults={handleResetToDefaults}
          onSave={handleSave}
          onSaveAndExit={handleSaveAndExit}
          syncStatus={{ isOnline, isSaving, syncError, hasConflict, hasUnsavedChanges }}
          onRefresh={refreshFromServer}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Left Sidebar - Edit Controls (only for admins in edit mode) */}
          {isEditMode && canEdit && (
            <div className="lg:col-span-3 space-y-4 order-1">
              <TimezoneSelector
                displayOffset={displayOffset}
                setDisplayOffset={setDisplayOffset}
              />
              <StaffList
                staff={staff}
                selectedStaff={selectedStaff}
                onSelectStaff={setSelectedStaff}
                onAddStaff={addStaff}
                onRemoveStaff={removeStaff}
                onUpdateTimezone={updateStaffTimezone}
                onClearAll={clearAll}
              />
            </div>
          )}

          {/* Main Grid */}
          <div className={`${isEditMode && canEdit ? 'lg:col-span-6' : 'lg:col-span-9'} bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden order-2`}>
            {(!isEditMode || !canEdit) && (
              <TimezoneSelector
                displayOffset={displayOffset}
                setDisplayOffset={setDisplayOffset}
                compact
              />
            )}
            <ScheduleGrid
              staff={staff}
              blocks={blocks}
              displayOffset={displayOffset}
              hiddenStaff={hiddenStaff}
              selectedStaff={selectedStaff}
              isEditMode={isEditMode && canEdit}
              dragHandlers={dragHandlers}
            />
          </div>

          {/* Right Sidebar - Coverage Summary */}
          <div className="lg:col-span-3 order-3">
            <CoverageSummary
              staff={staff}
              hiddenStaff={hiddenStaff}
              getStaffHours={getStaffHours}
              onToggleVisibility={toggleStaffVisibility}
              onShowAll={showAllStaff}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
