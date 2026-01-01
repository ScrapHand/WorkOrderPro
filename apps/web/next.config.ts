import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to Backend to solve CORS and Cookie sharing
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://workorderpro-backend.onrender.com/api/v1/:path*", // Hardcoded (Phase 14 Fix)
      },
    ];
  },
  experimental: {
    // serverActions: true, // Default in 14+
  },
};

export default nextConfig;
