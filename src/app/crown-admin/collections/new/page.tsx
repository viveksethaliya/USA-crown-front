"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../admin.module.css";
import { FiArrowLeft } from "react-icons/fi";
import MediaPicker from "@/components/media/MediaPicker";
import { toast } from "react-hot-toast";

const API = '/api/admin';

export default function NewCollectionPage() {
  const router = useRouter();
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHeroImage, setFormHeroImage] = useState("");
  const [formHeroImageMediaId, setFormHeroImageMediaId] = useState("");
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDescription, setFormMetaDescription] = useState("");
  const [formPosition, setFormPosition] = useState<number | "">("");
  const [formVisible, setFormVisible] = useState(true);
  const [formShowInNav, setFormShowInNav] = useState(true);
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    setFormSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setSaving(true);

    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || generateSlug(formName),
        description: formDescription.trim() || null,
        hero_image: formHeroImage.trim() || null,
        hero_image_media_id: formHeroImageMediaId.trim() || null,
        meta_title: formMetaTitle.trim() || null,
        meta_description: formMetaDescription.trim() || null,
        position: formPosition === "" ? null : Number(formPosition),
        is_visible: formVisible,
        show_in_nav: formShowInNav
      };

      const res = await fetch(`${API}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create collection");
        return;
      }

      toast.success("Collection created successfully");
      router.push(`/crown-admin/collections/${data.collection.id}`);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/crown-admin/collections" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <FiArrowLeft /> Back to Collections
          </Link>
          <h1 className={styles.pageTitle}>Create Collection</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSubmit} className={styles.btnPrimary} disabled={saving}>
            {saving ? "Creating..." : "Save Collection"}
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1a1a2e" }}>Basic Details</h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Collection Name *</label>
            <input
              type="text"
              className={styles.formControl}
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. New Arrivals"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>URL Slug *</label>
            <input
              type="text"
              className={styles.formControl}
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="auto-generated-from-name"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            className={styles.formControl}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Appears at the top of the collection page"
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Hero Image URL</label>
          {formHeroImage && (
            <div style={{ marginBottom: "0.75rem", width: "120px", height: "80px", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              <img src={formHeroImage} alt="Hero preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              className={styles.formControl}
              value={formHeroImage}
              onChange={(e) => setFormHeroImage(e.target.value)}
              placeholder="https://..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              style={{
                padding: "0.55rem 1.25rem",
                background: "#1a1a2e",
                color: "#d4af37",
                border: "1px solid #d4af37",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Choose Image
            </button>
          </div>
        </div>

        <h2 style={{ marginTop: "2rem", marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1a1a2e", borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>SEO & Visibility</h2>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Meta Title</label>
            <input
              type="text"
              className={styles.formControl}
              value={formMetaTitle}
              onChange={(e) => setFormMetaTitle(e.target.value)}
              placeholder={`Default: [Name] | Crown Findings`}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Meta Description</label>
            <input
              type="text"
              className={styles.formControl}
              value={formMetaDescription}
              onChange={(e) => setFormMetaDescription(e.target.value)}
              placeholder="Default: Uses the collection description"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Position (sort order)</label>
            <input
              type="number"
              className={styles.formControl}
              value={formPosition}
              onChange={(e) => setFormPosition(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Active Visibility</label>
            <select
              className={styles.formControl}
              value={formVisible ? "yes" : "no"}
              onChange={(e) => setFormVisible(e.target.value === "yes")}
            >
              <option value="yes">Yes - Visible</option>
              <option value="no">No - Hidden entirely</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Show in Navbar</label>
            <select
              className={styles.formControl}
              value={formShowInNav ? "yes" : "no"}
              onChange={(e) => setFormShowInNav(e.target.value === "yes")}
            >
              <option value="yes">Yes - Show link in header</option>
              <option value="no">No - Hidden from header</option>
            </select>
          </div>
        </div>
      </div>

      <MediaPicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(selected) => {
          if (selected.length > 0) {
            setFormHeroImage(selected[0].url);
            setFormHeroImageMediaId(selected[0].mediaId);
          }
        }}
        selectedUrls={formHeroImage ? [formHeroImage] : []}
      />
    </div>
  );
}
