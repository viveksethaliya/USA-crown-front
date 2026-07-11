'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid or missing reset token.");
    }
  }, [token, email]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');
      
      setMessage(data.message || 'Password has been successfully reset.');
      setIsSuccess(true);
      setTimeout(() => router.push('/crown-admin/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl p-8 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-[#312f2c] mb-4">Invalid Link</h2>
        <p className="text-[#312f2c]/60 mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/crown-admin/forgot-password" className="text-[#d1a054] hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-6 p-4 bg-green-500/8 border border-green-500/20 rounded-lg text-green-600 text-sm text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#312f2c]/60 mb-1.5">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] placeholder:text-[#312f2c]/30 transition-all"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#312f2c]/60 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] placeholder:text-[#312f2c]/30 transition-all"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full py-3 px-4 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminResetPassword() {
  return (
    <div className="min-h-screen bg-[#f0ede5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#d1a054] tracking-wide mb-2">Crown Admin</h1>
          <p className="text-[#312f2c]/50 text-sm">
            Enter your new password below.
          </p>
        </div>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
