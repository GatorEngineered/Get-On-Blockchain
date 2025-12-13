import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {}, // Explicitly enable Turbopack (Next.js 16 default)
};

export default nextConfig;
