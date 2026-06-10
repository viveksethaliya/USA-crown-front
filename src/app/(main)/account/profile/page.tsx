"use client";

import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import { FiInfo } from "react-icons/fi";

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
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "" // Email is generally read-only for security, but we show it
  });

  useEffect(() => {
    fetch('/api/account/profile')
      .then(r => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then(data => {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
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
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          mobile: formData.mobile,
          email: formData.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : String(err) });
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

      {msg.text && (
        <div className={msg.type === 'error' ? styles.error : styles.success}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Username (Login ID)</label>
          <input type="text" className={styles.input} value={profile.username} disabled />
        </div>

        <div className={styles.formGroup}>
          <label>Full Name *</label>
          <input 
            required type="text" className={styles.input} 
            value={formData.full_name} 
            onChange={e => setFormData({...formData, full_name: e.target.value})}
          />
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
          <label>Mobile Number *</label>
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
