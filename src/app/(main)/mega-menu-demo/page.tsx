"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './mega-menu-demo.module.css';

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  children?: SubCategory[];
}

interface Product {
  id: number;
  name: string;
  price?: number;
  regular_price?: number;
  image: string | null;
  slug: string;
}

export default function MegaMenuDemo() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // Cache for recommended products: { categoryId: Product[] }
  const [recommendedCache, setRecommendedCache] = useState<Record<number, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const topLevelCats = data.categories || [];
          setCategories(topLevelCats);
          if (topLevelCats.length > 0) {
            setActiveCategory(topLevelCats[0].id); // default active
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    fetchCats();
  }, []);

  // Fetch recommended products when a category is hovered
  useEffect(() => {
    if (activeCategory === null) return;
    if (recommendedCache[activeCategory]) return; // already fetched

    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return;

    async function fetchProducts() {
      setLoadingProducts(true);
      try {
        // Fetch up to 4 items for the category
        const res = await fetch(`/api/products?category=${cat?.slug}&limit=4`);
        if (res.ok) {
          const data = await res.json();
          setRecommendedCache(prev => ({
            ...prev,
            [cat!.id]: data.products || []
          }));
        }
      } catch (err) {
        console.error("Failed to fetch recommended products", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [activeCategory, categories, recommendedCache]);

  const activeCatData = categories.find(c => c.id === activeCategory);
  const activeRecommended = activeCategory ? (recommendedCache[activeCategory] || []) : [];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.mockHeader}>
        <div className={styles.logo}>Store</div>
        
        {/* Trigger Area */}
        <div 
          className={styles.navTrigger}
          onMouseEnter={() => setIsMenuOpen(true)}
        >
          <span>☰</span> All Products
        </div>
        
        <div className={styles.searchBar}>Search...</div>

        {/* Mega Menu Dropdown */}
        {isMenuOpen && (
          <div 
            className={styles.megaMenuDropdown}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <div className={styles.megaMenuInner}>
              
              {/* LEFT SIDE: Categories */}
              <div className={styles.categorySidebar}>
                {categories.length === 0 ? (
                  <div style={{ padding: '1.5rem', color: '#666', fontSize: '0.9rem' }}>Loading...</div>
                ) : (
                  <ul className={styles.categoryList}>
                    {categories.map((cat) => (
                      <Link 
                        href={`/category/${cat.slug}`}
                        key={cat.id} 
                        className={`${styles.categoryItem} ${activeCategory === cat.id ? styles.active : ''}`}
                        onMouseEnter={() => setActiveCategory(cat.id)}
                      >
                        <span className={styles.catName}>{cat.name}</span>
                        <span className={styles.chevron}>›</span>
                      </Link>
                    ))}
                  </ul>
                )}
              </div>

              {/* RIGHT SIDE: Products & Subcategories */}
              <div className={styles.megaPanel}>
                {activeCatData && (
                  <>
                    {/* Tier 1: Recommended Products */}
                    <div className={styles.recommendedSection}>
                      <h4 className={styles.sectionTitle}>
                        Recommended in {activeCatData.name}
                      </h4>
                      
                      {loadingProducts && activeRecommended.length === 0 ? (
                        <div style={{ color: '#888' }}>Finding recommendations...</div>
                      ) : activeRecommended.length === 0 ? (
                        <div style={{ color: '#888' }}>No products found.</div>
                      ) : (
                        <div className={styles.recommendedGrid}>
                          {activeRecommended.map(prod => (
                            <Link href={`/products/${prod.id}`} key={prod.id} style={{ textDecoration: 'none' }}>
                              <div className={styles.recommendedCard}>
                                {prod.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={prod.image} alt={prod.name} className={styles.prodImage} />
                                ) : (
                                  <div className={styles.prodImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#aaa', textAlign: 'center' }}>No Img</div>
                                )}
                                <div className={styles.prodInfo}>
                                  <div className={styles.prodName} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.name}</div>
                                  {!!prod.regular_price && (
                                    <div className={styles.prodPrice}>
                                      ${prod.regular_price.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <hr className={styles.divider} />

                    {/* Tier 2: Sub Categories */}
                    <div className={styles.subCategorySection}>
                      <h4 className={styles.sectionTitle}>Sub-Categories</h4>
                      {(!activeCatData.children || activeCatData.children.length === 0) ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>No sub-categories available.</p>
                      ) : (
                        <div className={styles.subCategoryGrid}>
                          {activeCatData.children.map(sub => (
                            <Link href={`/category/${sub.slug}`} key={sub.id} className={styles.subCategoryLink}>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
            </div>
          </div>
        )}
      </header>

      <div className={styles.mainContent}>
        <h2>Hover over "All Products" to see the mega menu.</h2>
        <p>This area represents the rest of your website content.</p>
      </div>
    </div>
  );
}
