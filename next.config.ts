import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  }
};

export default nextConfig;
