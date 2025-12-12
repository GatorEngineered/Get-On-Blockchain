// Rate limiting middleware
import { NextResponse } from "next/server";
import { CONFIG } from "./utils";

type RateLimitStore = {
  count: number;
  resetTime: number;
};

// In-memory store for rate limiting
// In production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries every 5 minutes
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
 * Rate limiting middleware
 * Returns null if request is allowed, or error response if rate limit exceeded
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = CONFIG.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = CONFIG.RATE_LIMIT_WINDOW
): NextResponse | null {
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
    return null;
  }

  if (store.count >= maxRequests) {
    const retryAfter = Math.ceil((store.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: `${retryAfter} seconds`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": store.resetTime.toString(),
        },
      }
    );
  }

  // Increment counter
  store.count++;
  rateLimitStore.set(key, store);

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
export function applyRateLimit(
  req: Request,
  maxRequests?: number,
  windowMs?: number
): NextResponse | null {
  const identifier = getClientIdentifier(req);
  return checkRateLimit(identifier, maxRequests, windowMs);
}