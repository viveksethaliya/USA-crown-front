import { Metadata, ResolvingMetadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

type Props = {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/store/catalog/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || null;
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.meta_title || `${product.name} | Crown Findings`,
    description: product.meta_description || product.short_description || product.description,
    alternates: {
      canonical: `/products/${id}`,
    }
  }
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.meta_description || product.short_description || product.description,
    sku: product.sku,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: product.variations?.[0]?.sale_price || product.variations?.[0]?.regular_price || 0,
      highPrice: product.variations?.[product.variations.length - 1]?.regular_price || 0,
      availability: 'https://schema.org/InStock',
    }
  } : null;

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
