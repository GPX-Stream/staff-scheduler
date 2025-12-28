import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '../../hooks/useAuth';

export const UsersTab = ({ config, onRefreshData, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    authRole: 'viewer',
    timezone: config?.timezones?.[0]?.id || 'America/New_York',
    defaultRole: config?.roles?.find(r => !r.isParent)?.id || 'tier1',
    colorIndex: 0,
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/list', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      displayName: '',
      password: '',
      authRole: 'viewer',
      timezone: config?.timezones?.[0]?.id || 'America/New_York',
      defaultRole: config?.roles?.find(r => !r.isParent)?.id || 'tier1',
      colorIndex: users.length % (config?.colors?.length || 8),
    });
  };

  const handleAdd = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      colorIndex: users.length % (config?.colors?.length || 8),
    }));
    setIsAddingUser(true);
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    const colorIndex = config?.colors?.findIndex(c => c.hex === user.color?.hex) ?? 0;

    // Validate timezone exists in config
    const timezoneValid = config?.timezones?.some(tz => tz.id === user.timezone);
    if (!timezoneValid && user.timezone) {
      setError(`User timezone "${user.timezone}" not found in config. Please check config or user data.`);
      return;
    }

    // Validate defaultRole exists in config (as non-parent)
    const roleValid = config?.roles?.some(r => !r.isParent && r.id === user.defaultRole);
    if (!roleValid && user.defaultRole) {
      setError(`User default role "${user.defaultRole}" not found in config. Please check config or user data.`);
      return;
    }

    setError(null);
    setFormData({
      username: user.username,
      displayName: user.displayName,
      password: '',
      authRole: user.authRole || user.role,
      timezone: user.timezone || '',
      defaultRole: user.defaultRole || '',
      colorIndex: colorIndex >= 0 ? colorIndex : 0,
    });
    setEditingUser(user);
    setIsAddingUser(false);
  };

  const handleCancel = () => {
    setIsAddingUser(false);
    setEditingUser(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('submit');
    setError(null);

    const selectedColor = config?.colors?.[formData.colorIndex] || config?.colors?.[0];

    try {
      const endpoint = isAddingUser ? '/api/users/create' : '/api/users/update';
      const body = isAddingUser
        ? {
            username: formData.username.toLowerCase().replace(/\s+/g, ''),
            displayName: formData.displayName,
            password: formData.password,
            authRole: formData.authRole,
            timezone: formData.timezone,
            defaultRole: formData.defaultRole,
            color: selectedColor,
          }
        : {
            username: formData.username,
            updates: {
              displayName: formData.displayName,
              authRole: formData.authRole,
              timezone: formData.timezone,
              defaultRole: formData.defaultRole,
              color: selectedColor,
              ...(formData.password ? { password: formData.password } : {}),
            },
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        handleCancel();
        if (onRefreshData) onRefreshData();
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user) => {
    if (user.username === currentUser?.username) {
      setError('Cannot delete yourself');
      return;
    }

    const adminCount = users.filter(u => (u.authRole || u.role) === 'admin').length;
    if ((user.authRole || user.role) === 'admin' && adminCount <= 1) {
      setError('Cannot delete the last admin');
      return;
    }

    if (!window.confirm(`Delete user "${user.displayName}"? This will also remove their schedule.`)) {
      return;
    }

    setActionLoading(user.username);
    setError(null);

    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ username: user.username }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        if (onRefreshData) onRefreshData();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isFormOpen = isAddingUser || editingUser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">User Management</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage user accounts and their schedule settings
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 space-y-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-100">
            {isAddingUser ? 'Add New User' : `Edit User: ${editingUser?.displayName}`}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username (only for new users) */}
            {isAddingUser && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g., johnd"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., John Doe"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isAddingUser ? 'Password' : 'New Password (leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={isAddingUser ? 'Enter password' : 'Enter new password'}
                required={isAddingUser}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Auth Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Auth Role
              </label>
              <select
                value={formData.authRole}
                onChange={(e) => setFormData(prev => ({ ...prev, authRole: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin (can edit)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config?.timezones?.map((tz) => (
                  <option key={tz.id} value={tz.id}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Default Schedule Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Schedule Role
              </label>
              <select
                value={formData.defaultRole}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultRole: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config?.roles?.filter(role => !role.isParent).map((role) => (
                  <option key={role.id} value={role.id}>{role.label}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {config?.colors?.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, colorIndex: idx }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.colorIndex === idx
                        ? 'border-slate-800 dark:border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'submit'}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'submit' ? 'Saving...' : isAddingUser ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Users Tables - Split by Role */}
      {!isFormOpen && (
        <div className="space-y-6">
          {/* Admins Table */}
          {users.filter(u => (u.authRole || u.role) === 'admin').length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Administrators
              </h4>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="w-[50%] md:w-[35%] px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="hidden md:table-cell w-[25%] px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Timezone
                      </th>
                      <th className="w-[30%] md:w-[25%] px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="w-[20%] md:w-[15%] px-2 md:px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.filter(u => (u.authRole || u.role) === 'admin').map((user) => (
                      <tr key={user.username} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-3 md:px-4 py-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div
                              className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-white text-sm font-medium flex-shrink-0"
                              style={{ backgroundColor: user.color?.hex || '#6b7280' }}
                            >
                              {user.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                {user.displayName}
                              </div>
                              <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {config?.timezones?.find(tz => tz.id === user.timezone)?.label || user.timezone || '-'}
                        </td>
                        <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-700 dark:text-slate-300 truncate">
                          {config?.roles?.find(r => r.id === user.defaultRole)?.label || user.defaultRole || '-'}
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={actionLoading === user.username}
                              className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {actionLoading === user.username ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Viewers Table */}
          {users.filter(u => (u.authRole || u.role) !== 'admin').length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Viewers
              </h4>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="w-[50%] md:w-[35%] px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="hidden md:table-cell w-[25%] px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Timezone
                      </th>
                      <th className="w-[30%] md:w-[25%] px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="w-[20%] md:w-[15%] px-2 md:px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.filter(u => (u.authRole || u.role) !== 'admin').map((user) => (
                      <tr key={user.username} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-3 md:px-4 py-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div
                              className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-white text-sm font-medium flex-shrink-0"
                              style={{ backgroundColor: user.color?.hex || '#6b7280' }}
                            >
                              {user.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                {user.displayName}
                              </div>
                              <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {config?.timezones?.find(tz => tz.id === user.timezone)?.label || user.timezone || '-'}
                        </td>
                        <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-700 dark:text-slate-300 truncate">
                          {config?.roles?.find(r => r.id === user.defaultRole)?.label || user.defaultRole || '-'}
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={actionLoading === user.username}
                              className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {actionLoading === user.username ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
