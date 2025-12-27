import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleApi, ConflictError } from '../services/api';
import { DEFAULT_STAFF, DEFAULT_BLOCKS } from '../data/defaultData';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEYS = {
  STAFF: 'staff-scheduler-staff',
  BLOCKS: 'staff-scheduler-blocks',
};

export const useScheduleSync = () => {
  // Core state
  const [staff, setStaffLocal] = useState([]);
  const [blocks, setBlocksLocal] = useState({});
  const [version, setVersion] = useState(0);

  // Sync status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncError, setSyncError] = useState(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for polling
  const pollIntervalRef = useRef(null);
  const latestVersionRef = useRef(version);

  // Keep refs in sync
  useEffect(() => {
    latestVersionRef.current = version;
  }, [version]);

  // localStorage functions
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storedStaff = localStorage.getItem(STORAGE_KEYS.STAFF);
      const storedBlocks = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      setStaffLocal(storedStaff ? JSON.parse(storedStaff) : DEFAULT_STAFF);
      setBlocksLocal(storedBlocks ? JSON.parse(storedBlocks) : DEFAULT_BLOCKS);
    } catch {
      setStaffLocal(DEFAULT_STAFF);
      setBlocksLocal(DEFAULT_BLOCKS);
    }
  }, []);

  const saveToLocalStorage = useCallback((s, b) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(s));
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(b));
    } catch (e) {
      console.error('localStorage save failed:', e);
    }
  }, []);

  // Save to server
  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await scheduleApi.saveSchedule(staff, blocks, version);
      setVersion(result.version);
      setSyncError(null);
      setHasConflict(false);
      setHasUnsavedChanges(false);

      // Also save to localStorage as backup
      saveToLocalStorage(staff, blocks);

      return { success: true };
    } catch (error) {
      if (error instanceof ConflictError) {
        setHasConflict(true);
        setSyncError('Another user modified the schedule. Please refresh.');
      } else {
        setSyncError(error.message);
        // Save locally as fallback
        saveToLocalStorage(staff, blocks);
      }
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  }, [staff, blocks, version, saveToLocalStorage]);

  // Wrapped setters that track unsaved changes
  const setStaff = useCallback((updater) => {
    setStaffLocal(prev => {
      const newStaff = typeof updater === 'function' ? updater(prev) : updater;
      return newStaff;
    });
    setHasUnsavedChanges(true);
    // Save to localStorage immediately for local persistence
    setStaffLocal(current => {
      setBlocksLocal(currentBlocks => {
        saveToLocalStorage(current, currentBlocks);
        return currentBlocks;
      });
      return current;
    });
  }, [saveToLocalStorage]);

  const setBlocks = useCallback((updater) => {
    setBlocksLocal(prev => {
      const newBlocks = typeof updater === 'function' ? updater(prev) : updater;
      return newBlocks;
    });
    setHasUnsavedChanges(true);
    // Save to localStorage immediately for local persistence
    setBlocksLocal(current => {
      setStaffLocal(currentStaff => {
        saveToLocalStorage(currentStaff, current);
        return currentStaff;
      });
      return current;
    });
  }, [saveToLocalStorage]);

  // Fetch schedule from server
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await scheduleApi.getSchedule();

      if (data.staff.length === 0) {
        // Check if we have local data to migrate
        const localStaff = localStorage.getItem(STORAGE_KEYS.STAFF);
        if (localStaff) {
          const parsedStaff = JSON.parse(localStaff);
          const parsedBlocks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLOCKS) || '{}');
          if (parsedStaff.length > 0) {
            setStaffLocal(parsedStaff);
            setBlocksLocal(parsedBlocks);
            setHasUnsavedChanges(true);
            setIsLoading(false);
            setSyncError(null);
            return;
          }
        }
        // No local data, use defaults
        setStaffLocal(DEFAULT_STAFF);
        setBlocksLocal(DEFAULT_BLOCKS);
        setHasUnsavedChanges(true);
      } else {
        setStaffLocal(data.staff);
        setBlocksLocal(data.blocks);
        setVersion(data.version);
        saveToLocalStorage(data.staff, data.blocks);
        setHasUnsavedChanges(false);
      }

      setSyncError(null);
    } catch (error) {
      setSyncError(error.message);
      loadFromLocalStorage();
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocalStorage, saveToLocalStorage]);

  // Refs for polling conditions (to avoid recreating startPolling)
  const isOnlineRef = useRef(isOnline);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Polling for changes from other users
  const startPolling = useCallback(() => {
    pollIntervalRef.current = setInterval(async () => {
      if (!isOnlineRef.current || hasUnsavedChangesRef.current) return;

      try {
        const { version: serverVersion } = await scheduleApi.getVersion();
        if (serverVersion > latestVersionRef.current) {
          const data = await scheduleApi.getSchedule();
          setStaffLocal(data.staff);
          setBlocksLocal(data.blocks);
          setVersion(data.version);
          saveToLocalStorage(data.staff, data.blocks);
        }
      } catch {
        // Silent fail for polling
      }
    }, POLL_INTERVAL);
  }, [saveToLocalStorage]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  // Refresh handler for conflict resolution
  const refreshFromServer = useCallback(async () => {
    await fetchSchedule();
    setHasConflict(false);
    setHasUnsavedChanges(false);
  }, [fetchSchedule]);

  // Refs for initialization callbacks (to avoid re-running on every change)
  const fetchScheduleRef = useRef(fetchSchedule);
  const startPollingRef = useRef(startPolling);
  const stopPollingRef = useRef(stopPolling);

  useEffect(() => {
    fetchScheduleRef.current = fetchSchedule;
    startPollingRef.current = startPolling;
    stopPollingRef.current = stopPolling;
  });

  // Initial fetch and setup - runs only once on mount
  useEffect(() => {
    fetchScheduleRef.current();
    startPollingRef.current();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      stopPollingRef.current();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return {
    staff,
    blocks,
    setStaff,
    setBlocks,
    // Sync status
    isLoading,
    isSaving,
    isOnline,
    syncError,
    hasConflict,
    hasUnsavedChanges,
    // Actions
    save,
    refreshFromServer,
  };
};
