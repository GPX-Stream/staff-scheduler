import { redis, KEYS } from '../_lib/redis.js';
import { getAllUsers, saveAllUsers, findUserByToken } from '../_lib/auth.js';

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

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const normalizedUsername = username.toLowerCase();

    // Check if trying to delete self
    if (normalizedUsername === currentUser.username) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Get users
    const users = await getAllUsers();
    if (!users[normalizedUsername]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if this is the last admin
    const adminCount = Object.values(users).filter(u => u.role === 'admin').length;
    if (users[normalizedUsername].role === 'admin' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    // Find staff record using same priority as other endpoints
    const staffData = await redis.get(KEYS.STAFF);
    const staff = Array.isArray(staffData) ? staffData : [];
    const user = users[normalizedUsername];

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

    const staffMember = staffIndex !== -1 ? staff[staffIndex] : null;

    // Delete schedule blocks for this staff member
    if (staffMember) {
      const blocksData = await redis.get(KEYS.BLOCKS);
      let blocks = {};

      if (blocksData) {
        if (typeof blocksData === 'string') {
          try {
            blocks = JSON.parse(blocksData);
          } catch {
            blocks = {};
          }
        } else {
          blocks = blocksData;
        }
      }

      // Remove all blocks for this staff member
      const staffId = staffMember.id;
      const keysToRemove = Object.keys(blocks).filter(key => {
        const [blockStaffId] = key.split('-');
        return parseInt(blockStaffId, 10) === staffId;
      });

      keysToRemove.forEach(key => {
        delete blocks[key];
      });

      await redis.set(KEYS.BLOCKS, JSON.stringify(blocks));
    }

    // Delete staff record
    if (staffIndex !== -1) {
      staff.splice(staffIndex, 1);
      await redis.set(KEYS.STAFF, JSON.stringify(staff));
    }

    // Delete user record
    delete users[normalizedUsername];
    await saveAllUsers(users);

    // Increment version
    await redis.incr(KEYS.VERSION);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
