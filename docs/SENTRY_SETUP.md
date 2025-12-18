# Sentry Error Monitoring Setup

 

This guide explains how to set up Sentry for production error monitoring and performance tracking.

 

## Why Sentry?

 

Sentry provides:

- **Real-time error tracking**: Get notified immediately when errors occur

- **Performance monitoring**: Track slow API endpoints and database queries

- **Error grouping**: Automatically group similar errors

- **Source maps**: See exact line numbers in production errors

- **User context**: Know which users are affected by errors

- **Release tracking**: Track errors across deployments

 

## Setup Instructions

 

### Step 1: Create Sentry Account

 

1. Visit [https://sentry.io/signup/](https://sentry.io/signup/)

2. Sign up with GitHub, Google, or email

3. Create a new organization (e.g., "Get On Blockchain")

 

### Step 2: Create a Project

 

1. Click **"Create Project"**

2. Select platform: **Next.js**

3. Set alert frequency: **On every new issue** (recommended)

4. Name your project: `getonblockchain-production`

5. Click **"Create Project"**

 

### Step 3: Get DSN (Data Source Name)

 

After project creation, copy your DSN:

 

```

https://abc123def456@o123456.ingest.sentry.io/7891011

```

 

This is your unique identifier for sending errors to Sentry.

 

### Step 4: Install Sentry SDK

 

```bash

npx @sentry/wizard@latest -i nextjs

```

 

This wizard will:

- Install `@sentry/nextjs` package

- Create Sentry configuration files

- Add build scripts to `package.json`

- Prompt for your DSN

 

**Manual installation** (if wizard doesn't work):

 

```bash

npm install @sentry/nextjs

```

 

### Step 5: Configure Sentry

 

The wizard creates these files. If you installed manually, create them:

 

#### `sentry.client.config.ts` (Client-side errors)

 

```typescript

import * as Sentry from "@sentry/nextjs";

 

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

 

  // Adjust this value in production, or use tracesSampler for greater control

  tracesSampleRate: 1.0,

 

  // Setting this option to true will print useful information to the console while you're setting up Sentry.

  debug: false,

 

  replaysOnErrorSampleRate: 1.0,

 

  // This sets the sample rate to be 10%. You may want this to be 100% while

  // in development and sample at a lower rate in production

  replaysSessionSampleRate: 0.1,

 

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:

  integrations: [

    Sentry.replayIntegration({

      // Additional SDK configuration goes in here, for example:

      maskAllText: true,

      blockAllMedia: true,

    }),

  ],

});

```

 

#### `sentry.server.config.ts` (Server-side errors)

 

```typescript

import * as Sentry from "@sentry/nextjs";

 

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

 

  // Adjust this value in production

  tracesSampleRate: 1.0,

 

  // Setting this option to true will print useful information to the console while you're setting up Sentry.

  debug: false,

});

```

 

#### `sentry.edge.config.ts` (Edge runtime errors)

 

```typescript

import * as Sentry from "@sentry/nextjs";

 

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  debug: false,

});

```

 

#### `next.config.mjs` (Add Sentry webpack plugin)

 

```javascript

import { withSentryConfig } from "@sentry/nextjs";

 

/** @type {import('next').NextConfig} */

const nextConfig = {

  // Your existing Next.js config

};

 

export default withSentryConfig(

  nextConfig,

  {

    // Sentry configuration options

    silent: true, // Suppresses source map uploading logs during build

    org: "your-org-slug",

    project: "getonblockchain-production",

  },

  {

    // Upload source maps to Sentry

    widenClientFileUpload: true,

    transpileClientSDK: true,

    tunnelRoute: "/monitoring",

    hideSourceMaps: true,

    disableLogger: true,

  }

);

```

 

### Step 6: Set Environment Variables

 

Add to `.env.local` (development):

 

```bash

NEXT_PUBLIC_SENTRY_DSN="https://abc123def456@o123456.ingest.sentry.io/7891011"

```

 

Add to production environment (Vercel, Railway, etc.):

 

```bash

NEXT_PUBLIC_SENTRY_DSN="https://abc123def456@o123456.ingest.sentry.io/7891011"

SENTRY_AUTH_TOKEN="your-auth-token-here" # For uploading source maps

```

 

**To get auth token**:

1. Go to Sentry → Settings → Account → API → Auth Tokens

2. Create new token with `project:releases` and `org:read` scopes

 

### Step 7: Test Error Tracking

 

Create a test error page: `/src/app/sentry-test/page.tsx`

 

```typescript

'use client';

 

export default function SentryTestPage() {

  return (

    <div>

      <h1>Sentry Error Test</h1>

      <button

        onClick={() => {

          throw new Error('Test Sentry error from client!');

        }}

      >

        Trigger Client Error

      </button>

 

      <button

        onClick={async () => {

          const res = await fetch('/api/sentry-test-api');

          console.log(await res.json());

        }}

      >

        Trigger Server Error

      </button>

    </div>

  );

}

```

 

Create API route: `/src/app/api/sentry-test-api/route.ts`

 

```typescript

import { NextResponse } from 'next/server';

 

export async function GET() {

  throw new Error('Test Sentry error from API!');

  return NextResponse.json({ message: 'This will never be reached' });

}

```

 

Visit `/sentry-test` and click both buttons. Check Sentry dashboard for errors.

 

### Step 8: Add Error Boundaries

 

Create `/src/app/error.tsx` for handling React errors:

 

```typescript

'use client';

 

import * as Sentry from '@sentry/nextjs';

import { useEffect } from 'react';

 

export default function ErrorPage({

  error,

  reset,

}: {

  error: Error & { digest?: string };

  reset: () => void;

}) {

  useEffect(() => {

    // Log error to Sentry

    Sentry.captureException(error);

  }, [error]);

 

  return (

    <div className="error-page">

      <h1>Something went wrong!</h1>

      <p>We've been notified and are working on a fix.</p>

      <button onClick={() => reset()}>Try again</button>

    </div>

  );

}

```

 

### Step 9: Add User Context to Errors

 

In your authentication flow, add user context:

 

Edit `/src/app/api/member/auth/verify/route.ts`:

 

```typescript

import * as Sentry from '@sentry/nextjs';

 

export async function GET(req: NextRequest) {

  try {

    const token = searchParams.get('token');

 

    // Validate token...

    const member = loginToken.member;

 

    // Set user context for Sentry

    Sentry.setUser({

      id: member.id,

      email: member.email,

      username: `${member.firstName} ${member.lastName}`,

    });

 

    // Continue...

  } catch (error) {

    Sentry.captureException(error);

    // Handle error...

  }

}

```

 

### Step 10: Add Performance Monitoring

 

Track slow API endpoints:

 

```typescript

import * as Sentry from '@sentry/nextjs';

 

export async function POST(req: NextRequest) {

  const transaction = Sentry.startTransaction({

    name: 'POST /api/rewards/payout',

    op: 'http.server',

  });

 

  try {

    // Database query span

    const dbSpan = transaction.startChild({

      op: 'db.query',

      description: 'Fetch business member',

    });

    const businessMember = await prisma.businessMember.findUnique({...});

    dbSpan.finish();

 

    // Blockchain transaction span

    const blockchainSpan = transaction.startChild({

      op: 'blockchain.transaction',

      description: 'Send USDC',

    });

    const result = await sendUSDC(...);

    blockchainSpan.finish();

 

    transaction.setStatus('ok');

    return NextResponse.json({ success: true });

  } catch (error) {

    transaction.setStatus('internal_error');

    Sentry.captureException(error);

    throw error;

  } finally {

    transaction.finish();

  }

}

```

 

## Sentry Features to Use

 

### 1. Release Tracking

 

Track which version caused errors:

 

```bash

# In your CI/CD pipeline

export SENTRY_RELEASE=$(git rev-parse HEAD)

 

# Sentry will automatically track this in next.config.mjs

```

 

### 2. Custom Tags

 

Add tags to categorize errors:

 

```typescript

Sentry.setTag('payment_method', 'usdc');

Sentry.setTag('network', 'polygon');

Sentry.captureException(error);

```

 

### 3. Breadcrumbs

 

Add context about user actions:

 

```typescript

Sentry.addBreadcrumb({

  category: 'payout',

  message: 'User clicked claim payout button',

  level: 'info',

  data: {

    businessId: 'xyz',

    points: 100,

  },

});

```

 

### 4. Custom Events

 

Track non-error events:

 

```typescript

Sentry.captureMessage('Low wallet balance detected', {

  level: 'warning',

  tags: {

    merchant_id: merchant.id,

    balance: merchant.usdcBalance,

  },

});

```

 

### 5. Performance Monitoring

 

```typescript

// Measure database query performance

const span = Sentry.startSpan({ name: 'expensive_query' }, async () => {

  return await prisma.member.findMany({

    // Complex query...

  });

});

```

 

## Alert Configuration

 

### Set up Alerts in Sentry

 

1. Go to **Alerts** → **Create Alert**

2. Choose trigger conditions:

   - **New issue**: Alert on first occurrence

   - **Issue frequency**: Alert if error occurs X times in Y minutes

   - **Issue regression**: Alert if resolved issue reoccurs

 

3. Set up notification channels:

   - **Email**: Team email addresses

   - **Slack**: Connect Slack workspace

   - **PagerDuty**: For critical production errors

   - **Discord**: For team notifications

 

4. Example alert rules:

   - **Critical**: Payment errors → PagerDuty + Slack

   - **High**: Database errors → Slack

   - **Medium**: Rate limit hits → Email daily digest

 

## Ignoring Errors

 

### Ignore Known Third-Party Errors

 

Edit `sentry.client.config.ts`:

 

```typescript

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

 

  beforeSend(event, hint) {

    // Ignore browser extension errors

    if (event.exception?.values?.[0]?.value?.includes('chrome-extension://')) {

      return null;

    }

 

    // Ignore specific error messages

    if (event.message?.includes('ResizeObserver loop')) {

      return null;

    }

 

    return event;

  },

 

  ignoreErrors: [

    // Common browser errors to ignore

    'Non-Error exception captured',

    'Non-Error promise rejection captured',

    /^Loading chunk [\d]+ failed/,

  ],

});

```

 

## Production Best Practices

 

### Sample Rates

 

Adjust in production to reduce costs:

 

```typescript

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

 

  // Send 10% of transactions for performance monitoring

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

 

  // Replay 1% of sessions, 100% of error sessions

  replaysSessionSampleRate: 0.01,

  replaysOnErrorSampleRate: 1.0,

});

```

 

### Environment Tagging

 

```typescript

Sentry.init({

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV || 'development',

  release: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',

});

```

 

### Source Maps

 

Ensure source maps are uploaded:

 

```bash

# Automatically handled by @sentry/nextjs during build

npm run build

 

# Check Sentry dashboard → Releases to verify source maps

```

 

## Monitoring Dashboard

 

Key metrics to watch:

- **Error rate**: Errors per minute

- **User impact**: % of users affected

- **Response time**: P50, P95, P99 latencies

- **Apdex score**: Application performance index

 

## Pricing

 

Sentry pricing tiers:

- **Developer**: Free (5K errors/month, 10K transactions/month)

- **Team**: $26/month (50K errors/month, 100K transactions/month)

- **Business**: $80/month (100K errors/month, 500K transactions/month)

 

**Pro tip**: Start with free tier, upgrade as you scale.

 

## Troubleshooting

 

### Source maps not working

 

1. Verify `SENTRY_AUTH_TOKEN` is set in environment

2. Check build logs for source map upload errors

3. Ensure `hideSourceMaps: true` in `next.config.mjs`

 

### Too many errors

 

1. Add `ignoreErrors` array to filter noise

2. Adjust `beforeSend` to filter known issues

3. Lower `tracesSampleRate` to reduce quota usage

 

### Missing errors

 

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly

2. Check browser console for Sentry initialization errors

3. Test with `/sentry-test` page

 

## Environment Variables Summary

 

Add to `.env.local` and production:

 

```bash

# Sentry error monitoring

NEXT_PUBLIC_SENTRY_DSN="https://abc@o123.ingest.sentry.io/456"

SENTRY_AUTH_TOKEN="your-auth-token" # Only needed for builds with source maps

SENTRY_ORG="your-org-slug"

SENTRY_PROJECT="getonblockchain-production"

```

 

## Next Steps

 

After Sentry setup:

1. ✅ Create test errors to verify integration

2. ✅ Set up alert rules for critical errors

3. ✅ Configure Slack/email notifications

4. ✅ Create wallet balance monitoring job (see `BALANCE_MONITORING.md`)

 

## Resources

 

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

 

---

 

Need help? Check Sentry docs or open an issue on GitHub.

 