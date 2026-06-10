import React from 'react';
import styles from '../products.module.css';

interface ShippingTabProps {
  getFieldValue: (field: string) => unknown;
  handleFieldChange: (field: string, value: unknown) => void;
}

export default function ShippingTab({ getFieldValue, handleFieldChange }: ShippingTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label className={styles.fieldLabel}>Weight (g)</label>
        <input
          type="number"
          step="0.1"
          className={styles.fieldInput}
          value={getFieldValue('weight_g')}
          onChange={(e) => handleFieldChange('weight_g', e.target.value)}
          placeholder="e.g. 50"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label className={styles.fieldLabel}>Length (in)</label>
          <input
            type="number"
            step="0.1"
            className={styles.fieldInput}
            value={getFieldValue('length_in')}
            onChange={(e) => handleFieldChange('length_in', e.target.value)}
            placeholder="Length"
          />
        </div>
        <div>
          <label className={styles.fieldLabel}>Width (in)</label>
          <input
            type="number"
            step="0.1"
            className={styles.fieldInput}
            value={getFieldValue('width_in')}
            onChange={(e) => handleFieldChange('width_in', e.target.value)}
            placeholder="Width"
          />
        </div>
        <div>
          <label className={styles.fieldLabel}>Height (in)</label>
          <input
            type="number"
            step="0.1"
            className={styles.fieldInput}
            value={getFieldValue('height_in')}
            onChange={(e) => handleFieldChange('height_in', e.target.value)}
            placeholder="Height"
          />
        </div>
      </div>

      <div>
        <label className={styles.fieldLabel}>Shipping Class</label>
        <select
          className={styles.fieldInput}
          value={getFieldValue('shipping_class')}
          onChange={(e) => handleFieldChange('shipping_class', e.target.value)}
        >
          <option value="">No shipping class</option>
          <option value="heavy">Heavy</option>
          <option value="fragile">Fragile</option>
        </select>
      </div>
    </div>
  );
}
