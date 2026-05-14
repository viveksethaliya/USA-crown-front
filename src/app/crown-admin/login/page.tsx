"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/crown-admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login. Is the backend running?");
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <h1>Crown<span>Admin</span></h1>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className={styles.formControl}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className={styles.formControl}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.loginBtn}>
            Login to Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}
