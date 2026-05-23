"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep("otp");
        setCooldown(60); // 60 seconds cooldown for resend
        setOtp(["", "", "", "", "", ""]);
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("An error occurred. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/crown-admin");
      } else {
        setError(data.error || "Invalid OTP code.");
      }
    } catch (err) {
      setError("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^[0-9]+$/.test(value)) return;
    
    const newOtp = [...otp];
    // Handle pasting full code
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextFocus = Math.min(index + pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <h1>Crown<span>Admin</span></h1>
          <p className={styles.loginSubtitle}>Secure Access</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Admin Email</label>
              <input
                type="email"
                id="email"
                className={styles.formControl}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading ? "Sending..." : "Send Login Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className={styles.otpHeader}>
              <p>We sent a 6-digit code to <strong>{email}</strong></p>
              <button 
                type="button" 
                className={styles.textBtn}
                onClick={() => setStep("email")}
              >
                Change email
              </button>
            </div>

            <div className={styles.otpContainer}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={6} // to allow pasting
                  className={styles.otpInput}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                />
              ))}
            </div>

            <button type="submit" className={styles.loginBtn} disabled={loading || otp.join('').length < 6}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <div className={styles.resendContainer}>
              {cooldown > 0 ? (
                <span className={styles.cooldownText}>Resend code in {cooldown}s</span>
              ) : (
                <button 
                  type="button" 
                  className={styles.textBtn}
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
