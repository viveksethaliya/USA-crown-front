"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../login/login.module.css";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request password reset.");
      
      toast.success(data.message || "Reset link sent to your email.");
      setEmail("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        {/* Left Side: Branding */}
        <div className={styles.brandSide}>
          <div className={styles.brandContent}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Crown Findings" className={styles.brandLogo} />
            <h2 className={styles.brandTagline}>Your Trusted Partner in Wholesale Jewelry Findings</h2>
            <p className={styles.brandText}>
              Access over 18,000+ premium findings in 14K, 18K Gold, Silver, and Platinum at exclusive trade prices.
            </p>
            <div className={styles.brandFeatures}>
              <div className={styles.brandFeature}>
                <span className={styles.featureIcon}>✦</span>
                <span>Competitive Wholesale Pricing</span>
              </div>
              <div className={styles.brandFeature}>
                <span className={styles.featureIcon}>✦</span>
                <span>Live Metal Market Rates</span>
              </div>
              <div className={styles.brandFeature}>
                <span className={styles.featureIcon}>✦</span>
                <span>40+ Years of Industry Trust</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Forgot Password Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.subtitle}>
              Enter your email address and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.loginBtn} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              
              <Link href="/login" className={styles.forgotLink} style={{ marginTop: '1rem', display: 'block' }}>
                Back to Login
              </Link>
            </form>

            <div className={styles.registerPrompt}>
              <p>
                Remembered your password?{' '}
                <Link href="/login" className={styles.registerLink}>Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
