import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const appHost = appUrl.replace(/^https?:\/\//, "");

// Supabase project hostname extracted from env so CSP stays accurate in all environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl.replace(/^https?:\/\//, "");

// Content-Security-Policy
// NOTE: 'unsafe-inline' for script-src is required by Next.js 15 because it injects
// inline hydration scripts. Removing it will break the app. A nonce-based CSP
// (middleware-generated per-request nonce) is the proper long-term fix but is
// out of scope for this sprint.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co ${supabaseHost ? `https://${supabaseHost}` : ""}`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : ""}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", appHost],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
