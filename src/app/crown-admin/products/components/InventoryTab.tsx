import React from 'react';
import styles from '../products.module.css';

interface InventoryTabProps {
  getFieldValue: (field: string) => any;
  handleFieldChange: (field: string, value: any) => void;
}

export default function InventoryTab({ getFieldValue, handleFieldChange }: InventoryTabProps) {
  return (
    <div>
      <h3 className={styles.cardTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>Inventory</h3>
      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>In Stock</label>
          <select
            className={styles.fieldSelect}
            value={getFieldValue('in_stock') ? 'true' : 'false'}
            onChange={(e) => handleFieldChange('in_stock', e.target.value === 'true')}
          >
            <option value="true">Yes, In Stock</option>
            <option value="false">No, Out of Stock</option>
          </select>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

      <h3 className={styles.cardTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>Shipping Dimensions</h3>
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
            value={getFieldValue('purchase_note') || ''}
            onChange={(e) => handleFieldChange('purchase_note', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
