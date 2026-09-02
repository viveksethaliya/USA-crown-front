"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid or missing reset token.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/store/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      
      toast.success("Password reset successfully. You can now login.");
      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className={styles.page}>
        <div className={styles.splitLayout}>
          <div className={styles.brandSide}>
            <div className={styles.brandContent}>
              <img src="/logo.png" alt="Crown Findings" className={styles.brandLogo} />
              <h2 className={styles.brandTagline}>Your Trusted Partner in Wholesale Jewelry Findings</h2>
            </div>
          </div>
          <div className={styles.formSide}>
            <div className={styles.formContainer}>
              <h1 className={styles.title}>Reset Password</h1>
              <div className={styles.errorMessage}>Invalid or missing reset token.</div>
              <Link href="/forgot-password" className={styles.forgotLink} style={{ marginTop: '2rem', display: 'block', textAlign: 'left' }}>
                Request a new link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Right Side: Reset Password Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Password <span className={styles.required}>*</span>
                </label>
                <input 
                  type="password" 
                  required 
                  minLength={8}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={styles.input}
                  placeholder="Enter your new password"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Confirm Password <span className={styles.required}>*</span>
                </label>
                <input 
                  type="password" 
                  required 
                  minLength={8}
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className={styles.input}
                  placeholder="Confirm your new password"
                />
              </div>

              <button type="submit" className={styles.loginBtn} disabled={loading || isSuccess} style={{ marginTop: '1rem' }}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
