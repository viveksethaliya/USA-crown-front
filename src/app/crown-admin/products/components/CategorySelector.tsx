import React, { useEffect, useState } from 'react';
import styles from '../products.module.css';
import { Category } from './types';

interface CategorySelectorProps {
  productId: number;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function CategorySelector({ productId, selectedIds, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error("Failed to load categories", err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Product Categories</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '1rem', background: '#f8fafc' }}>
        {categories.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No categories created yet.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                id={`cat-${cat.id}`}
                checked={selectedIds.includes(cat.id)}
                onChange={() => handleToggle(cat.id)}
              />
              <label htmlFor={`cat-${cat.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer', color: '#1a1a2e' }}>
                {cat.name}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
