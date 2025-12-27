import { createUser, hasUsers } from '../_lib/auth.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify setup key
    const authHeader = req.headers.authorization;
    const providedKey = authHeader?.replace('Bearer ', '');
    const setupKey = process.env.ADMIN_SETUP_KEY;

    if (!setupKey) {
      return res.status(500).json({
        success: false,
        error: 'ADMIN_SETUP_KEY not configured',
      });
    }

    if (providedKey !== setupKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup key',
      });
    }

    // Check if users already exist
    const usersExist = await hasUsers();
    if (usersExist) {
      return res.status(400).json({
        success: false,
        error: 'Users already exist. Delete existing users first if you want to re-seed.',
      });
    }

    // Parse users config from environment
    const usersConfig = process.env.USERS_CONFIG;
    if (!usersConfig) {
      return res.status(500).json({
        success: false,
        error: 'USERS_CONFIG not configured',
      });
    }

    let users;
    try {
      users = JSON.parse(usersConfig);
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Invalid USERS_CONFIG JSON',
      });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'USERS_CONFIG must be a non-empty array',
      });
    }

    // Create each user
    const createdUsers = [];
    for (const user of users) {
      if (!user.username || !user.password || !user.displayName || !user.role) {
        return res.status(400).json({
          success: false,
          error: `Invalid user config: ${JSON.stringify(user)}`,
        });
      }

      await createUser(user);
      createdUsers.push(user.username);
    }

    return res.status(200).json({
      success: true,
      usersCreated: createdUsers.length,
      users: createdUsers,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
