"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../products.module.css";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [type, setType] = useState("simple");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, published: false }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      if (data.product && data.product.id) {
        // Redirect to the full editor page for this new product
        router.push(`/crown-admin/products/${data.product.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      setLoading(false);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <Link href="/crown-admin/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      <div className={styles.editorHeader}>
        <h1 className={styles.editorTitle}>Create New Product</h1>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.fieldGroup} style={{ marginBottom: '1.5rem' }}>
            <label className={styles.fieldLabel}>Product Name *</label>
            <input
              type="text"
              required
              className={styles.fieldInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 14K Gold Spring Ring Clasp"
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup} style={{ marginBottom: '2rem' }}>
            <label className={styles.fieldLabel}>Product Type</label>
            <select
              className={styles.fieldSelect}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="simple">Simple Product (No variations)</option>
              <option value="variable">Variable Product (Has sizes/colors)</option>
            </select>
            <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              You can change this later. Variable products allow you to set different prices and stock for variations.
            </span>
          </div>

          <button 
            type="submit" 
            className={adminStyles.primaryBtn} 
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create Draft & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
