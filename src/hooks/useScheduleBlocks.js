import { useCallback } from 'react';
import { displayToUTC } from '../utils';
import { addRoleToBlock, removeRoleFromBlock, blockHasRole } from '../utils/blockUtils';

/**
 * Hook to manage schedule blocks operations
 * @param {Object} blocks - Current blocks state
 * @param {Function} setBlocks - Setter for blocks state
 * @returns {Object} Block operation handlers
 */
export const useScheduleBlocks = (blocks, setBlocks) => {
  /**
   * Update blocks with optional role assignment
   * Supports multi-role: adds role to existing array or removes specific role
   * @param {Array} updates - Array of {staffId, dayIndex, hour}
   * @param {string} displayTimezone - Current display timezone
   * @param {boolean} isRemoving - Whether to remove the role
   * @param {string} [role] - Role to add/remove
   * @param {Object} [selectedStaff] - Selected staff member (for default role lookup)
   */
  const updateBlocks = useCallback((updates, displayTimezone, isRemoving, role, selectedStaff) => {
    setBlocks(prevBlocks => {
      const newBlocks = { ...prevBlocks };

      updates.forEach(({ staffId, dayIndex, hour }) => {
        const utcHour = displayToUTC(dayIndex, hour, displayTimezone);
        const key = `${staffId}-${utcHour}`;
        const defaultRole = selectedStaff?.defaultRole || 'tier1';
        const roleToUse = role || defaultRole;

        if (isRemoving) {
          // Remove only the specified role from the array
          const result = removeRoleFromBlock(newBlocks[key], roleToUse, defaultRole);
          if (result === null) {
            delete newBlocks[key]; // Empty array = delete block
          } else {
            newBlocks[key] = result;
          }
        } else {
          // Add role to existing roles (don't replace)
          newBlocks[key] = addRoleToBlock(newBlocks[key], roleToUse, defaultRole);
        }
      });

      return newBlocks;
    });
  }, [setBlocks]);

  const removeStaffBlocks = useCallback((staffId) => {
    setBlocks(prevBlocks => {
      const newBlocks = { ...prevBlocks };
      Object.keys(newBlocks).forEach(key => {
        if (key.startsWith(`${staffId}-`)) {
          delete newBlocks[key];
        }
      });
      return newBlocks;
    });
  }, [setBlocks]);

  const clearAll = useCallback(() => {
    setBlocks({});
  }, [setBlocks]);

  const getStaffHours = useCallback((staffId) => {
    return Object.keys(blocks).filter(k => k.startsWith(`${staffId}-`)).length;
  }, [blocks]);

  const hasBlock = useCallback((staffId, utcHour, role = null, defaultRole = 'tier1') => {
    const value = blocks[`${staffId}-${utcHour}`];
    if (!value) return false;
    if (!role) return true; // Any role present
    return blockHasRole(value, role, defaultRole);
  }, [blocks]);

  return {
    blocks,
    setBlocks,
    updateBlocks,
    removeStaffBlocks,
    clearAll,
    getStaffHours,
    hasBlock,
  };
};
