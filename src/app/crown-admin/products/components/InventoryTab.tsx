import React from 'react';
import styles from '../products.module.css';

interface InventoryTabProps {
  getFieldValue: (field: string) => any;
  handleFieldChange: (field: string, value: string | number | boolean | null) => void;
}

export default function InventoryTab({ getFieldValue, handleFieldChange }: InventoryTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Stock Status</label>
          <select
            className={styles.fieldSelect}
            value={getFieldValue('in_stock') ? 'true' : 'false'}
            onChange={(e) => handleFieldChange('in_stock', e.target.value === 'true')}
          >
            <option value="true">In Stock</option>
            <option value="false">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={getFieldValue('manage_stock') === true}
            onChange={(e) => handleFieldChange('manage_stock', e.target.checked)}
          />
          Track stock quantity for this product
        </label>
      </div>

      {getFieldValue('manage_stock') === true && (
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Quantity</label>
            <input
              type="number"
              className={styles.fieldInput}
              value={getFieldValue('stock_qty') ?? ''}
              onChange={(e) => handleFieldChange('stock_qty', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="0"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Low Stock Threshold</label>
            <input
              type="number"
              className={styles.fieldInput}
              value={getFieldValue('low_stock_amount') ?? ''}
              onChange={(e) => handleFieldChange('low_stock_amount', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 2"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.5rem' }}>
              <input
                type="checkbox"
                checked={getFieldValue('backorders_allowed') === true}
                onChange={(e) => handleFieldChange('backorders_allowed', e.target.checked)}
              />
              Allow Backorders
            </label>
          </div>
        </div>
      )}
      {/* Sold Individually */}
      <div className={styles.fieldGroup} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={getFieldValue('sold_individually') === true}
            onChange={(e) => handleFieldChange('sold_individually', e.target.checked)}
          />
          Sold Individually (limit 1 per order)
        </label>
      </div>
    </div>
  );
}
