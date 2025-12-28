import { redis, KEYS } from '../_lib/redis.js';
import { getAllUsers, saveAllUsers, hashPassword, findUserByToken } from '../_lib/auth.js';

// Generate staff name from display name (e.g., "Andy Iancu" -> "Andy I.")
function generateStaffName(displayName) {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { username, updates } = req.body;

    if (!username || !updates) {
      return res.status(400).json({ error: 'Username and updates are required' });
    }

    const normalizedUsername = username.toLowerCase();

    // Get user
    const users = await getAllUsers();
    if (!users[normalizedUsername]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[normalizedUsername];

    // Update user fields
    if (updates.displayName) {
      user.displayName = updates.displayName;
    }
    if (updates.authRole) {
      user.role = updates.authRole;
    }
    if (updates.password) {
      user.passwordHash = await hashPassword(updates.password);
    }

    await saveAllUsers(users);

    // Update staff record
    const staffData = await redis.get(KEYS.STAFF);
    const staff = Array.isArray(staffData) ? staffData : [];

    // Find staff by staffId (foreign key) first, then username, then name
    let staffIndex = -1;

    // Priority 1: Match by staffId foreign key
    if (user.staffId) {
      staffIndex = staff.findIndex(s => s.id === user.staffId);
    }

    // Priority 2: Match by username field on staff
    if (staffIndex === -1) {
      staffIndex = staff.findIndex(s => s.username === normalizedUsername);
    }

    // Priority 3: Fallback - match by generated staff name (for legacy data)
    if (staffIndex === -1 && user.displayName) {
      const expectedStaffName = generateStaffName(user.displayName);
      staffIndex = staff.findIndex(s => s.name === expectedStaffName);
    }

    if (staffIndex !== -1) {
      const staffMember = staff[staffIndex];

      // Add staffId to user if missing (linking legacy data)
      if (!user.staffId) {
        user.staffId = staffMember.id;
        await saveAllUsers(users);
      }

      // Add username link if missing (for legacy staff)
      if (!staffMember.username) {
        staffMember.username = normalizedUsername;
      }

      if (updates.displayName) {
        staffMember.name = generateStaffName(updates.displayName);
      }
      if (updates.timezone) {
        staffMember.timezone = updates.timezone;
      }
      if (updates.defaultRole) {
        staffMember.defaultRole = updates.defaultRole;
      }
      if (updates.color) {
        staffMember.color = updates.color;
      }

      staff[staffIndex] = staffMember;
      await redis.set(KEYS.STAFF, JSON.stringify(staff));

      // Increment version
      await redis.incr(KEYS.VERSION);
    }

    const updatedStaff = staffIndex !== -1 ? staff[staffIndex] : null;

    return res.status(200).json({
      success: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        authRole: user.role,
        createdAt: user.createdAt,
      },
      staff: updatedStaff,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}
