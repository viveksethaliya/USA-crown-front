'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FiMenu, FiX, FiSearch } from 'react-icons/fi';
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
  children: CategoryTree[];
}



function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const metalParam = searchParams.get('metal');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [allMetalTypes, setAllMetalTypes] = useState<string[]>([]);
  const [metalColorMap, setMetalColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? categoryParam.split(',') : []
  );
  const [selectedMetals, setSelectedMetals] = useState<string[]>(
    metalParam ? metalParam.split(',') : []
  );
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  // Update selected categories and metals if the URL search params change 
  // (e.g. clicking a mega menu link while already on the products page)
  useEffect(() => {
    setSelectedCategories(categoryParam ? categoryParam.split(',') : []);
    setSelectedMetals(metalParam ? metalParam.split(',') : []);
    setPage(1);
  }, [categoryParam, metalParam]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/filters`);
        const data = await res.json();
        setAllMetalTypes(data.metalTypes || []);
        setMetalColorMap(data.metalColors || {});
      } catch (err) {
        console.error('Failed to fetch product filters', err);
      }
    };

    fetchFilters();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (
    p: number,
    search: string,
    sort: string,
    categorySlugs: string[],
    metalTypes: string[],
    signal?: AbortSignal
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '24',
        sort
      });
      if (search) params.set('search', search);
      if (categorySlugs.length > 0) params.set('category', categorySlugs.join(','));
      if (metalTypes.length > 0) params.set('metal', metalTypes.join(','));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?${params}`, { signal });
      const data = await res.json();

      if (signal?.aborted) return;

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to fetch products', err);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetchProducts(page, debouncedSearchQuery, sortBy, selectedCategories, selectedMetals, controller.signal);
    }, 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page, debouncedSearchQuery, sortBy, selectedCategories, selectedMetals, fetchProducts]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setLoading(true);
  };

  const updateUrlParams = (cats: string[], metals: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cats.length > 0) params.set('category', cats.join(','));
    else params.delete('category');
    
    if (metals.length > 0) params.set('metal', metals.join(','));
    else params.delete('metal');
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (slug: string, childSlugs: string[] = []) => {
    setLoading(true);
    let newCats: string[];
    if (selectedCategories.includes(slug)) {
      newCats = selectedCategories.filter(c => c !== slug && !childSlugs.includes(c));
    } else {
      newCats = [...selectedCategories, slug];
    }
    setSelectedCategories(newCats);
    updateUrlParams(newCats, selectedMetals);
    setPage(1);
  };

  const toggleSubcategory = (slug: string) => {
    setLoading(true);
    let newCats: string[];
    if (selectedCategories.includes(slug)) {
      newCats = selectedCategories.filter(c => c !== slug);
    } else {
      newCats = [...selectedCategories, slug];
    }
    setSelectedCategories(newCats);
    updateUrlParams(newCats, selectedMetals);
    setPage(1);
  };

  const getCategoryDescendantSlugs = (category: CategoryTree): string[] =>
    category.children.flatMap(child => [child.slug, ...getCategoryDescendantSlugs(child)]);

  const renderCategoryFilter = (category: CategoryTree) => {
    const childSlugs = getCategoryDescendantSlugs(category);
    const isParentSelected = selectedCategories.includes(category.slug);

    return (
      <div key={category.id} className={styles.categoryItem}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={isParentSelected}
            onChange={() => (
              childSlugs.length > 0
                ? toggleCategory(category.slug, childSlugs)
                : toggleSubcategory(category.slug)
            )}
            className={styles.checkInput}
          />
          {category.name}
        </label>
        {category.children.length > 0 && (
          <div className={styles.subcategories}>
            {category.children.map(renderCategoryFilter)}
          </div>
        )}
      </div>
    );
  };

  const toggleMetal = (metal: string) => {
    setLoading(true);
    let newMetals: string[];
    if (selectedMetals.includes(metal)) {
      newMetals = selectedMetals.filter(m => m !== metal);
    } else {
      newMetals = [...selectedMetals, metal];
    }
    setSelectedMetals(newMetals);
    updateUrlParams(selectedCategories, newMetals);
    setPage(1);
  };

  const resetFilters = () => {
    setLoading(true);
    setSelectedCategories([]);
    setSelectedMetals([]);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setPage(1);
    updateUrlParams([], []);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* Mobile filter toggle */}
        <button className={styles.mobileFilterBtn} onClick={() => setMobileSidebar(!mobileSidebar)}>
          <FiMenu style={{ marginRight: '8px' }} /> Filters
        </button>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileSidebar ? styles.sidebarOpen : ''}`}>
          <button className={styles.mobileClose} onClick={() => setMobileSidebar(false)}>
            <FiX style={{ marginRight: '8px' }} /> Close
          </button>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search Product..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>
              <FiSearch />
            </span>
          </div>

          {/* Categories — from API */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.filterList}>
              {categories.map(renderCategoryFilter)}
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
              Showing {products.length} of {total.toLocaleString()} results
            </span>
            <select
              value={sortBy}
              onChange={(e) => { setLoading(true); setSortBy(e.target.value); setPage(1); }}
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
              {products.map(product => (
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
                            style={
                              metalColorMap[m]
                                ? { backgroundColor: metalColorMap[m] }
                                : { background: 'transparent', backgroundImage: 'linear-gradient(to bottom right, transparent 45%, #d0d5dd 45%, #d0d5dd 55%, transparent 55%)', border: '1px solid #d0d5dd' }
                            }
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
                onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)); }}
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
                onClick={() => { setLoading(true); setPage(p => Math.min(totalPages, p + 1)); }}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
