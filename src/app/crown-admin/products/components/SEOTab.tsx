import React from 'react';
import styles from '../products.module.css';

interface SEOTabProps {
  getFieldValue: (field: string) => unknown;
  handleFieldChange: (field: string, value: unknown) => void;
}

export default function SEOTab({ getFieldValue, handleFieldChange }: SEOTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label className={styles.fieldLabel}>Meta Title</label>
        <input
          type="text"
          className={styles.fieldInput}
          value={getFieldValue('meta_title')}
          onChange={(e) => handleFieldChange('meta_title', e.target.value)}
          placeholder="SEO Page Title"
        />
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
          Leave blank to use the product name.
        </p>
      </div>

      <div>
        <label className={styles.fieldLabel}>Meta Description</label>
        <textarea
          className={styles.fieldInput}
          value={getFieldValue('meta_description')}
          onChange={(e) => handleFieldChange('meta_description', e.target.value)}
          placeholder="A short description of the product for search engines..."
          rows={3}
        />
      </div>
    </div>
  );
}
