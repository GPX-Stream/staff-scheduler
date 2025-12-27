import { getSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(200).json({ valid: false });
    }

    const session = await getSession(token);

    if (!session) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      user: {
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({
      valid: false,
      error: 'Internal server error',
    });
  }
}
