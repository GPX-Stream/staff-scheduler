import { getAuthHeaders } from '../hooks/useAuth';

const API_BASE = '/api/schedule';

export class ConflictError extends Error {
  constructor(message, serverVersion) {
    super(message);
    this.name = 'ConflictError';
    this.serverVersion = serverVersion;
  }
}

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export const scheduleApi = {
  async getSchedule() {
    const res = await fetch(`${API_BASE}/get`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },

  async saveSchedule(staff, blocks, baseVersion) {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ staff, blocks, baseVersion }),
    });

    if (res.status === 401) {
      throw new AuthError('Not authenticated', 401);
    }
    if (res.status === 403) {
      throw new AuthError('Not authorized to edit schedule', 403);
    }
    if (res.status === 409) {
      const data = await res.json();
      throw new ConflictError(data.message, data.currentVersion);
    }
    if (!res.ok) throw new Error('Failed to save schedule');
    return res.json();
  },

  async getVersion() {
    const res = await fetch(`${API_BASE}/version`);
    if (!res.ok) throw new Error('Failed to fetch version');
    return res.json();
  },
};
