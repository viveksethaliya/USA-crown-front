"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const API = '/api/admin';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCollections = async () => {
    try {
      const res = await fetch(`${API}/collections`, { credentials: "include" });
      const data = await res.json();
      if (data.collections) {
        setCollections(data.collections);
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollections();
  }, []);

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
    } catch (err: unknown) {
      console.error(err);
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
    } catch (err: unknown) {
      console.error(err);
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
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to reorder");
    }
  };

  if (loading) return <div className={styles.emptyState}>Loading collections...</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collections</h1>
        <Link href="/crown-admin/collections/new" className={styles.btnPrimary}>
          <FiPlus /> Add Collection
        </Link>
      </div>

      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Manage product collections and merchandising.
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

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
            {collections.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No collections yet. Click &quot;Add Collection&quot; to create your first collection.
                </td>
              </tr>
            ) : (
              collections.map((col, idx) => (
                <tr key={col.id}>
                  <td><strong>{col.position}</strong></td>
                  <td>{col.name}</td>
                  <td><code>/collections/{col.slug}</code></td>
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
                      <Link href={`/crown-admin/collections/${col.id}`} className={styles.tableBtn} title="Manage Products & Details">
                        <FiEdit2 />
                      </Link>
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
