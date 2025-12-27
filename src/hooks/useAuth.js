import { useState, useCallback, useEffect } from 'react';

const TOKEN_KEY = 'staff-scheduler-token';
const API_BASE = '/api/auth';

/**
 * Hook to manage user authentication with server-side validation
 * Uses sessionStorage so authentication clears when browser is closed
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verify existing session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.valid && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          // Invalid token, clear it
          sessionStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        sessionStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = useCallback(async (username, password) => {
    setError('');

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.token && data.user) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    // Clear local state immediately
    sessionStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);

    // Also invalidate server session (fire and forget)
    if (token) {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  }, []);

  return {
    isAuthenticated,
    user,
    isAdmin: user?.role === 'admin',
    loading,
    error,
    login,
    logout,
  };
};

/**
 * Get the auth token for API requests
 */
export const getAuthToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
