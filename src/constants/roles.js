// Role helper functions
// Roles are stored in Upstash Redis (api/_lib/redis.js) as the single source of truth

// Color name to hex mapping for role colors
const ROLE_COLOR_HEX = {
  blue: '#3b82f6',
  green: '#22c55e',
  emerald: '#10b981',
  amber: '#f59e0b',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  teal: '#14b8a6',
  purple: '#a855f7',
  pink: '#ec4899',
};

// Helper to get role label by id
export const getRoleLabel = (roles, roleId) => {
  if (!roles?.length) return roleId;
  const role = roles.find(r => r.id === roleId);
  return role?.label || roleId;
};

// Helper to get short role label (for compact display)
export const getRoleShortLabel = (roles, roleId) => {
  if (!roles?.length) return roleId;
  const role = roles.find(r => r.id === roleId);
  if (!role) return roleId;
  // Shorten "Support - Tier X" to "Tier X"
  if (role.label.startsWith('Support - ')) {
    return role.label.replace('Support - ', '');
  }
  return role.label;
};

// Helper to get role color hex value
export const getRoleColorHex = (roles, roleId) => {
  if (!roles?.length) return '#6b7280'; // gray fallback
  const role = roles.find(r => r.id === roleId);
  if (!role?.color) return '#6b7280';
  return ROLE_COLOR_HEX[role.color] || '#6b7280';
};
