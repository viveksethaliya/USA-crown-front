"use client";

import { useEffect, useState } from "react";
import styles from "./roles.module.css";
import { FiPlus, FiEdit2 } from "react-icons/fi";

type Permission = {
  id: string;
  code: string;
  name: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  role_permissions: { permissions: Permission }[];
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_system_role: false,
    permission_ids: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        fetch(`/api/admin/roles`),
        fetch(`/api/admin/permissions`)
      ]);
      if (resRoles.ok) setRoles(await resRoles.json());
      if (resPerms.ok) setPermissions(await resPerms.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingRoleId(null);
    setFormData({ name: "", description: "", is_system_role: false, permission_ids: [] });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      description: role.description || "",
      is_system_role: role.is_system_role,
      permission_ids: role.role_permissions.map(rp => rp.permissions?.id).filter(Boolean) as string[]
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const exists = prev.permission_ids.includes(permId);
      if (exists) {
        return { ...prev, permission_ids: prev.permission_ids.filter(id => id !== permId) };
      } else {
        return { ...prev, permission_ids: [...prev.permission_ids, permId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const url = editingRoleId ? `/api/admin/roles/${editingRoleId}` : `/api/admin/roles`;
    const method = editingRoleId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permission_ids
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save role");
      
      await fetchData();
      closeModal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Roles & Permissions</h1>
        <button className={styles.addBtn} onClick={openAddModal}>
          <FiPlus style={{ marginRight: '0.5rem' }} />
          Create Role
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign:'center', padding:'2rem'}}>Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign:'center', padding:'2rem'}}>No roles found.</td></tr>
            ) : (
              roles.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight: 600}}>{r.name}</td>
                  <td>
                    <span className={r.is_system_role ? styles.systemBadge : styles.customBadge}>
                      {r.is_system_role ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td>{r.description}</td>
                  <td>
                    <div className={styles.permList}>
                      {r.role_permissions.map(rp => (
                        <span key={rp.permissions?.id || Math.random()} className={styles.permBadge}>
                          {rp.permissions?.name || 'Unknown'}
                        </span>
                      ))}
                      {r.role_permissions.length === 0 && <span style={{color: '#999'}}>None</span>}
                    </div>
                  </td>
                  <td>
                    <button className={styles.editBtn} onClick={() => openEditModal(r)}>
                      <FiEdit2 /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingRoleId ? "Edit Role" : "Create New Role"}</h2>
            
            {errorMsg && <div className={styles.error}>{errorMsg}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Role Name *</label>
                <input 
                  required 
                  type="text" 
                  className={styles.input} 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={formData.is_system_role}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Permissions</label>
                <div className={styles.permissionsGrid}>
                  {permissions.map(p => (
                    <label key={p.id} className={styles.permCheckbox} title={p.description}>
                      <input 
                        type="checkbox" 
                        checked={formData.permission_ids.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                      {p.name}
                    </label>
                  ))}
                  {permissions.length === 0 && <span style={{color:'#666', fontSize:'0.9rem'}}>No permissions found.</span>}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
