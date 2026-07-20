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
  swatchAttributes?: { type: string; value: string; color_hex: string | null; image_url: string | null }[];
  sizeRanges?: { name: string; range: string }[];
  priceRange?: string | null;
}

interface ProductCardProps {
  product: Product;
  isAuthenticated?: boolean;
  userPermission?: string | null;
}

export default function ProductCard({ product, isAuthenticated = true, userPermission = 'can_place_orders' }: ProductCardProps) {
  const isSaleActive = (salePrice?: number | string | null, start?: string, end?: string) => {
    if (salePrice === null || salePrice === undefined) return false;
    const now = new Date();
    if (start && new Date(start) > now) return false;
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      if (endDate < now) return false;
    }
    return true;
  };
  return (
    <div className={styles.productCard} style={{ display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
      <Link href={`/products/${product.id}`} className={styles.productImageWrap} style={{ textDecoration: 'none' }}>
        {product.sale_price && isSaleActive(product.sale_price, product.date_sale_starts, product.date_sale_ends) && (
          <div className={styles.saleBadge}>
            SALE
          </div>
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || '/web-phts/a-17.jpg'}
            alt={product.name}
            className={styles.productImage}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      </Link>
      <div className={styles.productInfo} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className={styles.productName} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>{product.name.toLowerCase()}</h3>
        </Link>
        {product.swatchAttributes && product.swatchAttributes.length > 0 && (
          <div className={styles.metalRow}>
            <span className={styles.metalLabel}>Options:</span>
            <div className={styles.metalDots}>
              {product.swatchAttributes.map(swatch => (
                <span
                  key={swatch.value}
                  className={styles.metalDot}
                  style={
                    swatch.type === 'color' && swatch.color_hex
                      ? { backgroundColor: swatch.color_hex, border: '1px solid rgba(0,0,0,0.1)' }
                      : swatch.type === 'image' && swatch.image_url
                        ? { backgroundImage: `url(${swatch.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(0,0,0,0.1)' }
                        : { background: '#f4f6f8', border: '1px solid #d0d5dd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#555', fontWeight: 600, letterSpacing: '-0.5px' }
                  }
                  title={swatch.value}
                >
                  {(!swatch.color_hex && !swatch.image_url) ? swatch.value.substring(0, 3).toUpperCase() : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {product.sizeRanges && product.sizeRanges.map((sz, i) => (
          <div key={i} className={styles.metalRow}>
            <span className={styles.metalLabel}>{sz.name}:</span>
            <span className={styles.metalValue}>{sz.range}</span>
          </div>
        ))}
        {isAuthenticated && userPermission !== 'view_only' && (
          product.priceRange ? (
            <div className={styles.metalRow}>
              <span className={styles.metalLabel}>Price:</span>
              <span className={styles.priceValue}>{product.priceRange}</span>
            </div>
          ) : product.regular_price !== undefined && product.regular_price !== null ? (
            <div className={styles.metalRow}>
              <span className={styles.metalLabel}>Price:</span>
              <span className={styles.priceValue}>
                ${Number(product.sale_price && isSaleActive(product.sale_price, product.date_sale_starts, product.date_sale_ends) ? product.sale_price : product.regular_price).toFixed(2)}
              </span>
            </div>
          ) : null
        )}
        {(!isAuthenticated || userPermission === 'view_only') && (
          <div className={styles.metalRow}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Login for pricing</span>
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', position: 'relative', zIndex: 5 }}>
          <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <span className={styles.viewBtn}>
              View Details
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
