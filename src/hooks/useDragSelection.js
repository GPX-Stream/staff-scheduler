import { useState, useEffect, useCallback } from 'react';
import { displayToUTC } from '../utils';

/**
 * Hook to manage drag selection for the schedule grid
 * @param {Object} options - Hook options
 * @param {Object} options.selectedStaff - Currently selected staff member
 * @param {string} options.displayTimezone - Current display IANA timezone ID
 * @param {Object} options.blocks - Current blocks state
 * @param {function} options.updateBlocks - Function to update blocks
 * @param {boolean} options.isEditMode - Whether edit mode is active
 * @param {string} options.selectedRole - Role to assign to new blocks
 * @returns {Object} Drag state and handlers
 */
export const useDragSelection = ({
  selectedStaff,
  displayTimezone,
  blocks,
  updateBlocks,
  isEditMode,
  selectedRole,
}) => {
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseUpComplete = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd || !selectedStaff) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startDayIdx = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const endDayIdx = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);

    // Check if we're removing (if start cell already has this staff)
    const startUTC = displayToUTC(dragStart.dayIndex, dragStart.hour, displayTimezone);
    const startKey = `${selectedStaff.id}-${startUTC}`;
    const isRemoving = !!blocks[startKey];

    const updates = [];
    for (let dayIdx = startDayIdx; dayIdx <= endDayIdx; dayIdx++) {
      for (let h = startHour; h <= endHour; h++) {
        updates.push({ staffId: selectedStaff.id, dayIndex: dayIdx, hour: h });
      }
    }

    // Pass selectedRole when adding blocks (ignored when removing)
    updateBlocks(updates, displayTimezone, isRemoving, isRemoving ? undefined : selectedRole);

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, selectedStaff, displayTimezone, blocks, updateBlocks, selectedRole]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUpComplete();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  });

  const handleMouseDown = useCallback((dayIndex, hour) => {
    if (!selectedStaff || !isEditMode) return;
    setIsDragging(true);
    setDragStart({ dayIndex, hour });
    setDragEnd({ dayIndex, hour });
  }, [selectedStaff, isEditMode]);

  const handleMouseUp = useCallback(() => {
    handleMouseUpComplete();
  }, [handleMouseUpComplete]);

  const handleMouseEnter = useCallback((dayIndex, hour) => {
    if (!isDragging) return;
    setDragEnd({ dayIndex, hour });
  }, [isDragging]);

  const isInDragSelection = useCallback((dayIndex, hour) => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const startDayIdx = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const endDayIdx = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);

    return dayIndex >= startDayIdx && dayIndex <= endDayIdx && hour >= startHour && hour <= endHour;
  }, [isDragging, dragStart, dragEnd]);

  return {
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    isInDragSelection,
  };
};
