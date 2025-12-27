import { useCallback } from 'react';
import { DEFAULT_BLOCKS } from '../data/defaultData';
import { displayToUTC } from '../utils';

/**
 * Hook to manage schedule blocks operations
 * @param {Object} blocks - Current blocks state
 * @param {Function} setBlocks - Setter for blocks state
 * @returns {Object} Block operation handlers
 */
export const useScheduleBlocks = (blocks, setBlocks) => {
  const updateBlocks = useCallback((updates, displayOffset, isRemoving) => {
    setBlocks(prevBlocks => {
      const newBlocks = { ...prevBlocks };

      updates.forEach(({ staffId, dayIndex, hour }) => {
        const utcHour = displayToUTC(dayIndex, hour, displayOffset);
        const key = `${staffId}-${utcHour}`;

        if (isRemoving) {
          delete newBlocks[key];
        } else {
          newBlocks[key] = true;
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

  const resetToDefaults = useCallback(() => {
    setBlocks(DEFAULT_BLOCKS);
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
    resetToDefaults,
    getStaffHours,
    hasBlock,
  };
};
