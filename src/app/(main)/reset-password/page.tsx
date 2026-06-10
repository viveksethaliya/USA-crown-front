"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setMsg({ type: "error", text: "Invalid or missing reset token." });
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      
      setMsg({ type: "success", text: "Password reset successfully. You can now login." });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className={styles.authCard}>
        <h2>Reset Password</h2>
        <div className={styles.error}>Invalid or missing reset token.</div>
        <div className={styles.footerLinks}>
          <Link href="/forgot-password">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authCard}>
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>

      {msg.text && (
        <div className={msg.type === 'error' ? styles.error : styles.success}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>New Password</label>
          <input 
            type="password" 
            required 
            minLength={8}
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Confirm Password</label>
          <input 
            type="password" 
            required 
            minLength={8}
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading || msg.type === 'success'}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.authContainer}>
      <Suspense fallback={<div className={styles.authCard}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
