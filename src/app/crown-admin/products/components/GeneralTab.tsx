import React from 'react';
import styles from '../products.module.css';

interface GeneralTabProps {
  getFieldValue: (field: string) => any;
  handleFieldChange: (field: string, value: any) => void;
}

export default function GeneralTab({ getFieldValue, handleFieldChange }: GeneralTabProps) {
  return (
    <div>
      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Product Name *</label>
          <input
            type="text"
            className={styles.fieldInput}
            value={getFieldValue('name')}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            required
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
          <label className={styles.fieldLabel}>Slug (URL Friendly)</label>
          <input
            type="text"
            className={styles.fieldInput}
            value={getFieldValue('slug')}
            onChange={(e) => handleFieldChange('slug', e.target.value)}
          />
        </div>
        
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Product Type</label>
          <select
            className={styles.fieldSelect}
            value={getFieldValue('type')}
            onChange={(e) => handleFieldChange('type', e.target.value)}
          >
            <option value="simple">Simple Product</option>
            <option value="variable">Variable Product</option>
          </select>
        </div>
        
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Status</label>
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
          <label className={styles.fieldLabel}>Measurement Type</label>
          <select
            className={styles.fieldSelect}
            value={getFieldValue('measurement_type') || 'none'}
            onChange={(e) => handleFieldChange('measurement_type', e.target.value)}
          >
            <option value="none">Standard (None)</option>
            <option value="inch">Custom Length (Chain/Wire)</option>
            <option value="plate">Custom Dimensions (Plate LxW)</option>
          </select>
        </div>

        <div className={`${styles.fieldGroup} ${styles.full}`}>
          <label className={styles.fieldLabel}>Short Description</label>
          <textarea
            className={styles.fieldTextarea}
            value={getFieldValue('short_description') || ''}
            onChange={(e) => handleFieldChange('short_description', e.target.value)}
            rows={2}
          />
        </div>
        
        <div className={`${styles.fieldGroup} ${styles.full}`}>
          <label className={styles.fieldLabel}>Full Description</label>
          <textarea
            className={styles.fieldTextarea}
            value={getFieldValue('description') || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={5}
          />
        </div>
      </div>
    </div>
  );
}
