import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Disable Turbopack for builds (use webpack) - Turbopack has issues with wagmi/RainbowKit
  // Remove this once Turbopack matures or wagmi fixes the dependency issues
  turbo: {
    rules: {
      '*.test.ts': {
        loaders: [],
        as: '*.js',
      },
    },
  },

  // Fix for wagmi/RainbowKit build issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Exclude test files from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Transpile packages that need it
  transpilePackages: ['@rainbow-me/rainbowkit', '@wagmi/connectors'],
};

export default nextConfig;
