'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { API_URL } from '@/lib/config';
import styles from './products.module.css';
import ProductCard from '@/components/products/ProductCard';
import { useSessionStatus } from '@/lib/auth';
import ScrollReveal from '@/components/animations/ScrollReveal';

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  image: string | null;
  swatchAttributes: { type: string; value: string; color_hex: string | null; image_url: string | null }[];
  tags?: { id: number; name: string }[];
  sizeRanges?: { name: string; range: string }[];
  priceRange?: string | null;
}

interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
  color_hex?: string;
  image_url?: string;
}

interface DynamicFilter {
  id: number;
  name: string;
  slug: string;
  type: string;
  terms: AttributeTerm[];
}

interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  children: CategoryTree[];
}

const CATEGORY_ORDER = [
  "DISC",
  "SETTINGS",
  "EARRINGS",
  "PENDANTS",
  "CLASPS",
  "CHAINS",
  "BEADS",
  "PINS",
  "SOLDER",
  "RELIGIOUS ITEMS",
  "RINGS",
  "LETTERS",
  "NUMBERS",
  "MENS",
  "COIN FRAMES",
  "WATCH BEZELS FOR DIAMONDS",
  "MILL PRODUCTS"
];

function sortCategories(aTitle: string, bTitle: string) {
  const aIdx = CATEGORY_ORDER.indexOf(aTitle.toUpperCase());
  const bIdx = CATEGORY_ORDER.indexOf(bTitle.toUpperCase());

  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  return aTitle.localeCompare(bTitle);
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { isAuthenticated, userPermission } = useSessionStatus();

  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<DynamicFilter[]>([]);

  // Parse initial selected attributes from URL
  const initialSelectedAttrs: Record<string, string[]> = {};
  for (const [key, val] of searchParams.entries()) {
    if (key.startsWith('attr_') && val) {
      initialSelectedAttrs[key.replace('attr_', '')] = val.split(',');
    }
  }

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>(initialSelectedAttrs);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('name');
  const searchParamVal = searchParams.get('search') || '';

  const [expandedFilters, setExpandedFilters] = useState<string[]>(['categories']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleFilterExpand = (filterKey: string) => {
    setExpandedFilters(prev => prev.includes(filterKey) ? prev.filter(f => f !== filterKey) : [...prev, filterKey]);
  };
  const [searchQuery, setSearchQuery] = useState(searchParamVal);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParamVal);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? categoryParam.split(',') : []
  );
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || loading || page >= totalPages) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        setPage(p => p + 1);
      }
    }, { rootMargin: '400px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, page, totalPages]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/store/catalog/categories`);
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch attribute filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (categoryParam) queryParams.set('category', categoryParam);
        const s = searchParams.get('search');
        if (s) queryParams.set('search', s);

        const res = await fetch(`${API_URL}/api/store/catalog/filters?${queryParams.toString()}`);
        const data = await res.json();
        setFilters(data.filters || []);
        
        // Also expand metal filters by default
        const metalFilters = (data.filters || [])
          .filter((f: any) => f.name.toLowerCase().includes('metal'))
          .map((f: any) => f.slug);
        setExpandedFilters(prev => Array.from(new Set([...prev, 'categories', ...metalFilters])));
      } catch (err) {
        console.error('Failed to fetch product filters', err);
      }
    };
    fetchFilters();
  }, [categoryParam, searchParams.get('search')]);

  // Sync URL params to state
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setSelectedCategories(categoryParam ? categoryParam.split(',') : []);
    const s = searchParams.get('search') || '';
    setSearchQuery(s);
    setDebouncedSearchQuery(s);
    setPage(1);
  }, [categoryParam, searchParams]);

  // Fetch products
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchProducts = useCallback(async (
    p: number,
    search: string,
    sort: string,
    categorySlugs: string[],
    attrs: Record<string, string[]>,
    signal?: AbortSignal
  ) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '24', sort });
      if (search) params.set('search', search);
      if (categorySlugs.length > 0) params.set('category', categorySlugs.join(','));
      Object.entries(attrs).forEach(([slug, values]) => {
        if (Array.isArray(values) && values.length > 0) params.set(`attr_${slug}`, values.join(','));
      });

      const res = await fetch(`${API_URL}/api/store/catalog/products?${params}`, { signal });
      const data = await res.json();

      if (signal?.aborted) return;

      if (p === 1) {
        setProducts(data.products || []);
      } else {
        setProducts(prev => {
          // Avoid appending duplicates if React double-fires
          const existingIds = new Set(prev.map(prod => prod.id));
          const newProducts = (data.products || []).filter((prod: any) => !existingIds.has(prod.id));
          return [...prev, ...newProducts];
        });
      }
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

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Trigger fetch
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetchProducts(page, debouncedSearchQuery, sortBy, selectedCategories, selectedAttributes, controller.signal);
    }, 0);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page, debouncedSearchQuery, sortBy, selectedCategories, selectedAttributes, fetchProducts]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setLoading(true);
  };

  const updateUrlParams = (cats: string[], attrs: Record<string, string[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cats.length > 0) params.set('category', cats.join(','));
    else params.delete('category');
    const keys = Array.from(params.keys());
    keys.forEach(k => { if (k.startsWith('attr_')) params.delete(k); });
    params.delete('metal');
    Object.entries(attrs).forEach(([slug, values]) => {
      if (values.length > 0) params.set(`attr_${slug}`, values.join(','));
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleCategorySelection = (slug: string, descendantSlugs: string[], ancestorSlugs: string[]) => {
    setLoading(true);
    let newCats: string[];

    if (selectedCategories.includes(slug)) {
      // Unchecking: remove this slug and ensure descendants are also removed
      newCats = selectedCategories.filter(c => c !== slug && !descendantSlugs.includes(c));
    } else {
      // Checking: remove all ancestors (to narrow down) and descendants (to broaden up), then add this slug
      newCats = selectedCategories.filter(c => !ancestorSlugs.includes(c) && !descendantSlugs.includes(c));
      newCats.push(slug);
    }

    setSelectedCategories(newCats);
    updateUrlParams(newCats, selectedAttributes);
    setPage(1);
  };

  const getCategoryDescendantSlugs = (category: CategoryTree): string[] =>
    category.children.flatMap(child => [child.slug, ...getCategoryDescendantSlugs(child)]);

  const getCategoryName = (slug: string) => {
    let foundName = slug;
    const findInTree = (nodes: CategoryTree[]) => {
      for (const node of nodes) {
        if (node.slug === slug) foundName = node.name;
        if (node.children) findInTree(node.children);
      }
    };
    findInTree(categories);
    return foundName;
  };

  const renderCategoryFilter = (category: CategoryTree, ancestorSlugs: string[] = []) => {
    const childSlugs = getCategoryDescendantSlugs(category);
    const isParentSelected = selectedCategories.includes(category.slug);
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedCategories.includes(category.slug);

    return (
      <div key={category.id} className={styles.categoryItem}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className={styles.checkLabel} style={{ margin: 0, flex: 1 }}>
            <input
              type="checkbox"
              checked={isParentSelected}
              onChange={() => toggleCategorySelection(category.slug, childSlugs, ancestorSlugs)}
              className={styles.checkInput}
            />
            {category.name}
          </label>
          {hasChildren && (
            <button
              type="button"
              onClick={() => setExpandedCategories(prev =>
                prev.includes(category.slug) ? prev.filter(c => c !== category.slug) : [...prev, category.slug]
              )}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: '1.2rem', color: '#666' }}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className={styles.subcategories}>
            {category.children.map(child => renderCategoryFilter(child, [...ancestorSlugs, category.slug]))}
          </div>
        )}
      </div>
    );
  };

  const toggleAttribute = (attrSlug: string, termName: string) => {
    setLoading(true);
    const current = selectedAttributes[attrSlug] || [];
    const updated = current.includes(termName)
      ? current.filter(t => t !== termName)
      : [...current, termName];
    const next = { ...selectedAttributes };
    if (updated.length > 0) next[attrSlug] = updated;
    else delete next[attrSlug];

    setSelectedAttributes(next);
    updateUrlParams(selectedCategories, next);
    setPage(1);
  };

  const resetFilters = () => {
    setLoading(true);
    setSelectedCategories([]);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setPage(1);
    updateUrlParams([], {});
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

          {/* Categories */}
          <div className={styles.filterBlock}>
            <h3
              className={styles.filterTitle}
              onClick={() => toggleFilterExpand('categories')}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
            >
              Categories <span>{expandedFilters.includes('categories') ? '−' : '+'}</span>
            </h3>
            {expandedFilters.includes('categories') && (
              <div className={styles.filterList}>
                {[...categories].sort((a, b) => sortCategories(a.name, b.name)).map(cat => renderCategoryFilter(cat, []))}
              </div>
            )}
          </div>



          {/* Dynamic attribute filters */}
          {filters.map(filter => (
            <div key={filter.id} className={styles.filterBlock}>
              <h3
                className={styles.filterTitle}
                onClick={() => toggleFilterExpand(filter.slug)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
              >
                {filter.name} <span>{expandedFilters.includes(filter.slug) ? '−' : '+'}</span>
              </h3>
              {expandedFilters.includes(filter.slug) && (
                <div className={styles.filterList}>
                  {filter.terms.map(term => (
                    <label key={term.id} className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={(selectedAttributes[filter.slug] || []).includes(term.name)}
                        onChange={() => toggleAttribute(filter.slug, term.name)}
                        className={styles.checkInput}
                      />
                      {filter.type === 'color' && term.color_hex && (
                        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: term.color_hex, marginRight: 6, border: '1px solid #ccc' }} />
                      )}
                      {filter.type === 'image' && term.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={term.image_url} alt={term.name} style={{ width: 14, height: 14, borderRadius: '50%', marginRight: 6, border: '1px solid #ccc', objectFit: 'cover' }} />
                      )}
                      {term.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <div className={styles.activeFiltersGroup}>
              <button onClick={resetFilters} className={styles.resetBtn}>Reset Filters</button>

              {searchQuery && (
                <span className={styles.activeFilterTag}>
                  Search: {searchQuery}
                  <button className={styles.activeFilterRemoveBtn} onClick={() => {
                    setSearchQuery('');
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('search');
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  }}><FiX /></button>
                </span>
              )}

              {selectedCategories.map(cat => (
                <span key={cat} className={styles.activeFilterTag}>
                  {getCategoryName(cat)}
                  <button className={styles.activeFilterRemoveBtn} onClick={() => toggleCategorySelection(cat, [], [])}><FiX /></button>
                </span>
              ))}

              {Object.entries(selectedAttributes).map(([slug, values]) =>
                values.map(val => {
                  const filterName = filters.find(f => f.slug === slug)?.name || slug;
                  return (
                    <span key={`${slug}-${val}`} className={styles.activeFilterTag}>
                      {filterName}: {val}
                      <button className={styles.activeFilterRemoveBtn} onClick={() => toggleAttribute(slug, val)}><FiX /></button>
                    </span>
                  );
                })
              )}
            </div>

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
          {loading && page === 1 ? (
            <div className="global-loader-container">
              <div className="global-spinner"></div>
              <div className="global-loader-text">Loading Products</div>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product, index) => (
                <ScrollReveal key={product.id} animation="fade-up" delay={(index % 4) * 100 as 0|100|200|300} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ProductCard 
                    product={product} 
                    isAuthenticated={isAuthenticated} 
                    userPermission={userPermission} 
                  />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Pagination */}
          {/* Infinite Scroll Trigger */}
          {page < totalPages && (
            <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              {loading && page > 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                  <div className="global-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  <span>Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={() => { setLoading(true); setPage(p => p + 1); }}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #d0d5dd', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Load More
                </button>
              )}
            </div>
          )}
          {page >= totalPages && products.length > 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888', fontSize: '0.9rem' }}>
              You have reached the end of the catalog.
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
