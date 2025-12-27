import { useState, useEffect } from 'react';

/**
 * Hook that syncs state with localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if no stored value exists
 * @returns {[*, function]} State value and setter
 */
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key, value]);

  return [value, setValue];
};
