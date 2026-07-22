'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/app/(main)/page.module.css';

export default function MobileBestSellerScroll({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Repeat the array to create a long scrollable list.
  const repeatedProducts = Array(18).fill(products).flat();

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      // Start perfectly in the middle
      el.scrollLeft = el.scrollWidth / 2;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    
    // Infinite loop illusion
    if (el.scrollLeft < el.scrollWidth / 6) {
      el.scrollLeft += el.scrollWidth / 3;
    }
    else if (el.scrollLeft > (el.scrollWidth * 5) / 6) {
      el.scrollLeft -= el.scrollWidth / 3;
    }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="grid grid-flow-col auto-cols-[240px] overflow-x-auto pb-6 gap-4 sm:hidden [&::-webkit-scrollbar]:hidden" 
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {repeatedProducts.map((prod: any, i: number) => {
        return (
          <Link key={`${prod.id}-${i}`} href={`/products/${prod.slug || prod.id}`} className={styles.bestSellerItem}>
            <div className={styles.bestSellerImageWrapper}>
              <img 
                src={prod.image || '/web-phts/a-17.jpg'} 
                alt={prod.name} 
                className={styles.bestSellerImage} 
              />
            </div>
            <div className={styles.bestSellerInfo}>
              <h3 className={styles.bestSellerName}>{prod.name.toLowerCase()}</h3>
              <p className={styles.bestSellerPrice}>{prod.base_price?.toFixed(2)}</p>
              <span className={styles.bestSellerAction}>View Details</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
