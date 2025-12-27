import { COLORS } from '../constants';

const STORAGE_KEYS = {
  STAFF: 'staff-scheduler-staff',
  BLOCKS: 'staff-scheduler-blocks',
};

/**
 * Export schedule data to JSON file
 * @param {Object} data - Data to export
 * @param {Array} data.staff - Staff members
 * @param {Object} data.blocks - Schedule blocks
 */
export const exportToJSON = ({ staff, blocks }) => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    staff: staff.map(s => ({
      id: s.id,
      name: s.name,
      colorIndex: COLORS.findIndex(c => c.hex === s.color.hex),
      timezoneOffset: s.timezoneOffset,
    })),
    blocks,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `staff-schedule-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import schedule data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<{ staff: Array, blocks: Object }>} Imported data
 */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.staff || !data.blocks) {
          throw new Error('Invalid schedule file format');
        }

        // Reconstruct staff with full color objects
        const staff = data.staff.map(s => ({
          id: s.id,
          name: s.name,
          color: COLORS[s.colorIndex] || COLORS[0],
          timezoneOffset: s.timezoneOffset,
        }));

        resolve({ staff, blocks: data.blocks });
      } catch (error) {
        reject(new Error('Failed to parse schedule file: ' + error.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Clear all stored schedule data
 */
export const clearStoredData = () => {
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.BLOCKS);
};
