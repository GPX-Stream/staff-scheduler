import { redis, KEYS } from '../_lib/redis.js';
import { getAllUsers, findUserByToken } from '../_lib/auth.js';

// Generate staff name from display name (e.g., "Andy Iancu" -> "Andy I.")
function generateStaffName(displayName) {
  if (!displayName) return '';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await findUserByToken(token);
    if (!currentUser) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all users
    const usersData = await getAllUsers();

    // Get all staff
    const staffData = await redis.get(KEYS.STAFF);
    const staff = Array.isArray(staffData) ? staffData : [];

    // Merge user and staff data
    const users = Object.values(usersData).map(user => {
      // Find matching staff member by staffId (foreign key), then username, then name
      let staffMember = null;

      // Priority 1: Match by staffId foreign key
      if (user.staffId) {
        staffMember = staff.find(s => s.id === user.staffId);
      }

      // Priority 2: Match by username field on staff
      if (!staffMember) {
        staffMember = staff.find(s => s.username === user.username);
      }

      // Priority 3: Fallback - match by generated staff name (for legacy data)
      if (!staffMember && user.displayName) {
        const expectedStaffName = generateStaffName(user.displayName);
        staffMember = staff.find(s => s.name === expectedStaffName);
      }

      return {
        username: user.username,
        displayName: user.displayName,
        authRole: user.role,
        createdAt: user.createdAt,
        // Staff data
        staffId: staffMember?.id || user.staffId,
        staffName: staffMember?.name,
        timezone: staffMember?.timezone,
        defaultRole: staffMember?.defaultRole,
        color: staffMember?.color,
      };
    });

    // Sort by displayName
    users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Failed to list users' });
  }
}
