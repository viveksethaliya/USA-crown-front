"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import adminStyles from "../admin.module.css";
import styles from "./products.module.css";

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  published: boolean;
  in_stock: boolean;
  created_at: string;
  variationCount: number;
  image: string | null;
  categoryNames: string[];
}

interface Stats {
  all: number;
  published: number;
  draft: number;
  outOfStock: number;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ all: 0, published: 0, draft: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch Categories
  useEffect(() => {
    fetch(`/api/admin/categories`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  // Fetch Stats
  const loadStats = async () => {
    try {
      const res = await fetch(`/api/admin/products/stats`, { credentials: "include" });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  // Fetch Products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        limit: '50',
        status,
        type,
        category,
        sortField,
        sortOrder
      });
      if (search) params.set('search', search);

      const res = await fetch(
        `/api/admin/products?${params}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setSelectedIds([]); // Reset selection on page load
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, type, category, sortField, sortOrder]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setPage(1);
  };

  // Individual Actions
  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(
        `/api/admin/products/${id}/toggle`,
        { method: 'PATCH', credentials: "include" }
      );
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, published: !p.published } : p));
        loadStats();
      }
    } catch (err) {
      console.error("Failed to toggle product", err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will also delete all its variations.`)) return;
    try {
      const res = await fetch(
        `/api/admin/products/${id}`,
        { method: 'DELETE', credentials: "include" }
      );
      if (res.ok) {
        loadProducts();
        loadStats();
      } else {
        alert("Failed to delete product.");
      }
    } catch {
      alert("Error deleting product.");
    }
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleBulkToggle = async (publish: boolean) => {
    if (!window.confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} ${selectedIds.length} products?`)) return;
    
    try {
      const res = await fetch(`/api/admin/products/bulk-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, publish }),
        credentials: 'include'
      });
      if (res.ok) {
        loadProducts();
        loadStats();
      } else {
        alert("Bulk update failed.");
      }
    } catch (err) {
      console.error("Bulk update error", err);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ${selectedIds.length} products and all their variations?`)) return;
    
    try {
      const res = await fetch(`/api/admin/products/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
        credentials: 'include'
      });
      if (res.ok) {
        loadProducts();
        loadStats();
      } else {
        alert("Bulk delete failed.");
      }
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${i}`} className={styles.pageInfo}>…</span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${page === p ? styles.active : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Products</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>Manage your catalog, variations, and inventory.</p>
        </div>
        <Link href="/crown-admin/products/new" className={adminStyles.primaryBtn}>
          + Add Product
        </Link>
      </div>

      <div className={styles.statusTabs}>
        <button className={`${styles.tabBtn} ${status === 'all' ? styles.tabActive : ''}`} onClick={() => handleFilterChange(setStatus, 'all')}>
          All <span className={styles.countBadge}>{stats.all}</span>
        </button>
        <button className={`${styles.tabBtn} ${status === 'published' ? styles.tabActive : ''}`} onClick={() => handleFilterChange(setStatus, 'published')}>
          Published <span className={styles.countBadge}>{stats.published}</span>
        </button>
        <button className={`${styles.tabBtn} ${status === 'draft' ? styles.tabActive : ''}`} onClick={() => handleFilterChange(setStatus, 'draft')}>
          Drafts <span className={styles.countBadge}>{stats.draft}</span>
        </button>
        <button className={`${styles.tabBtn} ${status === 'out_of_stock' ? styles.tabActive : ''}`} onClick={() => handleFilterChange(setStatus, 'out_of_stock')}>
          Out of Stock <span className={`${styles.countBadge} ${stats.outOfStock > 0 ? styles.countDanger : ''}`}>{stats.outOfStock}</span>
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
            style={{ width: '250px' }}
          />
          
          <select value={category} onChange={(e) => handleFilterChange(setCategory, e.target.value)} className={styles.filterSelect}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select value={type} onChange={(e) => handleFilterChange(setType, e.target.value)} className={styles.filterSelect}>
            <option value="all">All Types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Sort by:</span>
          <select value={sortField} onChange={(e) => handleFilterChange(setSortField, e.target.value)} className={styles.filterSelect}>
            <option value="created_at">Date Created</option>
            <option value="name">Name</option>
            <option value="sku">SKU</option>
          </select>
          <button 
            className={styles.sortDirBtn} 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkActionBar}>
          <span><strong>{selectedIds.length}</strong> items selected</span>
          <div className={styles.bulkActions}>
            <button onClick={() => handleBulkToggle(true)} className={styles.bulkBtn}>Publish</button>
            <button onClick={() => handleBulkToggle(false)} className={styles.bulkBtn}>Unpublish</button>
            <button onClick={() => handleBulkDelete()} className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}>Delete</button>
          </div>
        </div>
      )}

      <div className={adminStyles.tableContainer}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Loading products...</div>
        ) : (
          <table className={adminStyles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ width: 60 }}>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Stock / Vars</th>
                <th>Category</th>
                <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    {search || status !== 'all' || type !== 'all' || category !== 'all' 
                      ? 'No products found matching your filters.' 
                      : 'No products exist yet.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={selectedIds.includes(product.id) ? styles.rowSelected : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleSelectOne(product.id)}
                      />
                    </td>
                    <td>
                      <div className={styles.thumbCell}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className={styles.thumbPlaceholder}>N/A</div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: 300 }}>
                      <Link
                        href={`/crown-admin/products/${product.id}`}
                        style={{ color: '#1a1a2e', textDecoration: 'none', display: 'block' }}
                      >
                        {product.name}
                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                          Added {new Date(product.created_at).toLocaleDateString()}
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {product.sku || <span style={{ color: '#aaa' }}>No SKU</span>}
                    </td>
                    <td>
                      {product.type === 'variable' ? (
                        <span className={styles.varBadge}>{product.variationCount} vars</span>
                      ) : (
                        <span className={`${styles.stockBadge} ${product.in_stock ? styles.stockIn : styles.stockOut}`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {product.categoryNames.length > 0 ? (
                        product.categoryNames.join(', ')
                      ) : (
                        <span style={{ color: '#aaa' }}>Uncategorized</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`${styles.toggleSwitch} ${product.published ? styles.active : ''}`}
                        onClick={() => handleToggle(product.id)}
                        title={product.published ? 'Click to unpublish' : 'Click to publish'}
                      />
                      <div style={{ fontSize: '0.7rem', color: product.published ? '#2e7d32' : '#ed6c02', marginTop: '4px' }}>
                        {product.published ? 'Published' : 'Draft'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/crown-admin/products/${product.id}`}
                        className={styles.editLink}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.tableFooter}>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          Showing {products.length > 0 ? (page - 1) * 50 + 1 : 0} to {Math.min(page * 50, total)} of {total} products
        </div>
        {renderPagination()}
      </div>
    </>
  );
}
