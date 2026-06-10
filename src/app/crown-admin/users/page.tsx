"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./users.module.css";
import { format } from "date-fns";

type Role = { name: string };
type User = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  is_active: boolean;
  created_at: string;
  roles: Role | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Options
  const [rolesList, setRolesList] = useState<{id: string, name: string}[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(roleId && { role_id: roleId }),
        ...(isActive && { is_active: isActive }),
      });
      const res = await fetch(`/api/admin/users?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        setRolesList(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleId, isActive, page]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Users</h1>
        <Link href="/crown-admin/users/new" className={styles.createBtn}>
          + New User
        </Link>
      </div>

      <div className={styles.filters}>
        <input 
          type="text" 
          placeholder="Search by name, email, username..." 
          className={styles.searchBar}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select 
          className={styles.filterSelect}
          value={roleId}
          onChange={e => { setRoleId(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          {rolesList.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select 
          className={styles.filterSelect}
          value={isActive}
          onChange={e => { setIsActive(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem'}}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem'}}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={styles.roleBadge}>{u.roles?.name || 'None'}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${u.is_active ? styles.statusActive : styles.statusInactive}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                  <td>
                    <Link href={`/crown-admin/users/${u.id}`} className={styles.actionLink}>Edit</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button 
          className={styles.pageBtn} 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>Page {page} of {Math.ceil(total / limit) || 1}</span>
        <button 
          className={styles.pageBtn} 
          disabled={page * limit >= total} 
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
