'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_URL } from '@/lib/config';

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP fields
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!recaptchaValue) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      
      if (data.step === 'otp') {
        setTempToken(data.tempToken);
        setStep('otp');
      } else {
        // Fallback if backend doesn't enforce OTP for some reason
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        router.push('/crown-admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');
      
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      router.push('/crown-admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ede5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#d1a054] tracking-wide mb-2">Crown Admin</h1>
          <p className="text-[#312f2c]/50 text-sm">
            {step === 'login' ? 'Sign in to manage your store' : 'Enter verification code'}
          </p>
        </div>

        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/60 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] placeholder:text-[#312f2c]/30 transition-all"
                  placeholder="admin@yourstore.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#312f2c]/60 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] placeholder:text-[#312f2c]/30 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex justify-center my-4">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                  onChange={(value) => setRecaptchaValue(value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !recaptchaValue}
                className="w-full py-3 px-4 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-sm text-[#312f2c]/70">We sent a 6-digit code to</p>
                <p className="font-semibold text-[#312f2c]">{email}</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 text-center tracking-[0.5em] text-2xl bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] transition-all"
                  placeholder="------"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 px-4 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full py-2 text-sm text-[#312f2c]/60 hover:text-[#312f2c] transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
