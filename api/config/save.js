import { redis, CONFIG_KEYS, DEFAULT_CONFIG } from '../_lib/redis.js';
import { findUserByToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const user = await findUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Config data required' });
    }

    // Validate config structure
    const validatedConfig = {
      coverage: {
        start: typeof config.coverage?.start === 'number' ? config.coverage.start : DEFAULT_CONFIG.coverage.start,
        end: typeof config.coverage?.end === 'number' ? config.coverage.end : DEFAULT_CONFIG.coverage.end,
      },
      timezones: Array.isArray(config.timezones) ? config.timezones : DEFAULT_CONFIG.timezones,
      colors: Array.isArray(config.colors) ? config.colors : DEFAULT_CONFIG.colors,
      roles: Array.isArray(config.roles) ? config.roles : DEFAULT_CONFIG.roles,
    };

    await redis.set(CONFIG_KEYS.CONFIG, validatedConfig);

    return res.status(200).json({
      success: true,
      config: validatedConfig,
    });
  } catch (error) {
    console.error('Redis config save error:', error);
    return res.status(500).json({ error: 'Failed to save config' });
  }
}
