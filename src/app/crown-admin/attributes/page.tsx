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
  
  const [sortField, setSortField] = useState<keyof Attribute>("sort_order");
  const [sortAsc, setSortAsc] = useState(true);

  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);

  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrSlug, setNewAttrSlug] = useState("");
  const [newAttrType, setNewAttrType] = useState("select");
  const [newAttrVisible, setNewAttrVisible] = useState(true);
  const [newAttrVariation, setNewAttrVariation] = useState(false);

  const openEdit = (attr: Attribute) => {
    setEditingAttrId(attr.id);
    setNewAttrName(attr.name);
    setNewAttrSlug(attr.slug);
    setNewAttrType(attr.type);
    setNewAttrVisible(attr.is_visible);
    setNewAttrVariation(attr.is_variation);
  };

  const cancelEdit = () => {
    setEditingAttrId(null);
    setNewAttrName("");
    setNewAttrSlug("");
    setNewAttrType("select");
    setNewAttrVisible(true);
    setNewAttrVariation(false);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName || !newAttrSlug) return;
    
    setSaving(true);
    try {
      const url = editingAttrId ? `/api/admin/attributes/${editingAttrId}` : "/api/admin/attributes";
      const method = editingAttrId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
      
      cancelEdit();
      fetchAttributes();
      toast.success(editingAttrId ? "Attribute updated" : "Attribute created");
    } catch (err) {
      toast.error(`Error saving attribute: ${err instanceof Error ? err.message : String(err)}`);
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

  const sortedAttributes = [...attributes].sort((a, b) => {
    const aVal = a[sortField] ?? "";
    const bVal = b[sortField] ?? "";
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Attribute) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
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
          <h3 className={styles.cardTitle}>{editingAttrId ? "Edit Attribute" : "Add New Attribute"}</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
            Attributes let you define extra product data, such as size or color. You can use these attributes in the shop sidebar using the &quot;filter by&quot; widgets.
          </p>
          <form onSubmit={handleSubmit}>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className={adminStyles.primaryBtn} disabled={saving} style={{ flex: 1 }}>
                {saving ? "Saving..." : (editingAttrId ? "Update Attribute" : "Add Attribute")}
              </button>
              {editingAttrId && (
                <button type="button" onClick={cancelEdit} className={styles.btnSecondary} style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Attributes List */}
        <div className={styles.card}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading attributes...</div>
          ) : (
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', userSelect: 'none' }}>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Name {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('slug')}>
                    Slug {sortField === 'slug' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('type')}>
                    Type {sortField === 'type' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('productCount')}>
                    Products {sortField === 'productCount' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('sort_order')}>
                    Order {sortField === 'sort_order' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttributes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      No attributes found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  sortedAttributes.map(attr => (
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
                          <button 
                            onClick={() => openEdit(attr)}
                            className={styles.btnSecondary}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            Edit
                          </button>
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
