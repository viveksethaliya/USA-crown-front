export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is missing in environment");
  }

  const text = `User-Agent: *
Allow: /
Disallow: /crown-admin/
Disallow: /api/
Disallow: /auth/
Disallow: /*?*attr_*
Disallow: /*?*sort=*
Disallow: /*?*search=*
Disallow: /*?*category=*

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
