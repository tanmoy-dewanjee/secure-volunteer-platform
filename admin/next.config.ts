import path from "path";
import type { NextConfig } from "next";

import { apiCacheHeaders, appSecurityHeaders } from "../security/http-headers";

const studentOrigin = process.env.STUDENT_ORIGIN ?? "http://localhost:3000";

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
  async redirects() {
    return [
      {
        source: "/student/:path*",
        destination: studentOrigin,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
