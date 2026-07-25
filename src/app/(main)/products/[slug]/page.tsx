import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { apiUrl } from '@/lib/api';

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  try {
    const res = await fetch(
      apiUrl(`/api/store/catalog/products/${encodeURIComponent(slug)}`),
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.seo_title || `${product.name} | Crown Findings`,
    description:
      product.seo_description ||
      product.short_description ||
      product.description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: product.seo_og_image
      ? { images: [product.seo_og_image] }
      : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description:
          product.seo_description ||
          product.short_description ||
          product.description,
        sku: product.sku,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice:
            product.variations?.[0]?.sale_price ||
            product.variations?.[0]?.regular_price ||
            0,
          highPrice:
            product.variations?.[product.variations.length - 1]
              ?.regular_price || 0,
          availability: 'https://schema.org/InStock',
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
