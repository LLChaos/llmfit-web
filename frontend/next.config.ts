import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security headers applied to every route ──────────────────────
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
      ],
    },
    // ── Static assets: cache aggressively (fingerprinted by Next.js) ─
    {
      source: "/_next/static/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    // ── Public files (favicon, robots.txt, sitemap, etc.) ─
    {
      source: "/(favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemap-.*\\.xml)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=3600, must-revalidate",
        },
      ],
    },
  ],

  // Domain canonicalization (www → bare) is handled at Vercel level:
  // Project Settings → Domains → add www.llmsfit.com → redirect to llmsfit.com
};

export default nextConfig;
