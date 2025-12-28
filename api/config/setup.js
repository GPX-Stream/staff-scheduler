import { redis, CONFIG_KEYS, DEFAULT_CONFIG } from '../_lib/redis.js';

export default async function handler(req, res) {
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

    // Check if config already exists
    const existingConfig = await redis.get(CONFIG_KEYS.CONFIG);

    // Allow force override with query param
    const force = req.query.force === 'true';

    if (existingConfig && !force) {
      return res.status(400).json({
        success: false,
        error: 'Config already exists. Use ?force=true to override.',
        existingConfig,
      });
    }

    // Use custom config from body or default
    const configToSave = req.body.config || DEFAULT_CONFIG;

    await redis.set(CONFIG_KEYS.CONFIG, configToSave);

    return res.status(200).json({
      success: true,
      message: force ? 'Config overwritten' : 'Config seeded',
      config: configToSave,
    });
  } catch (error) {
    console.error('Config setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
