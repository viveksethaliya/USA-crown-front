"use client";

import { useEffect, useState, useCallback } from "react";
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
  created_at: string;
  variationCount: number;
  image: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (q) params.set('search', q);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?${params}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, search);
  }, [page, fetchProducts]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      fetchProducts(1, val);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${id}/toggle`,
        { method: 'PATCH', credentials: "include" }
      );
      if (res.ok) {
        setProducts(prev => prev.map(p =>
          p.id === id ? { ...p, published: !p.published } : p
        ));
      }
    } catch (err) {
      console.error("Failed to toggle product", err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will also delete all its variations.`)) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${id}`,
        { method: 'DELETE', credentials: "include" }
      );
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        setTotal(prev => prev - 1);
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      alert("Error deleting product.");
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
        <h1 className={adminStyles.pageTitle}>Manage Products</h1>
        <span className={styles.productCount}>{total.toLocaleString()} total products</span>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={adminStyles.tableContainer}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>
        ) : (
          <table className={adminStyles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Type</th>
                <th style={{ width: 80 }}>Vars</th>
                <th style={{ width: 90 }}>Published</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    {search ? `No products matching "${search}"` : 'No products found.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
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
                        style={{ color: '#1a1a2e', textDecoration: 'none' }}
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {product.sku || '—'}
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {product.type || 'simple'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {product.variationCount > 0 ? product.variationCount : '—'}
                    </td>
                    <td>
                      <button
                        className={`${styles.toggleSwitch} ${product.published ? styles.active : ''}`}
                        onClick={() => handleToggle(product.id)}
                        title={product.published ? 'Click to unpublish' : 'Click to publish'}
                      />
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        <Link
                          href={`/crown-admin/products/${product.id}`}
                          className={adminStyles.tableBtn}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className={`${adminStyles.tableBtn} ${adminStyles.tableBtnDanger}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {renderPagination()}
    </>
  );
}
