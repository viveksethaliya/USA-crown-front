import React from 'react';
import Link from 'next/link';
import styles from '@/app/(main)/products/products.module.css';

interface Product {
  id: number;
  name: string;
  image?: string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  date_sale_starts?: string;
  date_sale_ends?: string;
  metalTypes?: string[];
  priceRange?: string | null;
}

interface FilterTerm {
  name: string;
  color_hex?: string;
}

interface Filter {
  slug: string;
  terms: FilterTerm[];
}

interface ProductCardProps {
  product: Product;
  filters?: Filter[];
}

export default function ProductCard({ product, filters = [] }: ProductCardProps) {
  const isSaleActive = (salePrice?: number | string | null, start?: string, end?: string) => {
    if (salePrice === null || salePrice === undefined) return false;
    const now = new Date();
    if (start && new Date(start) > now) return false;
    if (end && new Date(end) < now) return false;
    return true;
  };
  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/web-phts/a-17.jpg'}
          alt={product.name}
          className={styles.productImage}
        />
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        
        {/* Price display if available */}
        {product.priceRange ? (
          <div style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1a1a2e' }}>
            <span>{product.priceRange}</span>
          </div>
        ) : product.regular_price !== undefined && product.regular_price !== null ? (
          <div style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1a1a2e' }}>
            {product.sale_price && isSaleActive(product.sale_price, product.date_sale_starts, product.date_sale_ends) ? (
              <>
                <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                  ${Number(product.regular_price).toFixed(2)}
                </span>
                <span style={{ color: '#dc2626' }}>${Number(product.sale_price).toFixed(2)}</span>
              </>
            ) : (
              <span>${Number(product.regular_price).toFixed(2)}</span>
            )}
          </div>
        ) : null}

        <div className={styles.metalRow}>
          <span className={styles.metalLabel}>Metal Type:</span>
          <div className={styles.metalDots}>
            {(product.metalTypes || []).map((m: string) => {
              const metalFilter = filters.find((f: Filter) => f.slug === 'metal');
              const termColor = metalFilter?.terms?.find((t: FilterTerm) => t.name === m)?.color_hex;
              return (
                <span
                  key={m}
                  className={styles.metalDot}
                  style={
                    termColor
                      ? { backgroundColor: termColor }
                      : { background: 'transparent', backgroundImage: 'linear-gradient(to bottom right, transparent 45%, #d0d5dd 45%, #d0d5dd 55%, transparent 55%)', border: '1px solid #d0d5dd' }
                  }
                  title={m}
                ></span>
              );
            })}
          </div>
        </div>
      </div>
      <Link href={`/products/${product.id}`} className={styles.viewBtn}>
        View Details
      </Link>
    </div>
  );
}
