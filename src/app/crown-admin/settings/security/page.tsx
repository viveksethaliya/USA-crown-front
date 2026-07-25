'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, ShieldAlert, ShieldCheck, ArrowLeft, QrCode } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/cart';
import { toast } from 'react-hot-toast';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string, qrImageUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [is2faEnabled, setIs2faEnabled] = useState(false); // We would normally get this from the logged in user's token/profile
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    // Check if 2FA is enabled (mock check, in reality verify via a /me route or JWT)
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.is_2fa_enabled) setIs2faEnabled(true);
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const handleBeginSetup = async () => {
    setIsSettingUp(true);
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/generate'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        setSetupData(await res.json());
      } else {
        toast.error('Failed to start 2FA setup');
        setIsSettingUp(false);
      }
    } catch (err) {
      toast.error('Network error');
      setIsSettingUp(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/verify-setup'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify({ secret: setupData.secret, token: verifyCode })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIs2faEnabled(true);
        setSetupData(null);
        setIsSettingUp(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to verify token');
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) return;
    
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/disable'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      if (res.ok) {
        toast.success('2FA disabled successfully');
        setIs2faEnabled(false);
      } else {
        toast.error('Failed to disable 2FA');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  if (loading) return (
    <div className="flex-1 flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6 -m-4 sm:m-0 max-w-2xl mx-auto pb-12">
      <div className="shrink-0 px-4 sm:px-0">
        <div className="flex items-center gap-2 text-sm text-[#312f2c]/50 mb-2">
          <Link href="/crown-admin/settings" className="hover:text-[#d1a054] flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Personal Security</h1>
        <p className="text-sm text-[#312f2c]/60 mt-1">Manage your Two-Factor Authentication (2FA).</p>
      </div>

      <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${is2faEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {is2faEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#312f2c]">Two-Factor Authentication</h2>
            <p className="text-sm font-medium text-[#312f2c]/60">
              {is2faEnabled ? 'Your account is protected.' : 'Your account is currently vulnerable.'}
            </p>
          </div>
        </div>

        {!is2faEnabled && !isSettingUp && (
          <div className="bg-white rounded-2xl p-6 border border-[#312f2c]/10 text-center">
            <Shield className="w-12 h-12 text-[#d1a054] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[#312f2c] mb-2">Protect Your Account</h3>
            <p className="text-sm text-[#312f2c]/60 mb-6 max-w-sm mx-auto">
              Add an extra layer of security by requiring a code from an authenticator app (like Google Authenticator) when logging in.
            </p>
            <button
              onClick={handleBeginSetup}
              className="px-6 py-2.5 bg-[#312f2c] hover:bg-[#d1a054] text-white rounded-xl font-bold transition-all"
            >
              Enable 2FA
            </button>
          </div>
        )}

        {isSettingUp && setupData && (
          <div className="bg-white rounded-2xl p-6 border border-[#312f2c]/10">
            <h3 className="text-lg font-bold text-[#312f2c] mb-4">Set up Authenticator App</h3>
            <ol className="space-y-4 text-sm text-[#312f2c]/80 mb-6">
              <li className="flex gap-3">
                <span className="font-bold text-[#d1a054]">1.</span>
                Download Google Authenticator or Authy on your phone.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#d1a054]">2.</span>
                <div>
                  <p className="mb-2">Scan this QR code with the app:</p>
                  <div className="bg-gray-50 p-2 rounded-xl inline-block border">
                    <img src={setupData.qrImageUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-xs text-[#312f2c]/50 mt-2 font-mono break-all bg-gray-50 p-2 rounded">
                    Manual entry code: {setupData.secret}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#d1a054]">3.</span>
                <div>
                  <p className="mb-2">Enter the 6-digit code from the app to verify:</p>
                  <form onSubmit={handleVerify} className="flex gap-2 max-w-xs">
                    <input
                      type="text"
                      placeholder="000000"
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-mono tracking-widest text-center"
                      maxLength={6}
                      required
                    />
                    <button type="submit" className="px-4 py-2 bg-[#d1a054] text-white rounded-lg font-bold">
                      Verify
                    </button>
                  </form>
                </div>
              </li>
            </ol>
            <button onClick={() => setIsSettingUp(false)} className="text-sm font-bold text-[#312f2c]/50 hover:text-[#312f2c]">Cancel Setup</button>
          </div>
        )}

        {is2faEnabled && (
          <div className="bg-white rounded-2xl p-6 border border-[#312f2c]/10">
            <p className="text-sm text-[#312f2c]/80 mb-6 leading-relaxed">
              Two-Factor Authentication is currently enabled. You will be prompted for an authenticator code instead of receiving an email OTP when logging in.
            </p>
            <button
              onClick={handleDisable}
              className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all border border-red-200"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
