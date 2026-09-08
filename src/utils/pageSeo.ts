import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://usa-crown-front.vercel.app';

export async function generateStaticPageMetadata(
  routePath: string,
  defaultTitle?: string,
  defaultDesc?: string
): Promise<Metadata> {
  let seoData = { seo_title: null, seo_description: null, seo_og_image: null, is_noindex: false };
  let storeName = 'Crown Findings';

  // 1. Fetch Store Settings for interpolation (if defaults contain {storeName})
  try {
    const settingsRes = await fetch(`${API_URL}/api/store/settings`, { next: { revalidate: 60 } });
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings.store_name) storeName = settings.store_name;
    }
  } catch(e) {}

  // 2. Fetch Page SEO overrides
  try {
    const seoRes = await fetch(`${API_URL}/api/store/page-seo?path=${encodeURIComponent(routePath)}`, { next: { revalidate: 60 } });
    if (seoRes.ok) {
      seoData = await seoRes.json();
    }
  } catch(e) {}

  // 3. Resolve Fallbacks
  // Interpolate {storeName} into hardcoded literal if present
  const resolvedDefaultTitle = defaultTitle ? defaultTitle.replace('{storeName}', storeName) : undefined;
  const resolvedDefaultDesc = defaultDesc ? defaultDesc.replace('{storeName}', storeName) : undefined;

  const title = seoData.seo_title || resolvedDefaultTitle;
  const description = seoData.seo_description || resolvedDefaultDesc;
  const ogImage = seoData.seo_og_image || undefined;

  const metadata: Metadata = {};
  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (ogImage) {
    metadata.openGraph = { images: [{ url: ogImage }] };
  }
  
  if (seoData.is_noindex) {
    metadata.robots = { index: false, follow: false };
  }

  // Self-referencing canonical
  const pathPart = routePath === '/' ? '' : routePath;
  metadata.alternates = { canonical: `${SITE_URL}${pathPart}` };

  return metadata;
}
