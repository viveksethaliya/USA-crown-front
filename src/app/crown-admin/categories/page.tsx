"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import adminStyles from "../admin.module.css";
import styles from "../products/products.module.css";
import { toast } from "react-hot-toast";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  sort_order: number;
  is_visible: boolean;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      const data = await res.json();
      
      // Build tree
      const childrenByParent: Record<string, Category[]> = {};
      (data.categories || []).forEach((cat: Category) => {
        const key = cat.parent_id || 'root';
        if (!childrenByParent[key]) childrenByParent[key] = [];
        childrenByParent[key].push(cat);
      });

      const buildTree = (parentId: string | number = 'root'): Category[] => {
        return (childrenByParent[parentId] || []).map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
      };

      setCategories(buildTree());
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(`Error deleting: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const renderCategoryNode = (cat: Category, depth = 0) => {
    return (
      <React.Fragment key={cat.id}>
        <tr>
          <td style={{ paddingLeft: `${depth * 2 + 1}rem` }}>
            {depth > 0 && <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>-</span>}
            <strong>{cat.name}</strong>
          </td>
          <td style={{ color: '#666' }}>{cat.slug}</td>
          <td>
            {cat.is_visible ? (
              <span style={{ color: '#16a34a', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>Visible</span>
            ) : (
              <span style={{ color: '#dc2626', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>Hidden</span>
            )}
          </td>
          <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Link href={`/crown-admin/categories/${cat.id}`} className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(cat.id)}
                className={styles.btnCancel}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fee2e2' }}
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
        {cat.children && cat.children.map(child => renderCategoryNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className={adminStyles.adminPage}>
      <div className={adminStyles.adminHeader}>
        <h1>Categories</h1>
        <Link href="/crown-admin/categories/new" className={adminStyles.primaryBtn}>
          + Add Category
        </Link>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading categories...</div>
        ) : (
          <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Slug</th>
                <th style={{ padding: '1rem' }}>Visibility</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No categories found. Create your first one!
                  </td>
                </tr>
              ) : (
                categories.map(cat => renderCategoryNode(cat, 0))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
