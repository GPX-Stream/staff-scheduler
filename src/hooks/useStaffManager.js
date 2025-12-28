import { useState, useCallback, useEffect } from 'react';
import { getInitialTimezone } from '../utils';

/**
 * Hook to manage staff members
 * @param {Object} options - Hook options
 * @param {Array} options.staff - Staff array from sync hook
 * @param {Function} options.setStaff - Setter for staff from sync hook
 * @param {Function} options.removeStaffBlocks - Function to remove blocks when staff is deleted
 * @param {Array} options.colors - Available colors for staff members
 * @param {Array} options.timezones - Available timezones
 * @returns {Object} Staff state and handlers
 */
export const useStaffManager = ({ staff, setStaff, removeStaffBlocks, colors, timezones }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [hiddenStaff, setHiddenStaff] = useState(new Set());
  const [hiddenRoles, setHiddenRoles] = useState(new Set()); // Set of "staffId-roleId" keys
  const [hiddenGlobalRoles, setHiddenGlobalRoles] = useState(new Set()); // Set of roleIds (hides entire role)
  const [displayTimezone, setDisplayTimezone] = useState(() => getInitialTimezone(timezones));

  // Initialize selectedStaff when staff loads
  useEffect(() => {
    if (staff.length > 0 && !selectedStaff) {
      setSelectedStaff(staff[0]);
    }
  }, [staff, selectedStaff]);

  const selectStaffMember = useCallback((member) => {
    setSelectedStaff(member);
    setDisplayTimezone(member.timezone);
  }, []);

  const addStaff = useCallback((name) => {
    if (!name.trim()) return null;

    const newMember = {
      id: Date.now(),
      name: name.trim(),
      color: colors[staff.length % colors.length],
      timezone: displayTimezone,
      defaultRole: 'tier1', // Default new staff to Tier 1 support
    };

    setStaff(prev => [...prev, newMember]);

    if (!selectedStaff) {
      selectStaffMember(newMember);
    }

    return newMember;
  }, [staff.length, displayTimezone, selectedStaff, setStaff, selectStaffMember, colors]);

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

  const updateStaffTimezone = useCallback((id, newTimezone) => {
    setStaff(prev => prev.map(s =>
      s.id === id ? { ...s, timezone: newTimezone } : s
    ));

    if (selectedStaff?.id === id) {
      setSelectedStaff(prev => ({ ...prev, timezone: newTimezone }));
      setDisplayTimezone(newTimezone);
    }
  }, [selectedStaff, setStaff]);

  const updateStaffRole = useCallback((id, newRole) => {
    setStaff(prev => prev.map(s =>
      s.id === id ? { ...s, defaultRole: newRole } : s
    ));

    if (selectedStaff?.id === id) {
      setSelectedStaff(prev => ({ ...prev, defaultRole: newRole }));
    }
  }, [selectedStaff, setStaff]);

  const toggleStaffVisibility = useCallback((staffId) => {
    setHiddenStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
        // Also clear any hidden roles for this staff member when re-enabling
        setHiddenRoles(prevRoles => {
          const nextRoles = new Set(prevRoles);
          for (const key of prevRoles) {
            if (key.startsWith(`${staffId}-`)) {
              nextRoles.delete(key);
            }
          }
          return nextRoles;
        });
      } else {
        next.add(staffId);
      }
      return next;
    });
  }, []);

  const toggleRoleVisibility = useCallback((staffId, roleId) => {
    const key = `${staffId}-${roleId}`;
    setHiddenRoles(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleGlobalRoleVisibility = useCallback((roleId) => {
    setHiddenGlobalRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }, []);

  const showAllStaff = useCallback(() => {
    setHiddenStaff(new Set());
    setHiddenRoles(new Set());
    setHiddenGlobalRoles(new Set());
  }, []);

  return {
    staff,
    setStaff,
    selectedStaff,
    setSelectedStaff: selectStaffMember,
    hiddenStaff,
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
  };
};
