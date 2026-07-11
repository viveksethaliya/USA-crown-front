'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

export default function AdminForgotPassword() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request password reset');
      
      setMessage(data.message || 'If that email address is associated with an admin account, we will send you an email to reset your password.');
      setEmail('');
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
            Reset your password
          </p>
        </div>

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

          <form onSubmit={handleForgotPassword} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
            
            <div className="text-center mt-4">
              <Link href="/crown-admin/login" className="text-sm text-[#d1a054] hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
