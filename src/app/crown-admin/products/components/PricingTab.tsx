import React from 'react';
import styles from '../products.module.css';

interface PricingTabProps {
  getFieldValue: (field: string) => unknown;
  handleFieldChange: (field: string, value: unknown) => void;
}

export default function PricingTab({ getFieldValue, handleFieldChange }: PricingTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label className={styles.fieldLabel}>Regular Price ($)</label>
          <input
            type="number"
            step="0.01"
            className={styles.fieldInput}
            value={getFieldValue('regular_price')}
            onChange={(e) => handleFieldChange('regular_price', e.target.value)}
            placeholder="e.g. 29.99"
          />
        </div>
        <div>
          <label className={styles.fieldLabel}>Sale Price ($)</label>
          <input
            type="number"
            step="0.01"
            className={styles.fieldInput}
            value={getFieldValue('sale_price')}
            onChange={(e) => handleFieldChange('sale_price', e.target.value)}
            placeholder="e.g. 19.99"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label className={styles.fieldLabel}>Sale Start Date</label>
          <input
            type="date"
            className={styles.fieldInput}
            value={getFieldValue('date_sale_starts') || ''}
            onChange={(e) => handleFieldChange('date_sale_starts', e.target.value)}
          />
        </div>
        <div>
          <label className={styles.fieldLabel}>Sale End Date</label>
          <input
            type="date"
            className={styles.fieldInput}
            value={getFieldValue('date_sale_ends') || ''}
            onChange={(e) => handleFieldChange('date_sale_ends', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
