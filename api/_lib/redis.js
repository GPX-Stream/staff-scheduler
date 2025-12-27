import { Redis } from '@upstash/redis';

// Vercel's Upstash integration uses KV_REST_API_* variables
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Redis keys for schedule data
export const KEYS = {
  STAFF: 'schedule:staff',
  BLOCKS: 'schedule:blocks',
  VERSION: 'schedule:version',
};

// Redis keys for authentication
export const AUTH_KEYS = {
  USER: (username) => `users:${username.toLowerCase()}`,
  SESSION: (token) => `sessions:${token}`,
};
