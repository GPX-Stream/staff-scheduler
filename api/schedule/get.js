import { redis, KEYS } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [staff, blocks, version] = await Promise.all([
      redis.get(KEYS.STAFF),
      redis.get(KEYS.BLOCKS),
      redis.get(KEYS.VERSION),
    ]);

    return res.status(200).json({
      staff: staff || [],
      blocks: blocks || {},
      version: version || 0,
    });
  } catch (error) {
    console.error('Redis get error:', error);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}
