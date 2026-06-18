"use client";

import { useEffect, useState } from "react";
import styles from "../profile/profile.module.css";
import { FiBriefcase } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function AccountCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    website: "",
    tax_id: "",
    resale_certificate_url: ""
  });

  useEffect(() => {
    fetch('/api/account/company')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setFormData({
            company_name: data.company_name || "",
            company_address: data.company_address || "",
            company_phone: data.company_phone || "",
            website: data.website || "",
            tax_id: data.tax_id || "",
            resale_certificate_url: data.resale_certificate_url || ""
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('company_name', formData.company_name);
      payload.append('company_address', formData.company_address);
      payload.append('company_phone', formData.company_phone);
      payload.append('website', formData.website);
      payload.append('tax_id', formData.tax_id);
      
      const fileInput = document.getElementById('resale_certificate') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        payload.append('resale_certificate', fileInput.files[0]);
      } else if (formData.resale_certificate_url) {
        payload.append('resale_certificate_url', formData.resale_certificate_url);
      }

      const res = await fetch('/api/account/company', {
        method: 'PUT',
        body: payload
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update company profile");
      
      toast.success("Company details updated successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading company details...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1><FiBriefcase /> Company Details</h1>
        <p>Manage your wholesale business information.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Company Name *</label>
          <input 
            required type="text" className={styles.input} 
            value={formData.company_name} 
            onChange={e => setFormData({...formData, company_name: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Company Website</label>
          <input 
            type="url" className={styles.input} 
            placeholder="https://..."
            value={formData.website} 
            onChange={e => setFormData({...formData, website: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Company Address *</label>
          <input 
            required type="text" className={styles.input} 
            value={formData.company_address} 
            onChange={e => setFormData({...formData, company_address: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Company Phone</label>
          <input 
            type="tel" className={styles.input} 
            value={formData.company_phone} 
            onChange={e => setFormData({...formData, company_phone: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Tax ID / EIN</label>
          <input 
            type="text" className={styles.input} 
            value={formData.tax_id} 
            onChange={e => setFormData({...formData, tax_id: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Resale Certificate (PDF) *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="file" 
              id="resale_certificate"
              className={styles.input} 
              accept="application/pdf"
              required={!formData.resale_certificate_url}
            />
            {formData.resale_certificate_url && (
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Current Certificate: <a href={formData.resale_certificate_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>View PDF</a>
                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem' }}>Upload a new file above to replace the current certificate.</span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
