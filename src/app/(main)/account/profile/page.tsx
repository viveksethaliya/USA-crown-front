"use client";

import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import { FiInfo } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

interface UserProfile {
  username?: string;
  full_name?: string;
  mobile?: string;
  email?: string;
  roles?: { name: string };
}

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    email: "" // Email is generally read-only for security, but we show it
  });

  useEffect(() => {
    fetch(apiUrl('/api/account/profile'), { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then(data => {
        setProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          mobile: data.mobile || "",
          email: data.email || ""
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        window.location.href = '/login';
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(apiUrl('/api/account/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          mobile: formData.mobile,
          email: formData.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Personal Profile</h1>
        <p>Manage your basic account details.</p>
      </div>

      {profile?.roles?.name && (
        <div className={styles.alert}>
          <FiInfo /> Account Type: {profile.roles.name}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Username (Login ID)</label>
          <input type="text" className={styles.input} value={profile?.username || ''} disabled />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '15px' }}>
          <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
            <label>First Name *</label>
            <input 
              required type="text" className={styles.input} 
              value={formData.first_name} 
              onChange={e => setFormData({...formData, first_name: e.target.value})}
            />
          </div>
          <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
            <label>Last Name *</label>
            <input 
              required type="text" className={styles.input} 
              value={formData.last_name} 
              onChange={e => setFormData({...formData, last_name: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Email Address *</label>
          <input 
            required type="email" className={styles.input} 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Phone *</label>
          <input 
            required type="tel" className={styles.input} 
            value={formData.mobile} 
            onChange={e => setFormData({...formData, mobile: e.target.value})}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
