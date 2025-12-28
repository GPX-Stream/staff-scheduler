import { redis, CONFIG_KEYS, DEFAULT_CONFIG } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = await redis.get(CONFIG_KEYS.CONFIG);

    // Return stored config merged with defaults (in case new fields were added)
    return res.status(200).json({
      config: config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG,
    });
  } catch (error) {
    console.error('Redis config get error:', error);
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
}
