import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to Backend to solve CORS and Cookie sharing
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/api/v1/:path*",
        destination: isDev
          ? "http://localhost:8080/api/v1/:path*" // Local Backend
          : "https://workorderpro-backend.onrender.com/api/v1/:path*", // Prod Backend
      },
    ];
  },
  experimental: {
    // serverActions: true, // Default in 14+
  },
};

export default nextConfig;
