'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication backend
    console.log('Login attempt:', { email, password, remember });
  };

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        {/* Left Side: Branding */}
        <div className={styles.brandSide}>
          <div className={styles.brandContent}>
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

        {/* Right Side: Login Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>
              Ready to dive back into the world of premium jewelry findings?
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Username or email address <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your email or username"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className={styles.formOptions}>
                <label className={styles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Remember me
                </label>
              </div>

              <button type="submit" className={styles.loginBtn}>
                Log in
              </button>

              <Link href="/forgot-password" className={styles.forgotLink}>
                Lost your password?
              </Link>
            </form>

            <div className={styles.registerPrompt}>
              <p>
                Not a user? Discover exclusive benefits and personalised services.{' '}
                <Link href="/apply" className={styles.registerLink}>Register Now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
