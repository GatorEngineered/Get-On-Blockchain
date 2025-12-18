# Redis Setup with Upstash

 

This guide explains how to set up Redis for rate limiting using Upstash, a serverless Redis provider.

 

## Why Redis for Rate Limiting?

 

The current implementation uses in-memory rate limiting (`Map<string, RateLimitData>`), which has limitations:

 

- **No persistence**: Resets on server restart

- **No sharing**: Each server instance has its own limits (problematic for multi-instance deployments)

- **Memory leaks**: No automatic cleanup of expired entries

 

Redis provides:

- **Persistent storage**: Limits survive server restarts

- **Distributed**: Shared across all server instances

- **TTL support**: Automatic cleanup of expired keys

- **High performance**: Sub-millisecond latency

 

## Upstash Overview

 

[Upstash](https://upstash.com/) is a serverless Redis provider optimized for edge computing and serverless functions.

 

**Features**:

- Free tier: 10,000 requests/day

- REST API for serverless compatibility

- Global replication

- Automatic cleanup with TTL

- No connection pooling needed

 

**Pricing**:

- **Free**: 10K requests/day, 256MB storage

- **Pay-as-you-go**: $0.20 per 100K requests

- **Pro**: Fixed monthly pricing available

 

## Setup Instructions

 

### Step 1: Create Upstash Account

 

1. Visit [https://upstash.com/](https://upstash.com/)

2. Sign up with GitHub, Google, or email

3. Verify your email

 

### Step 2: Create Redis Database

 

1. In the Upstash console, click **"Create Database"**

2. Configure your database:

   - **Name**: `getonblockchain-rate-limit` (or any name)

   - **Type**: Regional or Global

     - **Regional**: Lower latency, single region (recommended for most cases)

     - **Global**: Multi-region replication (higher cost, better availability)

   - **Region**: Choose closest to your deployment (e.g., `us-east-1` for Vercel US)

   - **Eviction**: `allkeys-lru` (evict least recently used keys when full)

   - **TLS**: Enabled (default, recommended)

 

3. Click **"Create"**

 

### Step 3: Get Connection Details

 

After creation, you'll see:

 

```

UPSTASH_REDIS_REST_URL=https://your-db.upstash.io

UPSTASH_REDIS_REST_TOKEN=AXX1AAIncDE...

```

 

**Important**: Copy these values - you'll need them for environment variables.

 

### Step 4: Install Upstash Redis SDK

 

```bash

npm install @upstash/redis

```

 

### Step 5: Configure Environment Variables

 

Add to `.env.local` (development):

 

```bash

UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"

UPSTASH_REDIS_REST_TOKEN="AXX1AAIncDE..."

```

 

Add to your hosting platform (Vercel, Railway, etc.) for production.

 

### Step 6: Create Redis Utility

 

Create `/src/lib/redis/upstash.ts`:

 

```typescript

import { Redis } from '@upstash/redis';

 

// Initialize Upstash Redis client

export const redis = new Redis({

  url: process.env.UPSTASH_REDIS_REST_URL!,

  token: process.env.UPSTASH_REDIS_REST_TOKEN!,

});

 

/**

 * Rate limiting helper using Redis

 */

export async function checkRateLimit(

  key: string,

  limit: number = 10,

  windowSeconds: number = 600 // 10 minutes

): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {

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

  await redis.setex(`blocked:${key}`, durationSeconds, '1');

}

 

/**

 * Check if a key is blocked

 */

export async function isBlocked(key: string): Promise<boolean> {

  const blocked = await redis.get(`blocked:${key}`);

  return blocked === '1';

}

```

 

### Step 7: Update Payout Route to Use Redis

 

Edit `/src/app/api/rewards/payout/route.ts`:

 

```typescript

import { checkRateLimit } from '@/lib/redis/upstash';

 

export async function POST(req: NextRequest) {

  try {

    const { merchantSlug, memberId, businessId } = await req.json();

 

    // Validation...

 

    // Rate limiting with Redis

    const rateLimitKey = `payout:${memberId}:${businessId}`;

    const rateLimit = await checkRateLimit(rateLimitKey, 10, 600); // 10 requests per 10 minutes

 

    if (!rateLimit.allowed) {

      return NextResponse.json(

        {

          error: 'Too many payout requests. Please try again later.',

          resetIn: rateLimit.resetIn,

          remaining: rateLimit.remaining,

        },

        { status: 429 }

      );

    }

 

    // Continue with payout logic...

  } catch (error: any) {

    // Error handling...

  }

}

```

 

### Step 8: Update Magic Link Route

 

Edit `/src/app/api/member/auth/send-magic-link/route.ts`:

 

```typescript

import { checkRateLimit } from '@/lib/redis/upstash';

 

export async function POST(req: NextRequest) {

  try {

    const { email } = await req.json();

 

    // Rate limiting: 5 magic link requests per hour per email

    const rateLimitKey = `magiclink:${email.toLowerCase()}`;

    const rateLimit = await checkRateLimit(rateLimitKey, 5, 3600); // 5 per hour

 

    if (!rateLimit.allowed) {

      return NextResponse.json(

        {

          error: 'Too many login attempts. Please try again later.',

          resetIn: rateLimit.resetIn,

        },

        { status: 429 }

      );

    }

 

    // Continue with magic link generation...

  } catch (error: any) {

    // Error handling...

  }

}

```

 

## Testing Redis Connection

 

Create `/scripts/test-redis.ts`:

 

```typescript

import { redis } from '../src/lib/redis/upstash';

 

async function testRedis() {

  console.log('Testing Upstash Redis connection...');

 

  try {

    // Test 1: Set a key

    await redis.set('test:hello', 'world');

    console.log('✅ Set key: test:hello = world');

 

    // Test 2: Get the key

    const value = await redis.get('test:hello');

    console.log(`✅ Get key: test:hello = ${value}`);

 

    // Test 3: Test expiry

    await redis.setex('test:expiry', 10, 'expires-in-10s');

    console.log('✅ Set expiring key: test:expiry (10s TTL)');

 

    // Test 4: Increment counter

    await redis.incr('test:counter');

    await redis.incr('test:counter');

    const count = await redis.get('test:counter');

    console.log(`✅ Counter test: test:counter = ${count}`);

 

    // Test 5: Rate limiting

    const rl1 = await redis.incr('test:ratelimit');

    const rl2 = await redis.incr('test:ratelimit');

    console.log(`✅ Rate limit test: ${rl1}, ${rl2}`);

 

    // Cleanup

    await redis.del('test:hello', 'test:counter', 'test:ratelimit');

    console.log('✅ Cleanup complete');

 

    console.log('\n🎉 All tests passed! Redis is working correctly.');

  } catch (error) {

    console.error('❌ Redis test failed:', error);

    process.exit(1);

  }

}

 

testRedis();

```

 

Run the test:

 

```bash

npx tsx scripts/test-redis.ts

```

 

## Rate Limiting Strategies

 

### By IP Address (Global Rate Limit)

 

```typescript

const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

const rateLimit = await checkRateLimit(`global:${ip}`, 100, 60); // 100 req/min per IP

```

 

### By User ID (Per-User Rate Limit)

 

```typescript

const rateLimit = await checkRateLimit(`user:${userId}`, 50, 3600); // 50 req/hour per user

```

 

### By API Endpoint (Global Endpoint Rate Limit)

 

```typescript

const rateLimit = await checkRateLimit(`endpoint:${endpoint}`, 1000, 60); // 1000 req/min globally

```

 

### Sliding Window (More Accurate)

 

```typescript

// Using sorted sets for precise sliding window

const now = Date.now();

const windowMs = 60000; // 1 minute

const key = `sliding:${userId}`;

 

// Remove old entries

await redis.zremrangebyscore(key, 0, now - windowMs);

 

// Count requests in window

const count = await redis.zcard(key);

 

if (count < limit) {

  // Add current request

  await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });

  await redis.expire(key, Math.ceil(windowMs / 1000));

  // Allow request

} else {

  // Deny request

}

```

 

## Monitoring and Analytics

 

### View Rate Limit Stats

 

```typescript

// Get all rate limit keys

const keys = await redis.keys('ratelimit:*');

 

// Get counts for each

for (const key of keys) {

  const count = await redis.get(key);

  console.log(`${key}: ${count}`);

}

```

 

### Upstash Console

 

View real-time metrics in the Upstash dashboard:

- Request count

- Hit rate

- Latency

- Storage usage

 

## Advanced: Multiple Rate Limits

 

Combine multiple limits for better protection:

 

```typescript

async function checkMultipleRateLimits(userId: string, ip: string) {

  // Check user-specific limit

  const userLimit = await checkRateLimit(`user:${userId}`, 50, 3600);

  if (!userLimit.allowed) {

    return { allowed: false, reason: 'user_limit' };

  }

 

  // Check IP limit

  const ipLimit = await checkRateLimit(`ip:${ip}`, 100, 60);

  if (!ipLimit.allowed) {

    return { allowed: false, reason: 'ip_limit' };

  }

 

  // Check global limit

  const globalLimit = await checkRateLimit('global', 10000, 60);

  if (!globalLimit.allowed) {

    return { allowed: false, reason: 'global_limit' };

  }

 

  return { allowed: true };

}

```

 

## Troubleshooting

 

### Connection errors

 

**Error**: `Failed to connect to Upstash`

 

**Solutions**:

1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct

2. Check if your IP is blocked (unlikely with Upstash)

3. Verify Upstash database is active (check console)

 

### High latency

 

**Causes**:

- Database in different region than your app

- Network issues

 

**Solutions**:

- Use regional database in same region as app

- Consider global database for multi-region apps

- Enable edge caching in Upstash settings

 

### Rate limits not working

 

**Debug steps**:

```typescript

console.log('Rate limit key:', key);

console.log('Current count:', await redis.get(key));

console.log('TTL:', await redis.ttl(key));

```

 

Check:

- Keys are being created correctly

- TTL is set properly

- No typos in environment variables

 

## Environment Variables Summary

 

Add to `.env.local` and production:

 

```bash

# Upstash Redis for rate limiting

UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"

UPSTASH_REDIS_REST_TOKEN="AXX1AAIncDE..."

```

 

## Next Steps

 

After Redis setup:

1. ✅ Test rate limiting on staging

2. ✅ Monitor rate limit metrics in Upstash dashboard

3. ✅ Set up Sentry for error monitoring (see `SENTRY_SETUP.md`)

4. ✅ Create wallet balance monitoring job (see `BALANCE_MONITORING.md`)

 

## Resources

 

- [Upstash Documentation](https://docs.upstash.com/redis)

- [Upstash Redis SDK](https://github.com/upstash/upstash-redis)

- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Rate_limiting)

 

---

 

Need help? Check Upstash docs or open an issue on GitHub.

 