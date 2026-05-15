"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../products.module.css";

interface Variation {
  id: number;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  weight_g: number | null;
  position: number;
  attributes: { attribute_id: number; name: string; slug: string; value: string }[];
}

interface ProductAttribute {
  id: number;
  attribute_id: number;
  name: string;
  slug: string;
  values: string;
  is_visible: boolean;
  is_for_variation: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
  alt_text: string | null;
  product_id: number | null;
  variation_id: number | null;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  published: boolean;
  is_featured: boolean;
  visibility: string;
  short_description: string;
  description: string;
  tax_status: string;
  tax_class: string;
  weight_g: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  allow_reviews: boolean;
  purchase_note: string;
  position: number;
  created_at: string;
  updated_at: string;
  attributes: ProductAttribute[];
  variations: Variation[];
  categories: Category[];
  images: ProductImage[];
}

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const getFieldValue = (field: string) => {
    if (editedFields[field] !== undefined) return editedFields[field];
    return (product as any)?.[field] ?? '';
  };

  const handleSave = async () => {
    if (!hasChanges || !product) return;
    setSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${product.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
          body: JSON.stringify(editedFields)
        }
      );

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setProduct(prev => prev ? { ...prev, ...data.product } : prev);
      setEditedFields({});
      setHasChanges(false);
      alert('Product updated successfully!');
    } catch (err) {
      alert('Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedFields({});
    setHasChanges(false);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading product...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Product not found.</p>
        <Link href="/crown-admin/products" className={adminStyles.btnPrimary}>
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <Link href="/crown-admin/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      <div className={styles.editorHeader}>
        <h1 className={styles.editorTitle}>{product.name}</h1>
        <div className={styles.headerActions}>
          {hasChanges && (
            <button onClick={handleCancel} className={styles.btnCancel}>
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className={styles.btnSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ─── Basic Information ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Basic Information</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Product Name</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={getFieldValue('name')}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>SKU</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={getFieldValue('sku')}
              onChange={(e) => handleFieldChange('sku', e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Slug (URL)</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={getFieldValue('slug')}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Type</label>
            <select
              className={styles.fieldSelect}
              value={getFieldValue('type')}
              onChange={(e) => handleFieldChange('type', e.target.value)}
            >
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
            </select>
          </div>
          <div className={`${styles.fieldGroup} ${styles.full}`}>
            <label className={styles.fieldLabel}>Short Description</label>
            <textarea
              className={styles.fieldTextarea}
              value={getFieldValue('short_description')}
              onChange={(e) => handleFieldChange('short_description', e.target.value)}
              rows={2}
            />
          </div>
          <div className={`${styles.fieldGroup} ${styles.full}`}>
            <label className={styles.fieldLabel}>Full Description</label>
            <textarea
              className={styles.fieldTextarea}
              value={getFieldValue('description')}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* ─── Publishing & Visibility ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Publishing &amp; Visibility</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Published</label>
            <select
              className={styles.fieldSelect}
              value={getFieldValue('published') ? 'true' : 'false'}
              onChange={(e) => handleFieldChange('published', e.target.value === 'true')}
            >
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Visibility</label>
            <select
              className={styles.fieldSelect}
              value={getFieldValue('visibility')}
              onChange={(e) => handleFieldChange('visibility', e.target.value)}
            >
              <option value="visible">Visible</option>
              <option value="catalog">Catalog Only</option>
              <option value="search">Search Only</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Featured</label>
            <select
              className={styles.fieldSelect}
              value={getFieldValue('is_featured') ? 'true' : 'false'}
              onChange={(e) => handleFieldChange('is_featured', e.target.value === 'true')}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Position / Sort Order</label>
            <input
              type="number"
              className={styles.fieldInput}
              value={getFieldValue('position')}
              onChange={(e) => handleFieldChange('position', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* ─── Dimensions & Shipping ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Shipping &amp; Dimensions</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Weight (grams)</label>
            <input
              type="number"
              step="0.01"
              className={styles.fieldInput}
              value={getFieldValue('weight_g') ?? ''}
              onChange={(e) => handleFieldChange('weight_g', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Length (inches)</label>
            <input
              type="number"
              step="0.01"
              className={styles.fieldInput}
              value={getFieldValue('length_in') ?? ''}
              onChange={(e) => handleFieldChange('length_in', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Width (inches)</label>
            <input
              type="number"
              step="0.01"
              className={styles.fieldInput}
              value={getFieldValue('width_in') ?? ''}
              onChange={(e) => handleFieldChange('width_in', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Height (inches)</label>
            <input
              type="number"
              step="0.01"
              className={styles.fieldInput}
              value={getFieldValue('height_in') ?? ''}
              onChange={(e) => handleFieldChange('height_in', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Tax Status</label>
            <select
              className={styles.fieldSelect}
              value={getFieldValue('tax_status')}
              onChange={(e) => handleFieldChange('tax_status', e.target.value)}
            >
              <option value="taxable">Taxable</option>
              <option value="shipping">Shipping Only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Purchase Note</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={getFieldValue('purchase_note')}
              onChange={(e) => handleFieldChange('purchase_note', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── Categories ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Categories</h3>
        {product.categories.length > 0 ? (
          <div className={styles.catList}>
            {product.categories.map(cat => (
              <span key={cat.id} className={styles.catPill}>{cat.name}</span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No categories assigned</p>
        )}
      </div>

      {/* ─── Attributes ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Attributes</h3>
        {product.attributes.length > 0 ? (
          product.attributes.map((attr, idx) => (
            <div key={idx} className={styles.attrRow}>
              <span className={styles.attrName}>{attr.name}</span>
              <div className={styles.attrValues}>
                {attr.values.split(',').map((v, i) => (
                  <span key={i} className={styles.attrPill}>{v.trim()}</span>
                ))}
              </div>
              {attr.is_for_variation && (
                <span style={{ fontSize: '0.75rem', color: '#d4af37', marginLeft: 'auto' }}>
                  ★ Used for Variations
                </span>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No attributes defined</p>
        )}
      </div>

      {/* ─── Variations ─── */}
      {product.variations.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Variations ({product.variations.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.varTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  {/* Dynamic attribute columns */}
                  {product.variations[0]?.attributes.map((a, i) => (
                    <th key={i}>{a.name}</th>
                  ))}
                  <th>Price</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {product.variations.map((v, idx) => (
                  <tr key={v.id}>
                    <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {v.sku || '—'}
                    </td>
                    {v.attributes.map((a, i) => (
                      <td key={i}>
                        <span className={styles.attrPill}>{a.value}</span>
                      </td>
                    ))}
                    <td>
                      {v.regular_price
                        ? `$${Number(v.regular_price).toFixed(2)}`
                        : '—'
                      }
                      {v.sale_price && (
                        <span style={{ color: '#22c55e', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                          Sale: ${Number(v.sale_price).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td>{v.weight_g ? `${v.weight_g}g` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Images ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Images ({product.images.length})</h3>
        {product.images.length > 0 ? (
          <div className={styles.imageGrid}>
            {product.images.map((img, idx) => (
              <div key={idx} className={styles.imageThumb}>
                <img src={img.url} alt={img.alt_text || product.name} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No images uploaded</p>
        )}
      </div>

      {/* ─── Meta Info ─── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>System Info</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Product ID</label>
            <div className={styles.fieldReadonly}>{product.id}</div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Created</label>
            <div className={styles.fieldReadonly}>
              {new Date(product.created_at).toLocaleString()}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Last Updated</label>
            <div className={styles.fieldReadonly}>
              {new Date(product.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
