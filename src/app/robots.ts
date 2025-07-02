import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foldly.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // Don't index API routes
          '/dashboard/', // Private dashboard routes
          '/sign-in/', // Auth pages
          '/sign-up/', // Auth pages
          '/unauthorized', // Error pages
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
