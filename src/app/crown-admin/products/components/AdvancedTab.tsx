import React from 'react';
import styles from '../products.module.css';

interface AdvancedTabProps {
  getFieldValue: (field: string) => any;
  handleFieldChange: (field: string, value: string | number | boolean | null) => void;
}

export default function AdvancedTab({ getFieldValue, handleFieldChange }: AdvancedTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label className={styles.fieldLabel}>Purchase Note</label>
        <textarea
          className={styles.fieldInput}
          value={getFieldValue('purchase_note')}
          onChange={(e) => handleFieldChange('purchase_note', e.target.value)}
          placeholder="Optional note to send the customer after purchase..."
          rows={3}
        />
      </div>

      <div>
        <label className={styles.fieldLabel}>Menu Order</label>
        <input
          type="number"
          className={styles.fieldInput}
          value={getFieldValue('position')}
          onChange={(e) => handleFieldChange('position', parseInt(e.target.value) || 0)}
          placeholder="0"
        />
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
          Custom ordering position.
        </p>
      </div>

      <div>
        <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={getFieldValue('allow_reviews') === true}
            onChange={(e) => handleFieldChange('allow_reviews', e.target.checked)}
          />
          Enable Reviews
        </label>
      </div>
    </div>
  );
}
