import React from "react";
import ProductCard from "@/components/products/ProductCard";
import { Metadata } from "next";
import styles from "@/app/(main)/products/products.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${BACKEND_URL}/api/store/catalog/collections/${slug}`, { next: { revalidate: 60 } });
  
  if (!res.ok) {
    return { title: 'Collection Not Found' };
  }

  const { collection } = await res.json();
  
  if (!collection) {
    return { title: 'Collection Not Found' };
  }

  return {
    title: collection.meta_title || `${collection.name} | Crown Findings`,
    description: collection.meta_description || collection.description || `Browse the ${collection.name} collection at Crown Findings.`,
    openGraph: {
      images: collection.hero_image ? [collection.hero_image] : [],
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  const [colRes, prodRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/store/catalog/collections/${slug}`, { next: { revalidate: 60 } }),
    fetch(`${BACKEND_URL}/api/store/catalog/collections/${slug}/products`, { next: { revalidate: 60 } }),
  ]);

  if (!colRes.ok) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Collection not found.</div>;
  }

  const colData = await colRes.json();
  const collection = colData.collection;

  if (!collection) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Collection not found.</div>;
  }

  const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
  const products = prodData.products || [];

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 4rem' }}>

        {/* Collection Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
          {collection.hero_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={collection.hero_image}
              alt={collection.name}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '2rem' }}
            />
          )}
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-inkblue)' }}>{collection.name}</h1>
          {collection.description && (
            <p style={{ color: '#475569', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
              {collection.description}
            </p>
          )}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '4rem 0' }}>No products available in this collection.</p>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product: Record<string, unknown>) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ProductCard key={product.id as number} product={product as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
