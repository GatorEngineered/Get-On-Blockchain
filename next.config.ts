import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // IMPORTANT: Don't enable turbopack config - it causes build failures with wagmi/RainbowKit
  // Turbopack tries to bundle test files from node_modules which breaks production builds
  // We use webpack with proper externals configuration instead

  // Image optimization for performance
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression for better performance
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Fix for wagmi/RainbowKit - these packages need node module polyfills
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize packages that cause issues in browser bundle
      config.externals.push("pino-pretty", "lokijs", "encoding");
    }

    // Disable node modules that aren't available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Transpile packages that need it
  transpilePackages: ["@rainbow-me/rainbowkit", "@wagmi/connectors"],
};

// Sentry configuration options (combined into single object for v8+)
const sentryBuildOptions = {
  // Organization and project from Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps to Sentry for better error tracking
  widenClientFileUpload: true,

  // Transpile SDK for compatibility
  transpileClientSDK: true,

  // Route for Sentry tunnel (bypasses ad blockers)
  tunnelRoute: "/monitoring",

  // Hide source maps from public
  hideSourceMaps: true,

  // Disable Sentry logger in production
  disableLogger: true,
};

// Only wrap with Sentry in production or if DSN is configured
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;

export default config;
