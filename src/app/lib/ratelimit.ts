// Rate limiting using Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance - uses environment variables:
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : null;

// Create rate limiter for admin login
// Limit: 5 attempts per 15 minutes per IP
export const adminLoginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:admin:login",
    })
  : null;

// Create rate limiter for general API routes
// Limit: 100 requests per minute per IP
export const adminApiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin:api",
    })
  : null;

// Create rate limiter for image uploads
// Limit: 10 uploads per minute per user
export const adminUploadLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin:upload",
    })
  : null;

// Helper to check rate limit
export async function checkRateLimit(
  identifier: string,
  limiter: typeof adminLoginLimiter
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Rate limiting not configured - allow request
    return { success: true };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the request (fail open)
    return { success: true };
  }
}
