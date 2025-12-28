/**
 * Block utility functions for multi-role support
 * Handles backward compatibility with old formats (true, string) and new array format
 */

/**
 * Normalize a block value to an array of roles
 * @param {boolean|string|string[]} value - Block value from storage
 * @param {string} defaultRole - Default role to use when value is true
 * @returns {string[]} Array of role IDs
 */
export const normalizeBlockValue = (value, defaultRole = 'tier1') => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value === true) return [defaultRole];
  return [value]; // string role ID
};

/**
 * Check if a block has a specific role
 * @param {boolean|string|string[]} value - Block value
 * @param {string} roleId - Role to check for
 * @param {string} defaultRole - Default role to use when value is true
 * @returns {boolean}
 */
export const blockHasRole = (value, roleId, defaultRole = 'tier1') => {
  const roles = normalizeBlockValue(value, defaultRole);
  return roles.includes(roleId);
};

/**
 * Add a role to a block value
 * @param {boolean|string|string[]} value - Current block value
 * @param {string} roleId - Role to add
 * @param {string} defaultRole - Default role to use when value is true
 * @returns {string[]} Updated array of roles
 */
export const addRoleToBlock = (value, roleId, defaultRole = 'tier1') => {
  const roles = normalizeBlockValue(value, defaultRole);
  if (roles.includes(roleId)) return roles; // no-op if already present
  return [...roles, roleId];
};

/**
 * Remove a role from a block value
 * @param {boolean|string|string[]} value - Current block value
 * @param {string} roleId - Role to remove
 * @param {string} defaultRole - Default role to use when value is true
 * @returns {string[]|null} Updated array of roles, or null if empty (signals deletion)
 */
export const removeRoleFromBlock = (value, roleId, defaultRole = 'tier1') => {
  const roles = normalizeBlockValue(value, defaultRole);
  const filtered = roles.filter(r => r !== roleId);
  return filtered.length > 0 ? filtered : null;
};
