import { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
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

async function checkRedirect(slug: string) {
  try {
    const res = await fetch(
      apiUrl(`/api/store/catalog/redirects?path=/products/${encodeURIComponent(slug)}`),
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data;
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

  if (!product) {
    const redirectData = await checkRedirect(slug);
    if (redirectData && redirectData.new_path) {
      if (redirectData.status_code === 301) {
        permanentRedirect(redirectData.new_path);
      } else {
        redirect(redirectData.new_path);
      }
    }
    notFound();
  }

  const jsonLdDescription = product?.seo_description || product?.short_description || product?.description || undefined;
  const jsonLdSku = product?.sku || undefined;
  const jsonLdImage = product?.seo_og_image || (product?.images && product.images.length > 0 ? product.images[0].url : undefined);

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        ...(jsonLdDescription ? { description: jsonLdDescription } : {}),
        ...(jsonLdSku ? { sku: jsonLdSku } : {}),
        ...(jsonLdImage ? { image: jsonLdImage } : {}),
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
