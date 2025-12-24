// sentry.edge.config.ts

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console
  debug: false,

  // Add release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SENTRY_RELEASE,
});
