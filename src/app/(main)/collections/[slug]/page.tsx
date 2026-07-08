import React from "react";
import ProductCard from "@/components/products/ProductCard";
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/catalog/collections/${slug}`, { next: { revalidate: 60 } });
  
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

  const [colRes, prodRes, filtersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/catalog/collections/${slug}`, { next: { revalidate: 60 } }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/catalog/collections/${slug}/products`, { next: { revalidate: 60 } }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/catalog/filters`, { next: { revalidate: 3600 } })
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
  
  const filtersData = filtersRes.ok ? await filtersRes.json() : { filters: [] };
  const filters = filtersData.filters || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        {collection.hero_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={collection.hero_image} 
            alt={collection.name} 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '2rem' }} 
          />
        )}
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1a1a2e' }}>{collection.name}</h1>
        {collection.description && (
          <p style={{ color: '#475569', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            {collection.description}
          </p>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          Collection Products ({products.length})
        </h2>
        
        {products.length === 0 ? (
          <p style={{ color: '#64748b' }}>No products available in this collection.</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '2rem' 
          }}>
            {products.map((product: Record<string, unknown>) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ProductCard key={product.id as number} product={product as any} filters={filters} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
