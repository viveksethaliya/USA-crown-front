"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import adminStyles from "../admin.module.css";
import styles from "../products/products.module.css";
import { toast } from "react-hot-toast";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  is_global: boolean;
  type: string;
  is_visible: boolean;
  is_variation: boolean;
  sort_order: number;
  productCount?: number;
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrSlug, setNewAttrSlug] = useState("");
  const [newAttrType, setNewAttrType] = useState("select");
  const [newAttrVisible, setNewAttrVisible] = useState(true);
  const [newAttrVariation, setNewAttrVariation] = useState(false);

  const fetchAttributes = async () => {
    try {
      const res = await fetch("/api/admin/attributes", { credentials: "include" });
      const data = await res.json();
      setAttributes(data.attributes || []);
    } catch (err) {
      console.error("Failed to fetch attributes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid synchronous state updates in effect
    setTimeout(() => fetchAttributes(), 0);
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewAttrName(val);
    setNewAttrSlug(generateSlug(val));
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName || !newAttrSlug) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          name: newAttrName, 
          slug: newAttrSlug, 
          type: newAttrType,
          is_visible: newAttrVisible,
          is_variation: newAttrVariation,
          is_global: true, 
          sort_order: 0 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewAttrName("");
      setNewAttrSlug("");
      setNewAttrType("select");
      setNewAttrVisible(true);
      setNewAttrVariation(false);
      fetchAttributes();
    } catch (err) {
      toast.error(`Error creating attribute: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this attribute and all its terms?")) return;
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: 'DELETE',
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Attribute deleted");
      fetchAttributes();
    } catch (err) {
      toast.error(`Error deleting: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className={adminStyles.adminPage}>
      <div className={adminStyles.adminHeader}>
        <h1>Product Attributes</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Add New Attribute Sidebar */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add New Attribute</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
            Attributes let you define extra product data, such as size or color. You can use these attributes in the shop sidebar using the &quot;filter by&quot; widgets.
          </p>
          <form onSubmit={handleAddAttribute}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Name</label>
              <input 
                required
                type="text" 
                className={styles.fieldInput} 
                value={newAttrName}
                onChange={handleNameChange}
                placeholder="e.g. Size"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Slug</label>
              <input 
                required
                type="text" 
                className={styles.fieldInput} 
                value={newAttrSlug}
                onChange={e => setNewAttrSlug(e.target.value)}
                placeholder="e.g. size"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Type</label>
              <select 
                className={styles.fieldSelect} 
                value={newAttrType}
                onChange={e => setNewAttrType(e.target.value)}
              >
                <option value="select">Select (Dropdown)</option>
                <option value="color">Color Swatches</option>
                <option value="button">Buttons / Labels</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={newAttrVisible}
                  onChange={e => setNewAttrVisible(e.target.checked)}
                />
                Visible on Product Page
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={newAttrVariation}
                  onChange={e => setNewAttrVariation(e.target.checked)}
                />
                Use for Variations
              </label>
            </div>
            <button type="submit" className={adminStyles.primaryBtn} disabled={saving} style={{ width: '100%', marginTop: '0.5rem' }}>
              {saving ? "Adding..." : "Add Attribute"}
            </button>
          </form>
        </div>

        {/* Attributes List */}
        <div className={styles.card}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading attributes...</div>
          ) : (
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Slug</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Products</th>
                  <th style={{ padding: '1rem' }}>Order</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attributes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      No attributes found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  attributes.map(attr => (
                    <tr key={attr.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>{attr.name}</strong>
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>{attr.slug}</td>
                      <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{attr.type}</td>
                      <td style={{ padding: '1rem' }}>{attr.productCount || 0}</td>
                      <td style={{ padding: '1rem' }}>{attr.sort_order}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/crown-admin/attributes/${attr.id}`} className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                            Configure terms
                          </Link>
                          <button 
                            onClick={() => handleDelete(attr.id)}
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
      </div>
    </div>
  );
}
