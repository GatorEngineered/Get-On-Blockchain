// sentry.client.config.ts

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  // Send 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay 1% of sessions, 100% of error sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,

  // Session Replay integration
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out known browser errors and third-party issues
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
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
    'ChunkLoadError',
    // Wallet connection errors (expected user behavior)
    'User rejected',
    'User denied',
  ],
});
