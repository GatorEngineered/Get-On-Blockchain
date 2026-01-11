// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://getonblockchain.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Authentication pages
          '/login',
          '/signup/',
          '/business/register',

          // Protected dashboards
          '/admin/',
          '/dashboard/',
          '/member/dashboard',
          '/member/settings',
          '/member/login',
          '/member/register',
          '/member/forgot-password',
          '/member/reset-password',
          '/staff/',

          // Dynamic merchant pages (require authentication)
          '/m/',
          '/scan/',

          // API routes
          '/api/',

          // Demo claim page (internal use)
          '/demo/claim',
        ],
      },
      {
        // Allow specific bots for AI answer engines (AEO)
        userAgent: ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Slurp', 'facebookexternalhit', 'LinkedInBot'],
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/member/dashboard',
          '/member/settings',
          '/staff/',
          '/m/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
