import { redis, KEYS } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const version = (await redis.get(KEYS.VERSION)) || 0;
    return res.status(200).json({ version });
  } catch (error) {
    console.error('Redis version error:', error);
    return res.status(500).json({ error: 'Failed to fetch version' });
  }
}
