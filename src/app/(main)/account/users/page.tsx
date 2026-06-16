"use client";

import { useEffect, useState } from "react";
import styles from "../addresses/addresses.module.css"; // Reuse modal and grid styles
import profileStyles from "../profile/profile.module.css";
import { FiPlus, FiUser } from "react-icons/fi";

interface User {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  username: string;
  is_active: boolean;
  roles?: { id: string, name: string };
  user_permissions?: { permission_id: string }[];
}

export default function AccountUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [permissions, setPermissions] = useState<{id: string, code: string, name: string}[]>([]);

  const emptyForm = { full_name: "", email: "", mobile: "", password: "", is_active: true, role_id: "", permission_ids: [] as string[] };
  const [formData, setFormData] = useState(emptyForm);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/account/users');
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/account/roles').then(r => r.json()).then(data => setRoles(data || []));
    fetch('/api/account/permissions').then(r => r.json()).then(data => setPermissions(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/account/users/${editId}` : '/api/account/users';
      
      const payload: Record<string, any> = {
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        role_id: formData.role_id,
        permission_ids: formData.permission_ids,
        is_active: formData.is_active
      };
      if (formData.password) {
        if (editId) payload.new_password = formData.password;
        else payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save user");
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error saving sub-user");
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setFormData({
      full_name: u.full_name,
      email: u.email,
      mobile: u.mobile,
      is_active: u.is_active,
      password: "",
      role_id: u.roles?.id || "",
      permission_ids: (u.user_permissions || []).map(p => p.permission_id)
    });
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading sub-users...</div>;

  return (
    <div>
      <div className={profileStyles.header}>
        <h1>Sub-Users</h1>
        <p>Manage employees or staff who can access your account.</p>
      </div>

      <div className={styles.grid}>
        {users.map(u => (
          <div key={u.id} className={styles.card}>
            <span className={styles.defaultBadge} style={{background: u.is_active ? '#2e7d32' : '#c62828'}}>
              {u.is_active ? 'Active' : 'Disabled'}
            </span>
            <h3 style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <FiUser /> {u.full_name}
            </h3>
            <p>Username: {u.username}</p>
            <p>Email: {u.email}</p>
            <p>Role: {u.roles?.name || 'Sub User'}</p>

            <div className={styles.actions}>
              <button onClick={() => openEdit(u)} className={styles.actionBtn}>Manage Access</button>
            </div>
          </div>
        ))}
        
        <button className={styles.addBtn} onClick={openNew}>
          <FiPlus size={24} />
          <span>Add New Sub-User</span>
        </button>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editId ? 'Manage Sub-User' : 'Add Sub-User'}</h2>
            <form onSubmit={handleSubmit} className={styles.formGrid}>
              
              {!editId && (
                <>
                  <div className={styles.fullWidth}>
                    <label className={profileStyles.label}>Full Name *</label>
                    <input required type="text" className={profileStyles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div className={profileStyles.formGroup}>
                    <label>Email *</label>
                    <input required type="email" className={profileStyles.input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editId} />
                  </div>
                  <div className={profileStyles.formGroup}>
                    <label>Mobile *</label>
                    <input required type="tel" className={profileStyles.input} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  </div>
                </>
              )}

              {editId && (
                <div className={styles.fullWidth}>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    Allow this user to log in
                  </label>
                </div>
              )}



              <div className={styles.fullWidth}>
                <label className={profileStyles.label}>{editId ? 'Reset Password (Optional)' : 'Initial Password *'}</label>
                <input required={!editId} type="password" placeholder="Minimum 6 characters" className={profileStyles.input} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
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
