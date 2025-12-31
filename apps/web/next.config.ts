import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to Backend to solve CORS and Cookie sharing
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:8000/api/v1"}/:path*`, // Proxy to Backend
      },
    ];
  },
  experimental: {
    // serverActions: true, // Default in 14+
  },
};

export default nextConfig;
