"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import adminStyles from "../admin.module.css";
import styles from "../products/products.module.css";
import { toast } from "react-hot-toast";

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Fetch tags when search or page changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/admin/tags?${params}`, { credentials: "include" });
        const data = await res.json();
        if (!cancelled) {
          setTags(data.tags || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch tags", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch, page, refreshKey]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Tag deleted");
      setRefreshKey(r => r + 1);
    } catch (err) {
      toast.error(`Error deleting: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className={adminStyles.adminPage}>
      <div className={adminStyles.adminHeader}>
        <h1>Product Tags</h1>
        <Link href="/crown-admin/tags/new" className={adminStyles.primaryBtn}>
          + Add Tag
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          style={{ width: '300px' }}
        />
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading tags...</div>
        ) : (
          <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Slug</th>
                <th style={{ padding: '1rem' }}>Products</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    {search ? 'No tags match your search.' : 'No tags found. Create your first one!'}
                  </td>
                </tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>{tag.name}</strong>
                      {tag.description && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>{tag.description}</div>}
                    </td>
                    <td style={{ padding: '1rem', color: '#666' }}>{tag.slug}</td>
                    <td style={{ padding: '1rem' }}>{tag.productCount}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link href={`/crown-admin/tags/${tag.id}`} className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(tag.id)}
                          className={styles.btnCancel}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fee2e2' }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            Showing {tags.length > 0 ? (page - 1) * 50 + 1 : 0} to {Math.min(page * 50, total)} of {total} tags
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={styles.btnSecondary}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              &larr; Prev
            </button>
            <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#666' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={styles.btnSecondary}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
