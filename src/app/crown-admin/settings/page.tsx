'use client';

import { useState, useEffect } from 'react';
import styles from './settings.module.css';
import { apiUrl } from '@/lib/cart';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    metal_price_gold: '',
    metal_price_silver: '',
    metal_price_platinum: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          metal_price_gold: data.metal_price_gold || '',
          metal_price_silver: data.metal_price_silver || '',
          metal_price_platinum: data.metal_price_platinum || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
      } else {
        const err = await res.json();
        setMessage({ text: err.error || 'Failed to update settings', type: 'error' });
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  if (loading) return <div className={styles.loading}>Loading Settings...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Store Settings</h1>
      </div>

      {message.text && (
        <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Global Metal Prices (Base Market Value)</h2>
          <p className={styles.sectionDesc}>These values are used across the store to calculate custom sized items (e.g., chains by the inch).</p>
          
          <div className={styles.gridContainer}>
            <div className={styles.inputGroup}>
              <label>Gold 14k Price (per oz or unit)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  name="metal_price_gold"
                  value={formData.metal_price_gold}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Silver .925 Price (per oz or unit)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  name="metal_price_silver"
                  value={formData.metal_price_silver}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Platinum Price (per oz or unit)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  name="metal_price_platinum"
                  value={formData.metal_price_platinum}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
                />
              </div>
            </div>
          </div>
        </div>



        <div className={styles.formActions}>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
