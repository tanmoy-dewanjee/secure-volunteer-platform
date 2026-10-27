export const NO_STORE = "no-store, no-cache, must-revalidate, private";

export function appSecurityHeaders(): { key: string; value: string }[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "upgrade-insecure-requests",
        "img-src 'self' https://images.unsplash.com https://api.qrserver.com https://*.tile.openstreetmap.org data: blob:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "connect-src 'self' https://nominatim.openstreetmap.org https://*.supabase.co wss://*.supabase.co",
        "frame-src https://www.openstreetmap.org",
      ].join("; "),
    },
  ];
}

export function apiCacheHeaders(): { key: string; value: string }[] {
  return [
    { key: "Cache-Control", value: NO_STORE },
    { key: "Pragma", value: "no-cache" },
  ];
}
