"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../../products/products.module.css";
import { FiTrash2, FiMenu } from "react-icons/fi";
import MediaPicker from "@/components/media/MediaPicker";

interface CollectionProduct {
  id: number;
  name: string;
  sku: string;
  sort_order: number;
  is_featured: boolean;
}

export default function CollectionEditPage() {
  const params = useParams();
  const collectionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    position: 0,
    is_visible: true,
    show_in_nav: true,
    description: "",
    hero_image: "",
    hero_image_media_id: "",
    meta_title: "",
    meta_description: ""
  });

  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchCollection = async () => {
    try {
      const [colRes, prodRes] = await Promise.all([
        fetch(`/api/admin/collections/${collectionId}`, { credentials: "include" }),
        fetch(`/api/admin/collections/${collectionId}/products`, { credentials: "include" })
      ]);
      const colData = await colRes.json();
      const prodData = await prodRes.json();
      
      if (colData.collection) {
        setFormData({
          name: colData.collection.name || "",
          slug: colData.collection.slug || "",
          position: colData.collection.position || 0,
          is_visible: colData.collection.is_visible !== false,
          show_in_nav: colData.collection.show_in_nav !== false,
          description: colData.collection.description || "",
          hero_image: colData.collection.hero_image || "",
          hero_image_media_id: colData.collection.hero_image_media_id || "",
          meta_title: colData.collection.meta_title || "",
          meta_description: colData.collection.meta_description || ""
        });
      }
      
      if (prodData.products) {
        setProducts(prodData.products.map((cp: { products: { id: number; name: string; sku: string }; sort_order: number; is_featured: boolean }) => ({
          ...cp.products,
          sort_order: cp.sort_order,
          is_featured: cp.is_featured
        })));
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to load collection details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? (value === "" ? "" : parseInt(value)) : value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleMediaSelect = (selected: { url: string; mediaId: string; alt_text?: string; title?: string }[]) => {
    if (selected.length > 0) {
      setFormData(prev => ({
        ...prev,
        hero_image: selected[0].url,
        hero_image_media_id: selected[0].mediaId
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        hero_image_media_id: formData.hero_image_media_id === "" ? null : formData.hero_image_media_id
      };
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save collection");
      alert("Collection metadata updated!");
    } catch (err: unknown) {
      alert(`Error saving collection: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Product Management ---

  const searchProducts = async () => {
    if (searchQuery.length < 2) return;
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include"
      });
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const addProduct = async (product: { id: number; name: string; sku: string }) => {
    // Avoid dupes
    if (products.find(p => p.id === product.id)) {
      alert("Product already in collection");
      return;
    }

    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productIds: [product.id] })
      });
      if (!res.ok) throw new Error("Failed to add product");
      
      // Re-fetch to get accurate sort order
      fetchCollection();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/products/${productId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to remove product");
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to remove product");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newArr = [...products];
    const [draggedItem] = newArr.splice(draggedIndex, 1);
    newArr.splice(dropIndex, 0, draggedItem);
    
    setProducts(newArr);
    setDraggedIndex(null);
    
    const orderedIds = newArr.map(p => p.id);
    try {
      await fetch(`/api/admin/collections/${collectionId}/products/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedProductIds: orderedIds })
      });
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to save new order");
      fetchCollection();
    }
  };

  const toggleFeatured = async (productId: number, isFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_featured: isFeatured })
      });
      if (!res.ok) throw new Error("Failed to update product");
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_featured: isFeatured } : p
      ));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to update featured status");
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading collection...</div>;

  return (
    <div className={adminStyles.adminPage}>
      <Link href="/crown-admin/collections" className={styles.backLink}>
        ← Back to Collections
      </Link>

      <div className={adminStyles.adminHeader}>
        <h1>Manage Collection: {formData.name}</h1>
        <button onClick={handleSave} className={adminStyles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Collection Info"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Col: Metadata */}
        <form onSubmit={handleSave} className={styles.card}>
          <h3 className={styles.cardTitle}>Collection Metadata</h3>
          
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Name *</label>
              <input required name="name" className={styles.fieldInput} value={formData.name} onChange={handleChange} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Slug *</label>
              <input required name="slug" className={styles.fieldInput} value={formData.slug} onChange={handleChange} />
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea name="description" className={styles.fieldInput} value={formData.description} onChange={handleChange} rows={3} />
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>Hero Image URL</label>
              {formData.hero_image && (
                <div style={{ marginBottom: '0.75rem', width: '120px', height: '80px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={formData.hero_image} alt="Hero preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  name="hero_image" 
                  className={styles.fieldInput} 
                  value={formData.hero_image} 
                  onChange={handleChange} 
                  placeholder="https://..." 
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#1a1a2e',
                    color: '#d4af37',
                    border: '1px solid #d4af37',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Choose Image
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Meta Title (SEO)</label>
              <input name="meta_title" className={styles.fieldInput} value={formData.meta_title} onChange={handleChange} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Meta Description (SEO)</label>
              <textarea name="meta_description" className={styles.fieldInput} value={formData.meta_description} onChange={handleChange} rows={2} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Sort Order (Global)</label>
              <input type="number" name="position" className={styles.fieldInput} value={formData.position} onChange={handleChange} />
            </div>

            <div className={styles.fieldGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="is_visible" checked={formData.is_visible} onChange={handleChange} />
                Collection is active and visible
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="show_in_nav" checked={formData.show_in_nav} onChange={handleChange} />
                Show in top navigation menu
              </label>
            </div>
          </div>
        </form>

        {/* Right Col: Products */}
        <div>
          <div className={styles.card} style={{ marginBottom: '2rem' }}>
            <h3 className={styles.cardTitle}>Add Products</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className={styles.fieldInput} 
                placeholder="Search products by name or SKU..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchProducts()}
              />
              <button onClick={searchProducts} className={adminStyles.primaryBtn} style={{ padding: '0.5rem 1rem' }}>Search</button>
            </div>
            
            {searchResults.length > 0 && (
              <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map(p => (
                  <div key={p.id} style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <strong>{p.name}</strong> <span style={{ color: '#666', fontSize: '0.85rem' }}>({p.sku})</span>
                    </div>
                    <button onClick={() => addProduct(p)} className={adminStyles.primaryBtn} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Assigned Products ({products.length})</h3>
            
            {products.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 4 }}>
                No products in this collection yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products.map((p, idx) => (
                  <div 
                    key={p.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.75rem', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 4, 
                      background: draggedIndex === idx ? '#f8fafc' : '#fff',
                      cursor: 'grab',
                      opacity: draggedIndex === idx ? 0.5 : 1
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <FiMenu style={{ color: '#cbd5e1', cursor: 'grab' }} />
                      <span style={{ color: '#94a3b8', fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.sku}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer', marginRight: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={p.is_featured || false} 
                          onChange={(e) => toggleFeatured(p.id, e.target.checked)} 
                        />
                        Featured
                      </label>
                      
                      <button 
                        onClick={() => removeProduct(p.id)}
                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.5rem' }}
                        title="Remove from collection"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <MediaPicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleMediaSelect}
        selectedUrls={formData.hero_image ? [formData.hero_image] : []}
      />
    </div>
  );
}
