import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Empty turbopack config to silence Next.js 16 warning
  // We're using webpack config below for RainbowKit compatibility
  turbopack: {},

  // Fix for wagmi/RainbowKit - these packages need node module polyfills
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

  // Transpile packages that need it
  transpilePackages: ['@rainbow-me/rainbowkit', '@wagmi/connectors'],
};

export default nextConfig;
