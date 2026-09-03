import { MetadataRoute } from 'next';
import { apiUrl } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://usa-crown-front.vercel.app';
  
  const entries: MetadataRoute.Sitemap = [];

  // 1. Homepage
  entries.push({
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. Static Pages (Shop, Blog)
  entries.push({
    url: `${baseUrl}/products`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });

  const res = await fetch(apiUrl('/api/store/catalog/sitemap'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sitemap data');
  const { products, collections, brands, pages, categories } = await res.json();

  // 3. Products
  if (products) {
    products.forEach((product: any) => {
      if (product.slug) {
        entries.push({
          url: `${baseUrl}/products/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    });
  }

  // 4. Collections (Brands)
  if (brands) {
    brands.forEach((brand: any) => {
      if (brand.slug) {
        entries.push({
          url: `${baseUrl}/collections/${brand.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    });
  }

  // 5. Pages & Blog Posts
  if (pages) {
    pages.forEach((page: any) => {
      if (page.slug && page.slug !== 'home') {
        const prefix = page.page_type === 'blog' ? '/blog/' : '/';
        entries.push({
          url: `${baseUrl}${prefix}${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: page.page_type === 'blog' ? 0.6 : 0.5,
        });
      }
    });
  }

  // 6. Categories
  if (categories) {
    categories.forEach((cat: any) => {
      if (cat.slug) {
        entries.push({
          url: `${baseUrl}/categories/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    });
  }

  return entries;
}
