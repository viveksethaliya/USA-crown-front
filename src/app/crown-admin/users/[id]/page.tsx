"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./user-detail.module.css";
import { FiArrowLeft } from "react-icons/fi";

export default function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [groups, setGroups] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    username: "",
    role_id: "",
    customer_group_id: "",
    is_active: true
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${params.id}`).then(r => r.json()),
      fetch('/api/admin/roles').then(r => r.json()),
      fetch('/api/admin/customer-groups').then(r => r.json())
    ]).then(([userData, rolesData]) => {
      setUser(userData);
      setRoles(rolesData || []);
      setGroups(arguments[0][2] || []); // the third promise result
      if (userData) {
        setFormData({
          full_name: userData.full_name || "",
          mobile: userData.mobile || "",
          username: userData.username || "",
          role_id: userData.role_id || "",
          customer_group_id: userData.customer_group_id || "",
          is_active: userData.is_active
        });
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setMsg({ type: "error", text: "Failed to load user data." });
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          mobile: formData.mobile,
          username: formData.username,
          role_id: formData.role_id,
          customer_group_id: formData.customer_group_id || null,
          is_active: !!formData.is_active
        })
      });
      if (!res.ok) throw new Error("Failed to update user");
      setMsg({ type: "success", text: "User updated successfully." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  
  const handleSendReset = async () => {
    try {
      const res = await fetch(`/api/admin/users/${params.id}/send-reset-email`, { method: 'POST' });
      if (res.ok) {
        setMsg({ type: "success", text: "Password reset link sent to user." });
      } else {
        setMsg({ type: "error", text: "Failed to send reset link." });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' });
      setFormData(prev => ({ ...prev, is_active: false }));
      setMsg({ type: "success", text: "User deactivated." });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!user) return <div className={styles.container}>User not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/crown-admin/users" className={styles.backBtn}><FiArrowLeft /></Link>
          <h1>Edit User: {user.email}</h1>
        </div>
        
        <button onClick={handleSendReset} className={styles.submitBtn} style={{ background: '#4b5563', marginRight: '1rem' }} type="button">
          Send Password Reset
        </button>
        <button onClick={handleDeactivate} className={styles.deleteBtn}>

          Deactivate User
        </button>
      </div>

      {msg.text && (
        <div className={msg.type === 'error' ? styles.error : styles.success}>
          {msg.text}
        </div>
      )}

      <div className={styles.card}>
        <h2>Profile Details</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                required type="text" className={styles.input} 
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Username</label>
              <input 
                required type="text" className={styles.input} 
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile</label>
              <input 
                required type="tel" className={styles.input} 
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Role</label>
              <select 
                required className={styles.input} 
                value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}
              >
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Customer Group</label>
              <select 
                className={styles.input} 
                value={formData.customer_group_id} onChange={e => setFormData({...formData, customer_group_id: e.target.value})}
              >
                <option value="">None</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select 
                className={styles.input} 
                value={formData.is_active ? 'true' : 'false'} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.card}>
          <h2>Addresses</h2>
          <ul className={styles.list}>
            {user.user_addresses?.length === 0 && <p>No addresses found.</p>}
            {user.user_addresses?.map((a: any) => (
              <li key={a.id} className={styles.listItem}>
                <h4>{a.first_name} {a.last_name}</h4>
                <p>{a.address_line1} {a.address_line2}</p>
                <p>{a.city}, {a.state} {a.postal_code}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h2>Company Profile</h2>
          {user.company_profiles ? (
            <div className={styles.listItem}>
              <h4>{user.company_profiles.company_name}</h4>
              <p>Tax ID: {user.company_profiles.tax_id || 'N/A'}</p>
              <p>Industry: {user.company_profiles.industry || 'N/A'}</p>
            </div>
          ) : (
            <p>No company profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
