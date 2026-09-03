import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is missing in environment");
  }

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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
