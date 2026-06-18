"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../../products/products.module.css";
import { toast } from "react-hot-toast";

export default function TagEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const tagId = isNew ? null : parseInt(params.id as string);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    meta_title: "",
    meta_description: "",
    sort_order: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!isNew && tagId) {
          const res = await fetch(`/api/admin/tags/${tagId}`, { credentials: "include" });
          if (!res.ok) throw new Error("Tag not found");
          const data = await res.json();
          setFormData({
            name: data.tag.name || "",
            slug: data.tag.slug || "",
            description: data.tag.description || "",
            meta_title: data.tag.meta_title || "",
            meta_description: data.tag.meta_description || "",
            sort_order: data.tag.sort_order || 0
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load tag data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [tagId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;
    
    if (name === 'sort_order') {
      finalValue = value === "" ? "" : parseInt(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: isNew ? generateSlug(newName) : prev.slug
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/tags" : `/api/admin/tags/${tagId}`;
      
      const payload = { ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(isNew ? "Tag created!" : "Tag updated!");
      router.push("/crown-admin/tags");
    } catch (err) {
      toast.error(`Error saving tag: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className={adminStyles.adminPage}>
      <Link href="/crown-admin/tags" className={styles.backLink}>
        &larr; Back to Tags
      </Link>

      <div className={adminStyles.adminHeader}>
        <h1>{isNew ? "Add New Tag" : `Edit Tag: ${formData.name}`}</h1>
        <button onClick={handleSave} className={adminStyles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Tag"}
        </button>
      </div>

      <form onSubmit={handleSave} className={styles.card}>
        <div className={styles.fieldGrid}>
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Name *</label>
            <input 
              required
              name="name"
              className={styles.fieldInput} 
              value={formData.name} 
              onChange={handleNameChange} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Slug *</label>
            <input 
              required
              name="slug"
              className={styles.fieldInput} 
              value={formData.slug} 
              onChange={handleChange} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sort Order</label>
            <input 
              type="number"
              name="sort_order"
              className={styles.fieldInput} 
              value={formData.sort_order} 
              onChange={handleChange} 
            />
          </div>

          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea 
              name="description"
              className={styles.fieldInput} 
              value={formData.description} 
              onChange={handleChange} 
              rows={3}
            />
          </div>

          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>SEO Settings</h3>
            <hr style={{ marginBottom: '1.5rem', border: 'none', borderTop: '1px solid #e2e8f0' }}/>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Meta Title</label>
            <input 
              name="meta_title"
              className={styles.fieldInput} 
              value={formData.meta_title} 
              onChange={handleChange} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Meta Description</label>
            <textarea 
              name="meta_description"
              className={styles.fieldInput} 
              value={formData.meta_description} 
              onChange={handleChange} 
              rows={2}
            />
          </div>

        </div>
      </form>
    </div>
  );
}
