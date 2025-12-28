import { useCallback } from 'react';
import { displayToUTC } from '../utils';

/**
 * Hook to manage schedule blocks operations
 * @param {Object} blocks - Current blocks state
 * @param {Function} setBlocks - Setter for blocks state
 * @returns {Object} Block operation handlers
 */
export const useScheduleBlocks = (blocks, setBlocks) => {
  /**
   * Update blocks with optional role assignment
   * @param {Array} updates - Array of {staffId, dayIndex, hour}
   * @param {string} displayTimezone - Current display timezone
   * @param {boolean} isRemoving - Whether to remove blocks
   * @param {string} [role] - Role to assign (if not provided, stores true for backwards compat)
   */
  const updateBlocks = useCallback((updates, displayTimezone, isRemoving, role) => {
    setBlocks(prevBlocks => {
      const newBlocks = { ...prevBlocks };

      updates.forEach(({ staffId, dayIndex, hour }) => {
        const utcHour = displayToUTC(dayIndex, hour, displayTimezone);
        const key = `${staffId}-${utcHour}`;

        if (isRemoving) {
          delete newBlocks[key];
        } else {
          // Store role string if provided, otherwise true for backwards compatibility
          newBlocks[key] = role || true;
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

  const hasBlock = useCallback((staffId, utcHour) => {
    return !!blocks[`${staffId}-${utcHour}`];
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
