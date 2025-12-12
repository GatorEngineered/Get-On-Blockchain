import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
<<<<<<< Updated upstream

  // IMPORTANT: Don't enable turbopack config - it causes build failures with wagmi/RainbowKit
  // Turbopack tries to bundle test files from node_modules which breaks production builds
  // We use webpack with proper externals configuration instead

  // Fix for wagmi/RainbowKit - these packages need node module polyfills
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize packages that cause issues in browser bundle
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
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
  transpilePackages: ['@rainbow-me/rainbowkit', '@wagmi/connectors'],
=======
>>>>>>> Stashed changes
};

export default nextConfig;