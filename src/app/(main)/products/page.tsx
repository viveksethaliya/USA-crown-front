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
  const metalParam = searchParams.get('metal');

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
  const [allMetalTypes, setAllMetalTypes] = useState<string[]>([]);
  const [metalColorMap, setMetalColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('name');
  const searchParamVal = searchParams.get('search') || '';

  const [expandedFilters, setExpandedFilters] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleFilterExpand = (filterKey: string) => {
    setExpandedFilters(prev => prev.includes(filterKey) ? prev.filter(f => f !== filterKey) : [...prev, filterKey]);
  };
  const [searchQuery, setSearchQuery] = useState(searchParamVal);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParamVal);
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

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check user session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/session`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // silently fail
      }
    }
    checkSession();
  }, []);

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

  // Fetch attribute filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (categoryParam) queryParams.set('category', categoryParam);
        const s = searchParams.get('search');
        if (s) queryParams.set('search', s);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/filters?${queryParams.toString()}`);
        const data = await res.json();
        setAllMetalTypes(data.metalTypes || []);
        setMetalColorMap(data.metalColors || {});
        setFilters(data.filters || []);
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
    setSelectedMetals(metalParam ? metalParam.split(',') : []);
    const s = searchParams.get('search') || '';
    setSearchQuery(s);
    setDebouncedSearchQuery(s);
    setPage(1);
  }, [categoryParam, metalParam, searchParams]);

  // Fetch products
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchProducts = useCallback(async (
    p: number,
    search: string,
    sort: string,
    categorySlugs: string[],
    metalTypes: string[],
    attrs: Record<string, string[]>,
    signal?: AbortSignal
  ) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '24', sort });
      if (search) params.set('search', search);
      if (categorySlugs.length > 0) params.set('category', categorySlugs.join(','));
      if (metalTypes.length > 0) params.set('metal', metalTypes.join(','));
      Object.entries(attrs).forEach(([slug, values]) => {
        if (Array.isArray(values) && values.length > 0) params.set(`attr_${slug}`, values.join(','));
      });

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
      fetchProducts(page, debouncedSearchQuery, sortBy, selectedCategories, selectedMetals, selectedAttributes, controller.signal);
    }, 0);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page, debouncedSearchQuery, sortBy, selectedCategories, selectedMetals, selectedAttributes, fetchProducts]);

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

  const toggleMetal = (metal: string) => {
    setLoading(true);
    let newMetals: string[];
    if (selectedMetals.includes(metal)) {
      newMetals = selectedMetals.filter(m => m !== metal);
    } else {
      newMetals = [...selectedMetals, metal];
    }
    setSelectedMetals(newMetals);
    updateUrlParams(selectedCategories, selectedAttributes);
    setPage(1);
  };

  const resetFilters = () => {
    setLoading(true);
    setSelectedCategories([]);
    setSelectedMetals([]);
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

          {/* Metal Type */}
          <div className={styles.filterBlock}>
            <h3 
              className={styles.filterTitle}
              onClick={() => toggleFilterExpand('metal_type')}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
            >
              Metal Type <span>{expandedFilters.includes('metal_type') ? '−' : '+'}</span>
            </h3>
            {expandedFilters.includes('metal_type') && (
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
                      {term.color_hex && (
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: term.color_hex, marginRight: 4, border: '1px solid #ccc' }} />
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
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading products...
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map(product => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImageWrap}>
                    {product.tags && product.tags.length > 0 && (
                      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {product.tags.map((t) => (
                          <span key={t.id} style={{ background: '#111', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: 4 }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    {product.sizeRanges && product.sizeRanges.map((sz, i) => (
                      <div key={i} className={styles.metalRow}>
                        <span className={styles.metalLabel}>{sz.name}:</span>
                        <span className={styles.metalValue}>{sz.range}</span>
                      </div>
                    ))}
                    {isAuthenticated && product.priceRange && (
                      <div className={styles.metalRow}>
                        <span className={styles.metalLabel}>Price:</span>
                        <span className={styles.priceValue}>{product.priceRange}</span>
                      </div>
                    )}
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '2rem 0', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)); }}
                disabled={page <= 1}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d0d5dd', background: page <= 1 ? '#f4f6f8' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                ← Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#666', fontSize: '0.9rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => { setLoading(true); setPage(p => Math.min(totalPages, p + 1)); }}
                disabled={page >= totalPages}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d0d5dd', background: page >= totalPages ? '#f4f6f8' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
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
