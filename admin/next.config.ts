import path from "path";
import type { NextConfig } from "next";

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
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' https://images.unsplash.com https://api.qrserver.com data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "connect-src 'self' https://nominatim.openstreetmap.org https://*.supabase.co wss://*.supabase.co",
              "frame-src https://www.openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
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
