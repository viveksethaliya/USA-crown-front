"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/app/(main)/products/products.module.css';

interface Product {
  id: number;
  slug: string;     // required for all public navigation
  name: string;
  image?: string | null;
  image_alt_text?: string | null;
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
  const [selectedMetal, setSelectedMetal] = useState<string | null>(product.swatchAttributes?.[0]?.value || null);

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

  const productHref = `/products/${encodeURIComponent(product.slug)}`;

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrap}>
        {product.sale_price && isSaleActive(product.sale_price, product.date_sale_starts, product.date_sale_ends) && (
          <div className={styles.saleBadge}>
            SALE
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/web-phts/a-17.jpg'}
          alt={product.image_alt_text || product.name}
          className={styles.productImage}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.productInfo}>
        <Link href={productHref} className={styles.productNameLink}>
          <h3 className={styles.productName}>{product.name}</h3>
        </Link>
        <div className={styles.priceSlot}>
          {isAuthenticated && userPermission !== 'view_only' ? (
            product.priceRange ? (
              <span className={styles.priceValue}>{product.priceRange}</span>
            ) : product.regular_price !== undefined && product.regular_price !== null ? (
              <span className={styles.priceValue}>
                ${Number(product.sale_price && isSaleActive(product.sale_price, product.date_sale_starts, product.date_sale_ends) ? product.sale_price : product.regular_price).toFixed(2)}
              </span>
            ) : null
          ) : (
            <span className={styles.loginForPricing}>Login for pricing</span>
          )}
        </div>
        <div className={styles.swatchSlot}>
          {product.swatchAttributes && product.swatchAttributes.length > 0 && (
            <>
              {product.swatchAttributes.slice(0, 4).map(swatch => {
                const isSelected = selectedMetal === swatch.value;
                const hasColorOrImage = !!(swatch.color_hex || swatch.image_url);
                const dynamicStyle = swatch.image_url
                  ? { backgroundImage: `url(${swatch.image_url})` }
                  : swatch.color_hex
                    ? { backgroundColor: swatch.color_hex }
                    : {};

                return (
                  <Link
                    key={swatch.value}
                    href={`${productHref}?metal=${encodeURIComponent(swatch.value)}`}
                    onClick={() => setSelectedMetal(swatch.value)}
                    className={`${styles.metalDot} ${isSelected ? styles.metalDotSelected : ''} ${!hasColorOrImage ? styles.metalDotText : ''}`}
                    style={dynamicStyle}
                    title={swatch.value}
                    aria-label={swatch.value}
                  >
                    {!hasColorOrImage ? swatch.value : ''}
                  </Link>
                );
              })}
              {product.swatchAttributes.length > 4 && (
                <span className={styles.overflowIndicator}>+{product.swatchAttributes.length - 4}</span>
              )}
            </>
          )}
        </div>
        <div className={styles.sizeSlot}>
          {product.sizeRanges && product.sizeRanges.map((sz, i) => {
            const shortName = sz.name.toLowerCase().includes('length') ? 'Len:' : 'Sz:';
            return (
              <React.Fragment key={i}>
                <span>{shortName}</span> <span className={styles.sizeValue}>{sz.range}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
