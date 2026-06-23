import React, { useEffect, useState } from 'react';
import styles from '../products.module.css';
import { Tag } from './types';
import { apiUrl } from '@/lib/cart';

interface TagSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl(`/api/admin/tags`), { credentials: "include" })
      .then(res => res.json())
      .then(data => setTags(data.tags || []))
      .catch(err => console.error("Failed to load tags", err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) return <div>Loading tags...</div>;

  return (
    <div className={styles.card} style={{ marginTop: '1rem' }}>
      <h3 className={styles.cardTitle}>Product Tags</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '1rem', background: '#f8fafc' }}>
        {tags.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No tags created yet.</p>
        ) : (
          tags.map(tag => (
            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                id={`tag-${tag.id}`}
                checked={selectedIds.includes(tag.id)}
                onChange={() => handleToggle(tag.id)}
              />
              <label htmlFor={`tag-${tag.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer', color: '#1a1a2e' }}>
                {tag.name}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
