"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../../products/products.module.css";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type?: string;
}

interface Term {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  color_hex?: string;
  image_url?: string;
}

export default function AdminAttributeTermsPage() {
  const params = useParams();
  const attributeId = parseInt(params.id as string);

  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newTermName, setNewTermName] = useState("");
  const [newTermSlug, setNewTermSlug] = useState("");
  const [newTermColor, setNewTermColor] = useState("");
  const [newTermOrder, setNewTermOrder] = useState<number>(0);
  const [newTermImage, setNewTermImage] = useState("");
  
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [editTermData, setEditTermData] = useState<Partial<Term>>({});

  const [mergingTermId, setMergingTermId] = useState<number | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [attrRes, termsRes] = await Promise.all([
          fetch(apiUrl(`/api/admin/attributes/${attributeId}`), { credentials: "include" }),
          fetch(apiUrl(`/api/admin/attributes/${attributeId}/terms`), { credentials: "include" })
        ]);
        
        const attrData = await attrRes.json();
        const termsData = await termsRes.json();
        
        if (!cancelled) {
          setAttribute(attrData.attribute || null);
          setTerms(termsData.terms || []);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch attribute data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attributeId, refreshKey]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTermName(val);
    setNewTermSlug(generateSlug(val));
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName || !newTermSlug) return;
    
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/attributes/${attributeId}/terms`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          name: newTermName, 
          slug: newTermSlug, 
          color_hex: newTermColor || null,
          image_url: newTermImage || null,
          sort_order: newTermOrder 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewTermName("");
      setNewTermSlug("");
      setNewTermColor("");
      setNewTermOrder(0);
      setNewTermImage("");
      setRefreshKey(r => r + 1);
    } catch (err) {
      toast.error(`Error creating term: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (termId: number) => {
    if (!window.confirm("Are you sure you want to delete this term?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/attribute-terms/${termId}`), {
        method: 'DELETE',
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Term deleted");
      setRefreshKey(r => r + 1);
    } catch (err) {
      toast.error(`Error deleting: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleMerge = async (sourceId: number) => {
    if (!mergeTargetId || mergeTargetId === sourceId) return;
    if (!window.confirm("Are you sure you want to merge? The source term will be deleted and all its products/variations will be moved to the target term.")) return;
    
    try {
      const res = await fetch(apiUrl(`/api/admin/attribute-terms/${sourceId}/merge`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target_term_id: mergeTargetId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMergeTargetId(null);
      setMergingTermId(null);
      setRefreshKey(r => r + 1);
      toast.success("Terms merged successfully");
    } catch (err) {
      toast.error(`Error merging: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startEditing = (term: Term) => {
    setEditingTermId(term.id);
    setEditTermData(term);
  };

  const handleUpdateTerm = async (id: number) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/attribute-terms/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editTermData)
      });
      
      if (!res.ok) throw new Error("Failed to update term");
      
      setEditingTermId(null);
      setRefreshKey(r => r + 1);
      toast.success("Term updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className={adminStyles.adminPage}>
      <Link href="/crown-admin/attributes" className={styles.backLink}>
        &larr; Back to Attributes
      </Link>

      <div className={adminStyles.adminHeader}>
        <h1>{attribute ? `Product ${attribute.name}` : "Attribute Terms"}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Add New Term Sidebar */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add New {attribute ? attribute.name : "Term"}</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
            Add new terms for this attribute (e.g. if the attribute is &quot;Size&quot;, add &quot;Small&quot;, &quot;Medium&quot;, etc).
          </p>
          <form onSubmit={handleAddTerm}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Name</label>
              <input 
                required
                type="text" 
                className={styles.fieldInput} 
                value={newTermName}
                onChange={handleNameChange}
                placeholder="e.g. Small"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Slug</label>
              <input 
                required
                type="text" 
                className={styles.fieldInput} 
                value={newTermSlug}
                onChange={e => setNewTermSlug(e.target.value)}
                placeholder="e.g. small"
              />
            </div>
            {attribute?.type === 'color' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Color Hex</label>
                <input 
                  type="color" 
                  className={styles.fieldInput} 
                  value={newTermColor || "#000000"}
                  onChange={e => setNewTermColor(e.target.value)}
                  style={{ height: '40px', padding: '0.2rem' }}
                />
              </div>
            )}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Sort Order</label>
              <input 
                type="number" 
                className={styles.fieldInput} 
                value={newTermOrder}
                onChange={e => setNewTermOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            {attribute?.type === 'button' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Image URL (optional)</label>
                <input 
                  type="text" 
                  className={styles.fieldInput} 
                  value={newTermImage}
                  onChange={e => setNewTermImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            <button type="submit" className={adminStyles.primaryBtn} disabled={saving} style={{ width: '100%', marginTop: '0.5rem' }}>
              {saving ? "Adding..." : "Add New Term"}
            </button>
          </form>
        </div>

        {/* Terms List */}
        <div className={styles.card}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading terms...</div>
          ) : (
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Slug</th>
                  <th style={{ padding: '1rem' }}>Order</th>
                  {attribute?.type === 'color' && <th style={{ padding: '1rem' }}>Color</th>}
                  {attribute?.type === 'button' && <th style={{ padding: '1rem' }}>Image</th>}
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {terms.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      No terms found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  terms.map(term => (
                    <tr key={term.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {editingTermId === term.id ? (
                        <>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="text" 
                              className={styles.fieldInput} 
                              value={editTermData.name || ""}
                              onChange={e => setEditTermData({...editTermData, name: e.target.value, slug: generateSlug(e.target.value)})}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="text" 
                              className={styles.fieldInput} 
                              value={editTermData.slug || ""}
                              onChange={e => setEditTermData({...editTermData, slug: e.target.value})}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="number" 
                              className={styles.fieldInput} 
                              style={{ width: '80px' }}
                              value={editTermData.sort_order || 0}
                              onChange={e => setEditTermData({...editTermData, sort_order: parseInt(e.target.value) || 0})}
                            />
                          </td>
                          {attribute?.type === 'color' && (
                            <td style={{ padding: '1rem' }}>
                              <input 
                                type="color" 
                                className={styles.fieldInput} 
                                value={editTermData.color_hex || "#000000"}
                                onChange={e => setEditTermData({...editTermData, color_hex: e.target.value})}
                                style={{ height: '40px', padding: '0.2rem', width: '60px' }}
                              />
                            </td>
                          )}
                          {attribute?.type === 'button' && (
                            <td style={{ padding: '1rem' }}>
                              <input 
                                type="text" 
                                className={styles.fieldInput} 
                                value={editTermData.image_url || ""}
                                onChange={e => setEditTermData({...editTermData, image_url: e.target.value})}
                                placeholder="https://..."
                              />
                            </td>
                          )}
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleUpdateTerm(term.id)}
                                className={adminStyles.primaryBtn}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingTermId(null)}
                                className={styles.btnSecondary}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '1rem' }}>
                            <strong>{term.name}</strong>
                          </td>
                          <td style={{ padding: '1rem', color: '#666' }}>{term.slug}</td>
                          <td style={{ padding: '1rem' }}>{term.sort_order}</td>
                          {attribute?.type === 'color' && (
                            <td style={{ padding: '1rem' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: term.color_hex || '#ccc', border: '1px solid #ddd' }} title={term.color_hex}></div>
                            </td>
                          )}
                          {attribute?.type === 'button' && (
                            <td style={{ padding: '1rem' }}>
                              {term.image_url ? (
                                <img src={term.image_url} alt={term.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                              ) : (
                                <span style={{ color: '#999', fontSize: '0.85rem' }}>None</span>
                              )}
                            </td>
                          )}
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {mergingTermId === term.id ? (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <select 
                                  className={styles.fieldSelect} 
                                  style={{ padding: '0.2rem', width: '120px' }}
                                  value={mergeTargetId || ""}
                                  onChange={e => setMergeTargetId(parseInt(e.target.value))}
                                >
                                  <option value="">Merge into...</option>
                                  {terms.filter(t => t.id !== term.id).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={() => handleMerge(term.id)}
                                  className={adminStyles.primaryBtn}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                  disabled={!mergeTargetId}
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => { setMergingTermId(null); setMergeTargetId(null); }}
                                  className={styles.btnSecondary}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => startEditing(term)}
                                  className={styles.btnSecondary}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => setMergingTermId(term.id)}
                                  className={styles.btnSecondary}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                  Merge
                                </button>
                                <button 
                                  onClick={() => handleDelete(term.id)}
                                  className={styles.btnCancel}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fee2e2' }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
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
