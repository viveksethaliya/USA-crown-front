"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new-user.module.css";
import { FiArrowLeft } from "react-icons/fi";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile: "",
    password: "",
    role_id: "",
    username_override: ""
  });

  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [generatedUsername, setGeneratedUsername] = useState("");

  useEffect(() => {
    fetch('/api/admin/roles').then(r => r.json()).then(data => setRoles(data || []));
  }, []);

  const handlePreviewUsername = async () => {
    if (!formData.full_name || !formData.mobile) {
      setError("Full name and mobile are required to preview username");
      return;
    }
    setError("");
    try {
      const res = await fetch('/api/admin/users/generate-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          mobile: formData.mobile,
          candidate: formData.username_override || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.available) {
        setError(data.error || data.message || "Failed to generate username");
        setGeneratedUsername("");
      } else {
        setGeneratedUsername(`Available Username: ${data.username}`);
      }
    } catch (err) {
      console.error(err);
      setError("Error checking username");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      router.push('/crown-admin/users');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/crown-admin/users" className={styles.backBtn}><FiArrowLeft /></Link>
        <h1>Create New User</h1>
      </div>

      <div className={styles.card}>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input 
              required
              type="text" 
              className={styles.input} 
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email Address *</label>
            <input 
              required
              type="email" 
              className={styles.input} 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mobile Number *</label>
            <input 
              required
              type="tel" 
              className={styles.input} 
              value={formData.mobile}
              onChange={e => setFormData({...formData, mobile: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Role *</label>
            <select 
              required
              className={styles.input} 
              value={formData.role_id}
              onChange={e => setFormData({...formData, role_id: e.target.value})}
            >
              <option value="">Select a role...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Password *</label>
            <input 
              required
              type="password" 
              className={styles.input} 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Manual Username Override (Optional)</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Leave blank to auto-generate"
              value={formData.username_override}
              onChange={e => setFormData({...formData, username_override: e.target.value})}
            />
            {generatedUsername && <div className={styles.usernamePreview}>{generatedUsername}</div>}
          </div>

          <div className={styles.btnGroup}>
            <button type="button" onClick={handlePreviewUsername} className={styles.previewBtn}>
              Check Username
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
