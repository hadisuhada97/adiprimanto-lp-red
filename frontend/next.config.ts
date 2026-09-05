import type { NextConfig } from "next";

// Derive the CMS media host from the public API base URL so images served by
// Laravel Storage (/api/storage/...) are allowed by next/image.
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const apiHost = apiBase ? new URL(apiBase).hostname : undefined;
const apiOrigin = apiBase ? new URL(apiBase).origin : "";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js ships inline bootstrap scripts and styles.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://images.unsplash.com ${apiOrigin}`.trim(),
  `connect-src 'self' https://cloudflareinsights.com ${apiOrigin}`.trim(),
].join("; ");

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      ...(apiHost
        ? [
            {
              protocol: 'https' as const,
              hostname: apiHost,
              pathname: '/api/storage/**',
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
