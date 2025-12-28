import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleApi, ConflictError } from '../services/api';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

  // Save to server
  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await scheduleApi.saveSchedule(staff, blocks, version);
      setVersion(result.version);
      setSyncError(null);
      setHasConflict(false);
      setHasUnsavedChanges(false);
      return { success: true };
    } catch (error) {
      if (error instanceof ConflictError) {
        setHasConflict(true);
        setSyncError('Another user modified the schedule. Please refresh.');
      } else {
        setSyncError(error.message);
      }
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  }, [staff, blocks, version]);

  // Wrapped setters that track unsaved changes
  const setStaff = useCallback((updater) => {
    setStaffLocal(prev => typeof updater === 'function' ? updater(prev) : updater);
    setHasUnsavedChanges(true);
  }, []);

  const setBlocks = useCallback((updater) => {
    setBlocksLocal(prev => typeof updater === 'function' ? updater(prev) : updater);
    setHasUnsavedChanges(true);
  }, []);

  // Fetch schedule from server
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await scheduleApi.getSchedule();

      setStaffLocal(data.staff || []);
      setBlocksLocal(data.blocks || {});
      setVersion(data.version || 0);
      setHasUnsavedChanges(false);
      setSyncError(null);
    } catch (error) {
      setSyncError(error.message);
      setStaffLocal([]);
      setBlocksLocal({});
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        }
      } catch {
        // Silent fail for polling
      }
    }, POLL_INTERVAL);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  // Refresh handler for conflict resolution / cancel (does NOT show loading spinner)
  const refreshFromServer = useCallback(async () => {
    try {
      const data = await scheduleApi.getSchedule();
      setStaffLocal(data.staff || []);
      setBlocksLocal(data.blocks || {});
      setVersion(data.version || 0);
      setHasConflict(false);
      setHasUnsavedChanges(false);
      setSyncError(null);
    } catch (error) {
      setSyncError(error.message);
    }
  }, []);

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
