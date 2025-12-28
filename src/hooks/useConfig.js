import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from './useAuth';

const API_BASE = '/api/config';

/**
 * Hook to manage app configuration from the database
 * No fallback defaults - database is the single source of truth
 */
export const useConfig = () => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch config from server on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/get`);
        const data = await res.json();

        if (data.config) {
          setConfig(data.config);
        } else {
          setError('No configuration found in database');
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
        setError('Failed to load configuration from database');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Save config to server (admin only)
  const saveConfig = useCallback(async (newConfig) => {
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ config: newConfig }),
      });

      const data = await res.json();

      if (data.success && data.config) {
        setConfig(data.config);
        return { success: true };
      } else {
        setError(data.error || 'Failed to save config');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Config save error:', err);
      setError('Unable to connect to server');
      return { success: false, error: 'Unable to connect to server' };
    }
  }, []);

  // Update a specific section of config
  const updateConfigSection = useCallback(async (section, value) => {
    const newConfig = { ...config, [section]: value };
    return saveConfig(newConfig);
  }, [config, saveConfig]);

  return {
    config,
    isLoading,
    error,
    saveConfig,
    updateConfigSection,
    // Convenience accessors - all from Redis config (single source of truth)
    // Returns null/undefined if config not loaded - consumers must handle this
    coverage: config?.coverage,
    timezones: config?.timezones,
    colors: config?.colors,
    roles: config?.roles,
  };
};
