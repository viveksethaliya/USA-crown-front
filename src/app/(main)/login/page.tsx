'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { toast } from 'react-hot-toast';
import { apiUrl } from '@/lib/cart';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl('/api/store/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.requireOtp) {
        setUserId(data.userId);
        setStep(2);
        toast.success(data.message || 'OTP sent to your email');
        return;
      }

      if (data.token) {
        localStorage.setItem('storeToken', data.token);
      }

      // Dispatch a custom event so the Header updates immediately
      window.dispatchEvent(new Event('user-auth-change'));
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const submitForm = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (step === 1) {
      handleSubmit(e as React.FormEvent);
    } else {
      handleOtpSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitForm(e);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (cleanValue.length > 1) {
      // Handle paste
      const pastedData = cleanValue.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      
      const nextEmpty = newOtp.findIndex(val => !val);
      if (nextEmpty !== -1 && otpRefs.current[nextEmpty]) {
        otpRefs.current[nextEmpty]?.focus();
      } else {
        otpRefs.current[5]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Move to next input
    if (cleanValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/store/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, otp: otpValue }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');

      if (data.token) {
        localStorage.setItem('storeToken', data.token);
      }

      window.dispatchEvent(new Event('user-auth-change'));
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsLoading(false);
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

        {/* Right Side: Login Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>
              Ready to dive back into the world of premium jewelry findings?
            </p>

            <div className={styles.form}>
              
              {step === 1 ? (
                <>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={styles.input}
                      placeholder="Enter your email"
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
                        onKeyDown={handleKeyDown}
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
                        {showPassword ? 'Hide' : 'Show'}
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

                  <button type="button" onClick={() => submitForm()} className={styles.loginBtn} disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Log in'}
                  </button>

                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Lost your password?
                  </Link>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <p style={{ color: '#666', textAlign: 'center' }}>Enter the 6-digit code sent to your email.</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          handleOtpKeyDown(index, e);
                          if (e.key === 'Enter') submitForm(e);
                        }}
                        style={{
                          width: '45px',
                          height: '50px',
                          fontSize: '1.5rem',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          outline: 'none',
                          background: '#fff',
                          color: '#333'
                        }}
                        required
                      />
                    ))}
                  </div>

                  <button type="button" onClick={() => submitForm()} className={styles.loginBtn} disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      Back to login
                    </button>
                  </div>
                </div>
              )}
            </div>

            {step === 1 && (
              <div className={styles.registerPrompt}>
                <p>
                  Not a user? Discover exclusive benefits and personalised services.{' '}
                  <Link href="/apply" className={styles.registerLink}>Register Now</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
