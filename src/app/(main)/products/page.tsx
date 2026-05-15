'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './products.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  image: string | null;
  metalTypes: string[];
}

interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  children: { id: number; name: string; slug: string }[];
}

const METAL_COLOR_MAP: Record<string, string> = {
  '10W': '#c0c0c0',
  '14P': '#e5c3c6',
  '14TT': '#d4af37',
  '14W': '#e8e8e8',
  '14Y': '#d4af37',
  '18W': '#c9c9c9',
  '18Y': '#cfb53b',
  'BRAS': '#b5a642',
  'PLT': '#e5e4e2',
  'SS': '#aaa9ad',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [allMetalTypes, setAllMetalTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMetals, setSelectedMetals] = useState<string[]>([]);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (p: number, search: string, sort: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '24',
        sort
      });
      if (search) params.set('search', search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?${params}`);
      const data = await res.json();

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);

      // Extract all unique metal types from products for the filter sidebar
      const metals = new Set<string>();
      (data.products || []).forEach((p: Product) => {
        (p.metalTypes || []).forEach(m => metals.add(m));
      });
      setAllMetalTypes(prev => {
        const combined = new Set([...prev, ...metals]);
        return Array.from(combined).sort();
      });
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, searchQuery, sortBy);
  }, [page, sortBy, fetchProducts]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      fetchProducts(1, val, sortBy);
    }, 400);
    setSearchTimeout(timeout);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleMetal = (metal: string) => {
    setSelectedMetals(prev =>
      prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedMetals([]);
    setSearchQuery('');
    setPage(1);
    fetchProducts(1, '', sortBy);
  };

  // Client-side filter for metals (since API returns the full page, we filter locally for metal)
  const filteredProducts = products.filter(p => {
    const matchesMetal = selectedMetals.length === 0 || (p.metalTypes || []).some(m => selectedMetals.includes(m));
    return matchesMetal;
  });

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* Mobile filter toggle */}
        <button className={styles.mobileFilterBtn} onClick={() => setMobileSidebar(!mobileSidebar)}>
          ☰ Filters
        </button>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileSidebar ? styles.sidebarOpen : ''}`}>
          <button className={styles.mobileClose} onClick={() => setMobileSidebar(false)}>✕ Close</button>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search Product..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {/* Categories — from API */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.filterList}>
              {categories.map(cat => (
                <div key={cat.id} className={styles.categoryItem}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                      className={styles.checkInput}
                    />
                    {cat.name}
                  </label>
                  {selectedCategories.includes(cat.name) && cat.children.length > 0 && (
                    <div className={styles.subcategories}>
                      {cat.children.map(sub => (
                        <label key={sub.id} className={styles.checkLabel}>
                          <input type="checkbox" className={styles.checkInput} />
                          {sub.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metal Type — from product data */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Metal Type</h3>
            <div className={styles.filterList}>
              {allMetalTypes.map(metal => (
                <label key={metal} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={selectedMetals.includes(metal)}
                    onChange={() => toggleMetal(metal)}
                    className={styles.checkInput}
                  />
                  {metal}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <button onClick={resetFilters} className={styles.resetBtn}>Reset Filters</button>
            <span className={styles.resultCount}>
              Showing {filteredProducts.length} of {total.toLocaleString()} results
            </span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="newest">Sort by Newest</option>
            </select>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading products...
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map(product => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImageWrap}>
                    <img
                      src={product.image || '/web-phts/a-17.jpg'}
                      alt={product.name}
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.metalRow}>
                      <span className={styles.metalLabel}>Metal Type:</span>
                      <div className={styles.metalDots}>
                        {(product.metalTypes || []).map(m => (
                          <span
                            key={m}
                            className={styles.metalDot}
                            style={{ backgroundColor: METAL_COLOR_MAP[m] || '#ccc' }}
                            title={m}
                          ></span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link href={`/products/${product.id}`} className={styles.viewBtn}>
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '0.5rem',
              padding: '2rem 0', flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '0.5rem 1rem', border: '1px solid #d0d5dd',
                  background: page <= 1 ? '#f4f6f8' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                ← Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#666', fontSize: '0.9rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '0.5rem 1rem', border: '1px solid #d0d5dd',
                  background: page >= totalPages ? '#f4f6f8' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
