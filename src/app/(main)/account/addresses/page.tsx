"use client";

import { useEffect, useState } from "react";
import styles from "./addresses.module.css";
import profileStyles from "../profile/profile.module.css";
import { FiPlus } from "react-icons/fi";

interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const emptyForm = {
    first_name: "", last_name: "", company_name: "",
    address_line1: "", address_line2: "",
    city: "", state: "", postal_code: "", country: "US",
    phone: "",
    is_default_shipping: false, is_default_billing: false
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) setAddresses(await res.json());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/account/addresses/${editId}` : '/api/account/addresses';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to save address");
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      alert("Error saving address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setEditId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id || null);
    setFormData({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      company_name: addr.company_name || "",
      address_line1: addr.address_line1 || "",
      address_line2: addr.address_line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: addr.postal_code || "",
      country: addr.country || "US",
      phone: addr.phone || "",
      is_default_shipping: addr.is_default_shipping || false,
      is_default_billing: addr.is_default_billing || false
    });
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading addresses...</div>;

  return (
    <div>
      <div className={profileStyles.header}>
        <h1>Addresses</h1>
        <p>Manage your shipping and billing addresses.</p>
      </div>

      <div className={styles.grid}>
        {addresses.map(a => (
          <div key={a.id} className={styles.card}>
            {a.is_default_shipping && <span className={styles.defaultBadge}>Default Shipping</span>}
            {a.is_default_billing && <span className={styles.defaultBadge} style={{top: a.is_default_shipping ? 15 : -10}}>Default Billing</span>}
            
            <h3>{a.first_name} {a.last_name}</h3>
            {a.company_name && <p>{a.company_name}</p>}
            <p>{a.address_line1}</p>
            {a.address_line2 && <p>{a.address_line2}</p>}
            <p>{a.city}, {a.state} {a.postal_code}</p>
            <p>{a.country}</p>
            <p>Phone: {a.phone}</p>

            <div className={styles.actions}>
              <button onClick={() => openEdit(a)} className={styles.actionBtn}>Edit</button>
              <button onClick={() => a.id && handleDelete(a.id)} className={`${styles.actionBtn} ${styles.delete}`}>Delete</button>
            </div>
          </div>
        ))}
        
        <button className={styles.addBtn} onClick={openNew}>
          <FiPlus size={24} />
          <span>Add New Address</span>
        </button>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editId ? 'Edit Address' : 'New Address'}</h2>
            <form onSubmit={handleSubmit} className={styles.formGrid}>
              <div className={profileStyles.formGroup}>
                <label>First Name *</label>
                <input required type="text" className={profileStyles.input} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className={profileStyles.formGroup}>
                <label>Last Name *</label>
                <input required type="text" className={profileStyles.input} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className={`${profileStyles.formGroup} ${styles.fullWidth}`}>
                <label>Address Line 1 *</label>
                <input required type="text" className={profileStyles.input} value={formData.address_line1} onChange={e => setFormData({...formData, address_line1: e.target.value})} />
              </div>
              <div className={`${profileStyles.formGroup} ${styles.fullWidth}`}>
                <label>Address Line 2 (Optional)</label>
                <input type="text" className={profileStyles.input} value={formData.address_line2} onChange={e => setFormData({...formData, address_line2: e.target.value})} />
              </div>
              <div className={profileStyles.formGroup}>
                <label>City *</label>
                <input required type="text" className={profileStyles.input} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className={profileStyles.formGroup}>
                <label>State / Province *</label>
                <input required type="text" className={profileStyles.input} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div className={profileStyles.formGroup}>
                <label>Postal Code *</label>
                <input required type="text" className={profileStyles.input} value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} />
              </div>
              <div className={profileStyles.formGroup}>
                <label>Phone</label>
                <input type="text" className={profileStyles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div className={styles.fullWidth}>
                <label className={styles.checkbox}>
                  <input type="checkbox" checked={formData.is_default_shipping} onChange={e => setFormData({...formData, is_default_shipping: e.target.checked})} />
                  Set as Default Shipping
                </label>
                <label className={styles.checkbox}>
                  <input type="checkbox" checked={formData.is_default_billing} onChange={e => setFormData({...formData, is_default_billing: e.target.checked})} />
                  Set as Default Billing
                </label>
              </div>

              <div className={styles.fullWidth} style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button type="submit" disabled={saving} className={profileStyles.submitBtn}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={profileStyles.input} style={{width: 'auto'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
