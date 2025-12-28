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

    const { username, displayName, password, authRole, timezone, defaultRole, color } = req.body;

    // Validation
    if (!username || !displayName || !password) {
      return res.status(400).json({ error: 'Username, display name, and password are required' });
    }

    const normalizedUsername = username.toLowerCase().replace(/\s+/g, '');

    // Check if username already exists
    const users = await getAllUsers();
    if (users[normalizedUsername]) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create staff record first to get the ID
    const staffData = await redis.get(KEYS.STAFF);
    const staff = Array.isArray(staffData) ? staffData : [];

    // Get next staff ID
    const maxId = staff.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const newStaffId = maxId + 1;

    // Create user record with matching staff ID
    const passwordHash = await hashPassword(password);
    const newUser = {
      username: normalizedUsername,
      displayName,
      passwordHash,
      role: authRole || 'viewer',
      staffId: newStaffId, // Foreign key to staff
      createdAt: new Date().toISOString(),
      sessionToken: null,
    };

    // Save user
    users[normalizedUsername] = newUser;
    await saveAllUsers(users);

    const newStaff = {
      id: newStaffId,
      name: generateStaffName(displayName),
      username: normalizedUsername, // Link to user
      color: color || {
        name: 'blue',
        bg: 'bg-blue-500',
        light: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-700',
        hex: '#3b82f6',
      },
      timezone: timezone || 'America/New_York',
      defaultRole: defaultRole || 'tier1',
    };

    staff.push(newStaff);
    await redis.set(KEYS.STAFF, JSON.stringify(staff));

    // Increment version
    await redis.incr(KEYS.VERSION);

    return res.status(200).json({
      success: true,
      user: {
        username: newUser.username,
        displayName: newUser.displayName,
        authRole: newUser.role,
        createdAt: newUser.createdAt,
      },
      staff: newStaff,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}
