"use client";

import { useEffect, useState } from "react";
import styles from "../profile/profile.module.css";
import { FiBriefcase } from "react-icons/fi";

export default function AccountCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch('/api/account/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update company profile");
      
      setMsg({ type: "success", text: "Company details updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : String(err) });
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

      {msg.text && (
        <div className={msg.type === 'error' ? styles.error : styles.success}>
          {msg.text}
        </div>
      )}

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
          <label>Resale Certificate Link (Optional)</label>
          <input 
            type="url" className={styles.input} 
            placeholder="https://..."
            value={formData.resale_certificate_url} 
            onChange={e => setFormData({...formData, resale_certificate_url: e.target.value})}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
