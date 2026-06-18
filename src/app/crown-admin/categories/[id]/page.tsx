"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../../products/products.module.css";
import MediaPicker from "@/components/media/MediaPicker";
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

export default function CategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const categoryId = isNew ? null : parseInt(params.id as string);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: "" as string | number,
    description: "",
    image_url: "",
    image_media_id: "",
    meta_title: "",
    meta_description: "",
    is_visible: true,
    sort_order: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all categories for parent dropdown
        const allRes = await fetch("/api/admin/categories", { credentials: "include" });
        const allData = await allRes.json();
        setAllCategories(allData.categories || []);

        if (!isNew && categoryId) {
          const res = await fetch(`/api/admin/categories/${categoryId}`, { credentials: "include" });
          if (!res.ok) throw new Error("Category not found");
          const data = await res.json();
          setFormData({
            name: data.category.name || "",
            slug: data.category.slug || "",
            parent_id: data.category.parent_id || "",
            description: data.category.description || "",
            image_url: data.category.image_url || "",
            image_media_id: data.category.image_media_id || "",
            meta_title: data.category.meta_title || "",
            meta_description: data.category.meta_description || "",
            is_visible: data.category.is_visible !== false,
            sort_order: data.category.sort_order || 0
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load category data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [categoryId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean | number = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'parent_id' || name === 'sort_order') {
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

  const handleMediaSelect = (selected: { url: string; mediaId: string; alt_text?: string; title?: string }[]) => {
    if (selected.length > 0) {
      setFormData(prev => ({
        ...prev,
        image_url: selected[0].url,
        image_media_id: selected[0].mediaId
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${categoryId}`;
      
      const payload = { 
        ...formData, 
        parent_id: formData.parent_id === "" ? null : formData.parent_id,
        image_media_id: formData.image_media_id === "" ? null : formData.image_media_id
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(isNew ? "Category created!" : "Category updated!");
      router.push("/crown-admin/categories");
    } catch (err) {
      toast.error(`Error saving category: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // Flatten categories for dropdown
  const flattenCategories = (cats: Category[], prefix = ""): { id: number, name: string }[] => {
    let result: { id: number, name: string }[] = [];
    cats.forEach(c => {
      // Prevent selecting itself or its children as parent
      if (!isNew && c.id === categoryId) return;
      
      result.push({ id: c.id, name: `${prefix}${c.name}` });
      if (c.children && c.children.length > 0) {
        result = result.concat(flattenCategories(c.children, prefix + "- "));
      }
    });
    return result;
  };

  const flatCats = flattenCategories(allCategories);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className={adminStyles.adminPage}>
      <Link href="/crown-admin/categories" className={styles.backLink}>
        ← Back to Categories
      </Link>

      <div className={adminStyles.adminHeader}>
        <h1>{isNew ? "Add New Category" : `Edit Category: ${formData.name}`}</h1>
        <button onClick={handleSave} className={adminStyles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Category"}
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
            <label className={styles.fieldLabel}>Parent Category</label>
            <select 
              name="parent_id"
              className={styles.fieldSelect} 
              value={formData.parent_id} 
              onChange={handleChange}
            >
              <option value="">None (Top Level)</option>
              {flatCats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
            <label className={styles.fieldLabel}>Image URL</label>
            {formData.image_url && (
              <div style={{ marginBottom: '0.75rem', width: '100px', height: '100px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <img src={formData.image_url} alt="Category preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input 
                name="image_url"
                className={styles.fieldInput} 
                value={formData.image_url} 
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
                Choose from Library
              </button>
            </div>
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
            <label className={styles.fieldLabel}>Visibility</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input 
                type="checkbox"
                name="is_visible"
                checked={formData.is_visible} 
                onChange={handleChange} 
              />
              Show this category on the storefront
            </label>
          </div>

          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
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

      <MediaPicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleMediaSelect}
        selectedUrls={formData.image_url ? [formData.image_url] : []}
      />
    </div>
  );
}
