import { apiUrl } from '@/lib/cart';

export async function generateRobotsText(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is missing in environment");
  }

  // Locked block (always emitted exactly as is)
  const lockedBlock = `User-Agent: *
Allow: /
Disallow: /crown-admin/
Disallow: /api/
Disallow: /auth/`;

  const sitemapBlock = `Sitemap: ${baseUrl}/sitemap.xml`;

  let blockFaceted = true;
  let blockAi = false;
  let customBlock = '';

  try {
    const res = await fetch(apiUrl('/api/store/settings'), { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      blockFaceted = data.robots_block_faceted !== false; // Default true if missing
      blockAi = data.robots_block_ai === true;
      customBlock = data.robots_custom_block || '';
    } else {
      console.warn(`[ROBOTS_FETCH_FAILED] Non-200 response (${res.status}). Using defaults.`);
    }
  } catch (err: any) {
    console.error(`[ROBOTS_FETCH_FAILED] Network or parsing error: ${err.message}. Using defaults.`);
  }

  let text = lockedBlock + '\n';

  if (blockFaceted) {
    text += `Disallow: /*?*attr_*
Disallow: /*?*sort=*
Disallow: /*?*search=*
Disallow: /*?*category=*
`;
  }

  if (blockAi) {
    text += `
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: meta-externalagent
Disallow: /
`;
  }

  if (customBlock && customBlock.trim().length > 0) {
    text += '\n' + customBlock.trim() + '\n';
  }

  text += '\n' + sitemapBlock + '\n';

  return text;
}
