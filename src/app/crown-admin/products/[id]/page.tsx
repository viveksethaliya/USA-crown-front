"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminStyles from "../../admin.module.css";
import styles from "../products.module.css";
import { ProductData, ProductImage } from "../components/types";
import ProductTabs from "../components/ProductTabs";
import GeneralTab from "../components/GeneralTab";
import InventoryTab from "../components/InventoryTab";
import CategorySelector from "../components/CategorySelector";
import ImageUploader from "../components/ImageUploader";
import AttributesTab from "../components/AttributesTab";
import VariationsTab from "../components/VariationsTab";

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const [activeTab, setActiveTab] = useState('general');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `/api/admin/products/${productId}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data.product);
        setSelectedCategories(data.product.categories.map((c: any) => c.id));
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(productId)) {
      fetchProduct();
    }
  }, [productId]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const getFieldValue = (field: string) => {
    if (editedFields[field] !== undefined) return editedFields[field];
    return (product as any)?.[field] ?? '';
  };

  const handleCategoryChange = (ids: number[]) => {
    setSelectedCategories(ids);
    setHasChanges(true);
  };

  const handleImagesChange = (newImages: ProductImage[]) => {
    setProduct(prev => prev ? { ...prev, images: newImages } : prev);
  };

  const handleAttributesChange = (newAttrs: any[]) => {
    setProduct(prev => prev ? { ...prev, attributes: newAttrs } : prev);
    setHasChanges(true);
  };

  const handleVariationsChange = (newVars: any[]) => {
    setProduct(prev => prev ? { ...prev, variations: newVars } : prev);
    setHasChanges(true);
  };

  const handleGenerateVariations = async () => {
    try {
      const res = await fetch(`/api/admin/products/${product?.id}/variations/generate`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      window.location.reload();
    } catch (err: any) {
      alert(`Error generating variations: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
      // 1. Save general product fields if they changed
      if (Object.keys(editedFields).length > 0) {
        const res = await fetch(
          `/api/admin/products/${product.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify(editedFields)
          }
        );
        if (!res.ok) throw new Error('Failed to update core product fields');
        const data = await res.json();
        setProduct(prev => prev ? { ...prev, ...data.product } : prev);
      }

      // 2. Sync categories if they changed
      // We'll just do it every time there are changes to be safe, or we could check if selectedCategories actually changed
      const catRes = await fetch(
        `/api/admin/products/${product.id}/categories`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
          body: JSON.stringify({ categoryIds: selectedCategories })
        }
      );
      if (!catRes.ok) throw new Error('Failed to sync categories');

      // 3. Sync attributes
      const attrRes = await fetch(
        `/api/admin/products/${product.id}/attributes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
          body: JSON.stringify({ attributes: product.attributes })
        }
      );
      if (!attrRes.ok) throw new Error('Failed to sync attributes');

      // 4. Sync variations
      if (product.type === 'variable' && product.variations.length > 0) {
        const varRes = await fetch(
          `/api/admin/products/${product.id}/variations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify({ variations: product.variations })
          }
        );
        if (!varRes.ok) throw new Error('Failed to save variations');
      }

      setEditedFields({});
      setHasChanges(false);
      alert('Product saved successfully!');
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Loading product...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Product not found.</p>
        <Link href="/crown-admin/products" className={adminStyles.primaryBtn}>
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
        <div>
          <h1 className={styles.editorTitle}>{getFieldValue('name')}</h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            ID: {product.id} • {product.type === 'variable' ? 'Variable' : 'Simple'} Product
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => router.push(`/products/${product.slug}`)}
            className={styles.btnCancel}
          >
            View in Store
          </button>
          <button
            onClick={handleSave}
            className={styles.btnSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ProductTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isVariable={product.type === 'variable'} 
      />

      <div className={styles.card} style={{ borderTopLeftRadius: 0 }}>
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <GeneralTab 
              getFieldValue={getFieldValue} 
              handleFieldChange={handleFieldChange} 
            />
            <div>
              <CategorySelector 
                productId={product.id}
                selectedIds={selectedCategories}
                onChange={handleCategoryChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryTab 
            getFieldValue={getFieldValue} 
            handleFieldChange={handleFieldChange} 
          />
        )}

        {activeTab === 'images' && (
          <ImageUploader 
            productId={product.id}
            images={product.images}
            onImagesChange={handleImagesChange}
          />
        )}

        {activeTab === 'attributes' && (
          <AttributesTab 
            attributes={product.attributes}
            onChange={handleAttributesChange}
          />
        )}

        {activeTab === 'variations' && (
          <VariationsTab 
            productId={product.id}
            variations={product.variations}
            productImages={product.images}
            onChange={handleVariationsChange}
            onGenerate={handleGenerateVariations}
          />
        )}
      </div>
    </div>
  );
}
