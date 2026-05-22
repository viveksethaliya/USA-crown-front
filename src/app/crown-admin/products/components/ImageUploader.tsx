import React, { useRef, useState } from 'react';
import styles from '../products.module.css';
import { ProductImage } from './types';

interface ImageUploaderProps {
  productId: number;
  images: ProductImage[];
  onImagesChange: (newImages: ProductImage[]) => void;
}

export default function ImageUploader({ productId, images, onImagesChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('images', e.target.files[i]);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload images');
      
      // Since our POST endpoint just returns urls but doesn't return full image objects with IDs,
      // it's best to trigger a full re-fetch of the product from the parent. 
      // For now, we'll just reload the page to ensure data consistency, or the parent can pass a reload function.
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Error uploading images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!window.confirm("Delete this image?")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        onImagesChange(images.filter(img => img.id !== imageId));
      } else {
        alert("Failed to delete image");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting image");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '0.65rem 1.5rem', background: '#1a1a2e', color: '#d4af37', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>JPG, PNG, WEBP. Max 5MB per file.</span>
      </div>

      {images.length > 0 ? (
        <div className={styles.imageGrid}>
          {images.map((img) => (
            <div key={img.id} className={styles.imageThumb} style={{ position: 'relative' }}>
              <img src={img.url} alt={img.alt_text || 'Product image'} />
              <button 
                onClick={() => handleDelete(img.id)}
                style={{ 
                  position: 'absolute', top: 4, right: 4, 
                  background: 'rgba(239, 68, 68, 0.9)', color: '#fff', 
                  border: 'none', borderRadius: '50%', width: 24, height: 24, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px'
                }}
                title="Delete image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '3rem', border: '2px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
          No images uploaded for this product.
        </div>
      )}
    </div>
  );
}
