import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redis, AUTH_KEYS } from './redis.js';

const SALT_ROUNDS = 10;

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
 * Get all users from Redis
 */
export async function getAllUsers() {
  const data = await redis.get(AUTH_KEYS.USERS);
  if (!data) return {};

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

/**
 * Save all users to Redis
 */
export async function saveAllUsers(users) {
  await redis.set(AUTH_KEYS.USERS, JSON.stringify(users));
}

/**
 * Get a user by username
 */
export async function getUser(username) {
  if (!username) return null;
  const users = await getAllUsers();
  return users[username.toLowerCase()] || null;
}

/**
 * Create a user
 */
export async function createUser(user) {
  const users = await getAllUsers();
  const username = user.username.toLowerCase();

  const userData = {
    username,
    displayName: user.displayName,
    passwordHash: await hashPassword(user.password),
    role: user.role,
    createdAt: new Date().toISOString(),
    sessionToken: null,
  };

  users[username] = userData;
  await saveAllUsers(users);
  return userData;
}

/**
 * Update a user's fields
 */
export async function updateUser(username, updates) {
  const users = await getAllUsers();
  const key = username.toLowerCase();

  if (!users[key]) return null;

  users[key] = { ...users[key], ...updates };
  await saveAllUsers(users);
  return users[key];
}

/**
 * Find a user by their session token
 */
export async function findUserByToken(token) {
  if (!token) return null;

  const users = await getAllUsers();
  for (const username in users) {
    if (users[username].sessionToken === token) {
      return users[username];
    }
  }
  return null;
}

/**
 * Set a session token on a user
 */
export async function setUserSession(username, token) {
  return updateUser(username, { sessionToken: token });
}

/**
 * Clear a user's session token
 */
export async function clearUserSession(username) {
  return updateUser(username, { sessionToken: null });
}

/**
 * Clear session by token (finds user first)
 */
export async function clearSessionByToken(token) {
  const user = await findUserByToken(token);
  if (user) {
    await clearUserSession(user.username);
    return true;
  }
  return false;
}

/**
 * Check if any users exist in the system
 */
export async function hasUsers() {
  const users = await getAllUsers();
  return Object.keys(users).length > 0;
}
