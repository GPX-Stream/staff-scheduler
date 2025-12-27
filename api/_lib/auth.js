import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redis, AUTH_KEYS } from './redis.js';

const SALT_ROUNDS = 10;
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically random session token
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a session in Redis
 */
export async function createSession(token, user) {
  const session = {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: new Date().toISOString(),
  };

  await redis.set(AUTH_KEYS.SESSION(token), JSON.stringify(session), {
    ex: SESSION_TTL,
  });

  return session;
}

/**
 * Get a session from Redis
 */
export async function getSession(token) {
  if (!token) return null;

  const data = await redis.get(AUTH_KEYS.SESSION(token));
  if (!data) return null;

  // Handle both string and object responses from Redis
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

/**
 * Delete a session from Redis
 */
export async function deleteSession(token) {
  if (!token) return false;
  await redis.del(AUTH_KEYS.SESSION(token));
  return true;
}

/**
 * Get a user from Redis by username
 */
export async function getUser(username) {
  if (!username) return null;

  const data = await redis.get(AUTH_KEYS.USER(username));
  if (!data) return null;

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

/**
 * Create a user in Redis
 */
export async function createUser(user) {
  const userData = {
    username: user.username.toLowerCase(),
    displayName: user.displayName,
    passwordHash: await hashPassword(user.password),
    role: user.role,
    createdAt: new Date().toISOString(),
  };

  await redis.set(AUTH_KEYS.USER(user.username), JSON.stringify(userData));
  return userData;
}

/**
 * Check if any users exist in the system
 */
export async function hasUsers() {
  // Try to scan for any user keys
  const result = await redis.scan(0, { match: 'users:*', count: 1 });
  return result[1] && result[1].length > 0;
}
