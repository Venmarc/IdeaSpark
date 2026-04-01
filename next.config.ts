import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack locally if it's panicking
  },
};

export default nextConfig;
