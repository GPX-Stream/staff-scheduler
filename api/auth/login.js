import { getUser, verifyPassword, generateToken, setUserSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Get user from database
    const user = await getUser(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Generate and store session token on user
    const token = generateToken();
    await setUserSession(username, token);

    return res.status(200).json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
