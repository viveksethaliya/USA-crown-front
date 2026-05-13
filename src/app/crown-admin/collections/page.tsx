"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiEyeOff, FiArrowUp, FiArrowDown } from "react-icons/fi";

interface Collection {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_visible: boolean;
  created_at: string;
}

const API = "https://usa-crown-back.vercel.appk.vercel.app/api/admin";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formPosition, setFormPosition] = useState(0);
  const [formVisible, setFormVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch(`${API}/collections`, { credentials: "include" });
      const data = await res.json();
      if (data.collections) {
        setCollections(data.collections);
      }
    } catch (err) {
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormPosition(collections.length + 1);
    setFormVisible(true);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openCreateForm = () => {
    resetForm();
    setFormPosition(collections.length + 1);
    setShowForm(true);
  };

  const openEditForm = (col: Collection) => {
    setEditingId(col.id);
    setFormName(col.name);
    setFormSlug(col.slug);
    setFormPosition(col.position);
    setFormVisible(col.is_visible);
    setShowForm(true);
    setError("");
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    // Auto-generate slug only when creating (not editing)
    if (!editingId) {
      setFormSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Collection name is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || generateSlug(formName),
        position: formPosition,
        is_visible: formVisible,
      };

      const url = editingId
        ? `${API}/collections/${editingId}`
        : `${API}/collections`;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save collection");
        return;
      }

      await fetchCollections();
      resetForm();
    } catch (err) {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API}/collections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await fetchCollections();
      }
    } catch (err) {
      setError("Failed to delete collection");
    }
  };

  const toggleVisibility = async (col: Collection) => {
    try {
      await fetch(`${API}/collections/${col.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_visible: !col.is_visible }),
      });
      await fetchCollections();
    } catch (err) {
      setError("Failed to update visibility");
    }
  };

  const movePosition = async (col: Collection, direction: "up" | "down") => {
    const sorted = [...collections].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((c) => c.id === col.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const otherCol = sorted[swapIdx];
    try {
      await Promise.all([
        fetch(`${API}/collections/${col.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ position: otherCol.position }),
        }),
        fetch(`${API}/collections/${otherCol.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ position: col.position }),
        }),
      ]);
      await fetchCollections();
    } catch (err) {
      setError("Failed to reorder");
    }
  };

  if (loading) return <div className={styles.emptyState}>Loading collections...</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Navbar Collections</h1>
        <button className={styles.btnPrimary} onClick={openCreateForm}>
          <FiPlus /> Add Collection
        </button>
      </div>

      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Manage the navigation links shown in the gold Tier 3 bar. &quot;ALL PRODUCTS&quot; is always displayed first.
        Toggle visibility and reorder collections to control how they appear on the public site.
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{ background: "#fff", padding: "2rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #d4af37" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#1a1a2e" }}>
            {editingId ? "Edit Collection" : "New Collection"}
          </h3>
          <form onSubmit={handleSubmit}>
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
                <label>URL Slug</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated-from-name"
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
                <label>Visible in Navbar</label>
                <select
                  className={styles.formControl}
                  value={formVisible ? "yes" : "no"}
                  onChange={(e) => setFormVisible(e.target.value === "yes")}
                >
                  <option value="yes">Yes — Shown</option>
                  <option value="no">No — Hidden</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Collection" : "Create Collection"}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Table */}
      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Name</th>
              <th>Slug (URL)</th>
              <th>Visibility</th>
              <th>Reorder</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Hardcoded ALL PRODUCTS row */}
            <tr style={{ opacity: 0.6 }}>
              <td>—</td>
              <td><strong>ALL PRODUCTS</strong></td>
              <td><code>/products</code></td>
              <td><span className={`${styles.badge} ${styles.badgePublished}`}>Always Visible</span></td>
              <td>—</td>
              <td><span style={{ color: "#999", fontSize: "0.85rem" }}>Permanent</span></td>
            </tr>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No collections yet. Click &quot;Add Collection&quot; to create your first navbar link.
                </td>
              </tr>
            ) : (
              collections.map((col, idx) => (
                <tr key={col.id}>
                  <td><strong>{col.position}</strong></td>
                  <td>{col.name}</td>
                  <td><code>/{col.slug}</code></td>
                  <td>
                    <button
                      onClick={() => toggleVisibility(col)}
                      className={styles.tableBtn}
                      title={col.is_visible ? "Click to hide" : "Click to show"}
                      style={{ color: col.is_visible ? "#28a745" : "#999" }}
                    >
                      {col.is_visible ? <><FiEye /> Visible</> : <><FiEyeOff /> Hidden</>}
                    </button>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        className={styles.tableBtn}
                        onClick={() => movePosition(col, "up")}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        className={styles.tableBtn}
                        onClick={() => movePosition(col, "down")}
                        disabled={idx === collections.length - 1}
                        title="Move down"
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button className={styles.tableBtn} onClick={() => openEditForm(col)} title="Edit">
                        <FiEdit2 />
                      </button>
                      <button
                        className={`${styles.tableBtn} ${styles.tableBtnDanger}`}
                        onClick={() => handleDelete(col.id, col.name)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
