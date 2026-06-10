"use client";

import { useEffect, useState } from "react";
import styles from "./roles.module.css";

type Permission = {
  id: string;
  code: string;
  name: string;
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
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles`);
      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Roles & Permissions</h1>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem'}}>Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem'}}>No roles found.</td></tr>
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
                        <span key={rp.permissions.id} className={styles.permBadge}>
                          {rp.permissions.name}
                        </span>
                      ))}
                      {r.role_permissions.length === 0 && <span style={{color: '#999'}}>None</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
