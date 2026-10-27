import path from "path";
import type { NextConfig } from "next";

import { apiCacheHeaders, appSecurityHeaders } from "../security/http-headers";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: appSecurityHeaders(),
      },
      {
        source: "/api/:path*",
        headers: apiCacheHeaders(),
      },
    ];
  },
};

export default nextConfig;
