import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Use site URL if configured, otherwise fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://usa-crown-front.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/crown-admin/',
        '/api/',
        '/auth/',
        '/*?*attr_*',
        '/*?*sort=*',
        '/*?*search=*',
        '/*?*category=*',
      ],
    },
    // sitemap: `${baseUrl}/sitemap.xml`,
  };
}
