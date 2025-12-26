// Rate limiting middleware
import { NextResponse } from "next/server";
import { CONFIG } from "./utils";
import { checkRateLimit as checkRedisRateLimit, getRedis } from "@/lib/redis/upstash";

type RateLimitStore = {
  count: number;
  resetTime: number;
};

// In-memory store for rate limiting (fallback when Redis is not configured)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries every 5 minutes (only for in-memory fallback)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * In-memory rate limiting (fallback when Redis is not available)
 */
function checkInMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  let store = rateLimitStore.get(key);

  if (!store || store.resetTime < now) {
    // Create new rate limit window
    store = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, store);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: Math.ceil(windowMs / 1000),
    };
  }

  if (store.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((store.resetTime - now) / 1000),
    };
  }

  // Increment counter
  store.count++;
  rateLimitStore.set(key, store);

  return {
    allowed: true,
    remaining: maxRequests - store.count,
    resetIn: Math.ceil((store.resetTime - now) / 1000),
  };
}

/**
 * Rate limiting middleware
 * Returns null if request is allowed, or error response if rate limit exceeded
 * Uses Redis if configured, falls back to in-memory otherwise
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = CONFIG.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = CONFIG.RATE_LIMIT_WINDOW
): Promise<NextResponse | null> {
  const redis = getRedis();
  const windowSeconds = Math.floor(windowMs / 1000);

  let result: { allowed: boolean; remaining: number; resetIn: number };

  // Use Redis if available, otherwise fall back to in-memory
  if (redis) {
    result = await checkRedisRateLimit(identifier, maxRequests, windowSeconds);
  } else {
    result = checkInMemoryRateLimit(identifier, maxRequests, windowMs);
  }

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: `${result.resetIn} seconds`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.resetIn.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": (Date.now() + result.resetIn * 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Get client identifier from request
 * Uses IP address or falls back to a default
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return ip;
}

/**
 * Apply rate limiting to a request
 * Returns error response if rate limit exceeded, otherwise null
 */
export async function applyRateLimit(
  req: Request,
  maxRequests?: number,
  windowMs?: number
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(req);
  return await checkRateLimit(identifier, maxRequests, windowMs);
}