import { redis, KEYS } from '../_lib/redis.js';
import { findUserByToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await findUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Authorization check - only admins can save
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit schedule' });
    }

    const { staff, blocks, baseVersion } = req.body;

    // Optimistic lock check
    const currentVersion = (await redis.get(KEYS.VERSION)) || 0;
    if (baseVersion !== undefined && baseVersion !== currentVersion) {
      return res.status(409).json({
        error: 'Version conflict',
        currentVersion,
        message: 'Schedule was modified by another user',
      });
    }

    const newVersion = currentVersion + 1;

    // Save all data atomically using pipeline
    const pipeline = redis.pipeline();
    pipeline.set(KEYS.STAFF, staff);
    pipeline.set(KEYS.BLOCKS, blocks);
    pipeline.set(KEYS.VERSION, newVersion);
    await pipeline.exec();

    return res.status(200).json({ success: true, version: newVersion });
  } catch (error) {
    console.error('Redis save error:', error);
    return res.status(500).json({ error: 'Failed to save schedule' });
  }
}
