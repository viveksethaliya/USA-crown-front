import React, { useState } from 'react';
import styles from '../products.module.css';
import { Variation, ProductImage } from './types';

interface VariationsTabProps {
  productId: number;
  variations: Variation[];
  productImages: ProductImage[];
  onChange: (vars: Variation[]) => void;
  onGenerate: () => Promise<void>;
}

export default function VariationsTab({ productId, variations, productImages, onChange, onGenerate }: VariationsTabProps) {
  const [generating, setGenerating] = useState(false);
  const [uploadingVarId, setUploadingVarId] = useState<number | null>(null);
  const [expandedVarId, setExpandedVarId] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!window.confirm("This will link all variation attributes and generate permutations. Are you sure?")) return;
    setGenerating(true);
    await onGenerate();
    setGenerating(false);
  };

  const handleImageSelect = async (varId: number, imageUrl: string) => {
    if (!imageUrl) return;
    setUploadingVarId(varId);
    
    try {
      const res = await fetch(`/api/admin/products/variations/${varId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local variation with new image
      onChange(variations.map(v => v.id === varId ? { ...v, image: data.image } : v));
    } catch (err) {
      console.error(err);
      alert('Failed to link variation image');
    } finally {
      setUploadingVarId(null);
    }
  };

  const handleDelete = async (varId: number) => {
    if (!window.confirm("Delete this variation?")) return;
    
    try {
      const res = await fetch(`/api/admin/products/variations/${varId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        onChange(variations.filter(v => v.id !== varId));
      } else {
        alert("Failed to delete variation");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting variation");
    }
  };

  const updateVariation = (varId: number, field: keyof Variation, value: any) => {
    onChange(variations.map(v => v.id === varId ? { ...v, [field]: value } : v));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1a2e' }}>Manage Variations</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
            Before generating, ensure your attributes are marked as "Used for variations" and saved.
          </p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: '0.65rem 1.5rem', background: '#1a1a2e', color: '#d4af37', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {generating ? 'Generating...' : 'Generate Variations'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {variations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', background: '#f8fafc' }}>
            No variations created yet.
          </div>
        ) : (
          variations.map((v, index) => {
            const isExpanded = expandedVarId === v.id;
            const title = v.attributes.map(a => a.value).join(' - ') || `Variation #${index + 1}`;
            
            return (
              <div key={v.id} style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff' }}
                  onClick={() => setExpandedVarId(isExpanded ? null : v.id)}
                >
                  <div style={{ fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ display: 'inline-block', width: '20px', textAlign: 'center', color: '#94a3b8' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {v.image && (
                      <img src={v.image.url} alt="thumbnail" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 2 }} />
                    )}
                    #{v.id} — {title}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>{v.sku ? `SKU: ${v.sku}` : 'No SKU'}</span>
                    <span>{v.regular_price ? `$${v.regular_price}` : 'No Price'}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <div className={styles.fieldGrid}>
                      <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                        <label className={styles.fieldLabel}>Variation Image</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {v.image ? (
                            <div style={{ width: 80, height: 80, border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <img src={v.image.url} alt="Variation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div style={{ width: 80, height: 80, border: '1px dashed #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                              No img
                            </div>
                          )}
                          <select 
                            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.85rem', width: '250px' }}
                            value={v.image ? v.image.url : ''}
                            onChange={(e) => handleImageSelect(v.id, e.target.value)}
                            disabled={uploadingVarId === v.id}
                          >
                            <option value="">Select Existing Image...</option>
                            {productImages.map((img, i) => {
                              const filename = img.url.split('/').pop() || `Image ${i + 1}`;
                              return (
                                <option key={img.id || i} value={img.url}>
                                  {filename}
                                </option>
                              );
                            })}
                          </select>
                          {uploadingVarId === v.id && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Linking...</span>}
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>SKU</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={v.sku || ''}
                          onChange={(e) => updateVariation(v.id, 'sku', e.target.value)}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Regular Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.fieldInput}
                          value={v.regular_price ?? ''}
                          onChange={(e) => updateVariation(v.id, 'regular_price', e.target.value)}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Sale Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.fieldInput}
                          value={v.sale_price ?? ''}
                          onChange={(e) => updateVariation(v.id, 'sale_price', e.target.value)}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Weight (grams)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.fieldInput}
                          value={v.weight_g ?? ''}
                          onChange={(e) => updateVariation(v.id, 'weight_g', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
