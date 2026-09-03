import React from "react";
import ProductCard from "@/components/products/ProductCard";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "@/app/(main)/products/products.module.css";
import { apiUrl } from "@/lib/api";
import { generateSEOTitle } from "@/lib/generateProductMeta";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(apiUrl(`/api/store/catalog/collections/${slug}`), { next: { revalidate: 60 } });
  
  if (!res.ok) {
    return { title: 'Collection Not Found' };
  }

  const { collection } = await res.json();
  
  if (!collection) {
    return { title: 'Collection Not Found' };
  }

  const generatedTitle = generateSEOTitle(collection.name || '');
  const generatedDesc = `Browse the ${collection.name} wholesale jewelry collection at Crown Findings.`;

  return {
    title: generatedTitle,
    description: generatedDesc,
    alternates: {
      canonical: `/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  const [colRes, prodRes] = await Promise.all([
    fetch(apiUrl(`/api/store/catalog/collections/${slug}`), { next: { revalidate: 60 } }),
    fetch(apiUrl(`/api/store/catalog/collections/${slug}/products`), { next: { revalidate: 60 } }),
  ]);

  if (!colRes.ok) {
    notFound();
  }

  const colData = await colRes.json();
  const collection = colData.collection;

  if (!collection) {
    notFound();
  }

  const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
  const products = prodData.products || [];

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 4rem' }}>

        {/* Collection Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>

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
