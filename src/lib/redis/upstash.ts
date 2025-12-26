// src/lib/redis/upstash.ts

import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
// Only initialize if environment variables are present
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };

/**
 * Rate limiting helper using Redis
 * Falls back gracefully if Redis is not configured
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowSeconds: number = 600 // 10 minutes
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  // If Redis is not configured, allow the request (fail open)
  if (!redis) {
    console.warn('[Redis] Redis not configured, allowing request');
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  try {
    // Increment counter for this window
    const count = await redis.incr(windowKey);

    // Set expiry on first request
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetIn = windowSeconds - (Math.floor(now / 1000) % windowSeconds);

    return {
      allowed,
      remaining,
      resetIn,
    };
  } catch (error) {
    console.error('[Redis] Rate limit check failed:', error);
    // Fail open - allow the request if Redis is down
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/**
 * Block a specific key (e.g., for abuse prevention)
 */
export async function blockKey(key: string, durationSeconds: number = 3600): Promise<void> {
  if (!redis) {
    console.warn('[Redis] Redis not configured, cannot block key');
    return;
  }

  try {
    await redis.setex(`blocked:${key}`, durationSeconds, '1');
  } catch (error) {
    console.error('[Redis] Failed to block key:', error);
  }
}

/**
 * Check if a key is blocked
 */
export async function isBlocked(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const blocked = await redis.get(`blocked:${key}`);
    return blocked === '1';
  } catch (error) {
    console.error('[Redis] Failed to check if key is blocked:', error);
    return false;
  }
}

/**
 * Get Redis instance (for direct access if needed)
 */
export function getRedis(): Redis | null {
  return redis;
}
