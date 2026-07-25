'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MobileCategoryScroll({ categories }: { categories: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Repeat the array to create a long scrollable list.
  // We use 18 copies so we can easily start in the middle and have plenty of room to scroll both ways.
  const repeatedCategories = Array(18).fill(categories).flat();

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
    
    // Infinite loop illusion: if we get too close to the left edge, jump forward.
    if (el.scrollLeft < el.scrollWidth / 6) {
      el.scrollLeft += el.scrollWidth / 3;
    }
    // If we get too close to the right edge, jump backward.
    else if (el.scrollLeft > (el.scrollWidth * 5) / 6) {
      el.scrollLeft -= el.scrollWidth / 3;
    }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="grid grid-rows-2 grid-flow-col auto-cols-[140px] overflow-x-auto pb-6 gap-4 sm:hidden [&::-webkit-scrollbar]:hidden" 
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {repeatedCategories.map((cat: any, i: number) => {
        let fallbackImg = '/web-phts/a-17.jpg';
        return (
          <div key={`${cat.id}-${i}`} className="flex flex-col items-center group">
            <Link href={`/products?category=${cat.slug}`} className="flex flex-col items-center text-center w-full decoration-transparent">
              <div className="w-full aspect-square rounded-2xl bg-[#fffbfb] border border-pink-50/50 shadow-sm flex items-center justify-center p-4 mb-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                <img 
                  src={cat.image_url || fallbackImg} 
                  alt={cat.name} 
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                  style={{ mixBlendMode: 'multiply' }} 
                />
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-[#182955] transition-colors duration-300 capitalize">
                {cat.name.toLowerCase()}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
