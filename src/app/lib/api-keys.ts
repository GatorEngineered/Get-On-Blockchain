// src/app/lib/api-keys.ts
// API Key generation and validation utilities

import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';

const API_KEY_PREFIX = 'gob_live_';
const API_KEY_LENGTH = 32; // 32 random bytes = 64 hex chars

/**
 * Generate a new API key
 * Returns both the full key (show once to user) and the hash (store in DB)
 */
export function generateApiKey(): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const keyBody = randomBytes.toString('hex');

  // Full key includes prefix
  const fullKey = `${API_KEY_PREFIX}${keyBody}`;

  // Prefix is first 8 chars of the body (for display)
  const keyPrefix = `${API_KEY_PREFIX}${keyBody.substring(0, 8)}`;

  // Hash the full key for storage
  const keyHash = hashApiKey(fullKey);

  return { fullKey, keyPrefix, keyHash };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key and return the associated merchant
 * Returns null if invalid or expired
 */
export async function validateApiKey(key: string): Promise<{
  apiKey: {
    id: string;
    merchantId: string;
    name: string;
    permissions: string[];
    rateLimit: number;
  };
  merchant: {
    id: string;
    slug: string;
    name: string;
    plan: string;
    businesses: { id: string }[];
  };
} | null> {
  // Must start with correct prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  // Hash the provided key
  const keyHash = hashApiKey(key);

  // Find matching key
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      merchant: {
        select: {
          id: true,
          slug: true,
          name: true,
          plan: true,
          businesses: { select: { id: true }, take: 1 }
        }
      }
    }
  });

  if (!apiKey) {
    return null;
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return {
    apiKey: {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      name: apiKey.name,
      permissions: apiKey.permissions as string[],
      rateLimit: apiKey.rateLimit,
    },
    merchant: apiKey.merchant
  };
}

/**
 * Check if an API key has a specific permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('*');
}

/**
 * Log API usage
 */
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.apiUsageLog.create({
    data: {
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
    }
  });
}

/**
 * Check rate limit for an API key
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);

  // Count requests in the last hour
  const count = await prisma.apiUsageLog.count({
    where: {
      apiKeyId,
      createdAt: { gte: oneHourAgo }
    }
  });

  const remaining = Math.max(0, limit - count);

  return {
    allowed: count < limit,
    remaining,
    resetAt: nextHour
  };
}

/**
 * Available API permissions
 */
export const API_PERMISSIONS = {
  'read:members': 'View member information',
  'write:members': 'Create and update members',
  'read:points': 'View points balances',
  'write:points': 'Award and deduct points',
  'read:rewards': 'View rewards catalog',
  'write:rewards': 'Create and update rewards',
  'read:orders': 'View external orders',
  'write:orders': 'Create orders (for point calculation)',
} as const;

export type ApiPermission = keyof typeof API_PERMISSIONS;
