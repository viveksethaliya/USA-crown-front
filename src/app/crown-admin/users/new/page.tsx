"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new-user.module.css";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
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
    if (!formData.first_name || !formData.mobile) {
      toast.error("First name and mobile are required to preview username");
      return;
    }
    try {
      const full_name = `${formData.first_name} ${formData.last_name || ''}`.trim();
      const res = await fetch('/api/admin/users/generate-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          mobile: formData.mobile,
          candidate: formData.username_override || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.available) {
        toast.error(data.error || data.message || "Failed to generate username");
        setGeneratedUsername("");
      } else {
        setGeneratedUsername(`Available Username: ${data.username}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error checking username");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      toast.success("User created successfully");
      router.push('/crown-admin/users');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
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
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>First Name *</label>
              <input 
                required
                type="text" 
                className={styles.input} 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Last Name *</label>
              <input 
                required
                type="text" 
                className={styles.input} 
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input 
              required
              type="email" 
              className={styles.input} 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone *</label>
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
