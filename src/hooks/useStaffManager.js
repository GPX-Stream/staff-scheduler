import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_STAFF } from '../data/defaultData';
import { COLORS } from '../constants';
import { getInitialTimezoneOffset } from '../utils';

/**
 * Hook to manage staff members
 * @param {Object} options - Hook options
 * @param {Array} options.staff - Staff array from sync hook
 * @param {Function} options.setStaff - Setter for staff from sync hook
 * @param {Function} options.removeStaffBlocks - Function to remove blocks when staff is deleted
 * @returns {Object} Staff state and handlers
 */
export const useStaffManager = ({ staff, setStaff, removeStaffBlocks }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [hiddenStaff, setHiddenStaff] = useState(new Set());
  const [displayOffset, setDisplayOffset] = useState(() => getInitialTimezoneOffset());

  // Initialize selectedStaff when staff loads
  useEffect(() => {
    if (staff.length > 0 && !selectedStaff) {
      setSelectedStaff(staff[0]);
    }
  }, [staff, selectedStaff]);

  const selectStaffMember = useCallback((member) => {
    setSelectedStaff(member);
    setDisplayOffset(member.timezoneOffset);
  }, []);

  const addStaff = useCallback((name) => {
    if (!name.trim()) return null;

    const newMember = {
      id: Date.now(),
      name: name.trim(),
      color: COLORS[staff.length % COLORS.length],
      timezoneOffset: displayOffset,
    };

    setStaff(prev => [...prev, newMember]);

    if (!selectedStaff) {
      selectStaffMember(newMember);
    }

    return newMember;
  }, [staff.length, displayOffset, selectedStaff, setStaff, selectStaffMember]);

  const removeStaff = useCallback((id) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    removeStaffBlocks(id);

    if (selectedStaff?.id === id) {
      const remaining = staff.find(s => s.id !== id);
      if (remaining) {
        selectStaffMember(remaining);
      } else {
        setSelectedStaff(null);
      }
    }
  }, [staff, selectedStaff, setStaff, removeStaffBlocks, selectStaffMember]);

  const updateStaffTimezone = useCallback((id, newOffset) => {
    setStaff(prev => prev.map(s =>
      s.id === id ? { ...s, timezoneOffset: newOffset } : s
    ));

    if (selectedStaff?.id === id) {
      setSelectedStaff(prev => ({ ...prev, timezoneOffset: newOffset }));
      setDisplayOffset(newOffset);
    }
  }, [selectedStaff, setStaff]);

  const toggleStaffVisibility = useCallback((staffId) => {
    setHiddenStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  }, []);

  const showAllStaff = useCallback(() => {
    setHiddenStaff(new Set());
  }, []);

  const resetToDefaults = useCallback(() => {
    setStaff(DEFAULT_STAFF);
    setSelectedStaff(DEFAULT_STAFF[0] || null);
    setDisplayOffset(getInitialTimezoneOffset());
    setHiddenStaff(new Set());
  }, [setStaff]);

  return {
    staff,
    setStaff,
    selectedStaff,
    setSelectedStaff: selectStaffMember,
    hiddenStaff,
    displayOffset,
    setDisplayOffset,
    addStaff,
    removeStaff,
    updateStaffTimezone,
    toggleStaffVisibility,
    showAllStaff,
    resetToDefaults,
  };
};
