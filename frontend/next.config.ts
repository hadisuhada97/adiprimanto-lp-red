import type { NextConfig } from "next";

// Derive the CMS media host from the public API base URL so images served by
// Laravel Storage (/api/storage/...) are allowed by next/image.
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const apiHost = apiBase ? new URL(apiBase).hostname : undefined;

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
};

export default nextConfig;
