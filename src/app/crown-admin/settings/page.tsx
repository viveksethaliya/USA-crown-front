'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Save, Mail, Search } from 'lucide-react';
import { apiUrl } from '@/lib/cart';
import SeoFormBlock from '@/components/SeoFormBlock';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    metal_price_gold: '',
    metal_price_silver: '',
    metal_price_platinum: '',
    abandoned_cart_reminder_days: '',
    password_min_length: 8,
    password_expiry_days: '',
    require_special_chars: false,
    seo_default_title: '',
    seo_default_description: '',
    seo_default_og_image: ''
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          metal_price_gold: data.metal_price_gold || '',
          metal_price_silver: data.metal_price_silver || '',
          metal_price_platinum: data.metal_price_platinum || '',
          abandoned_cart_reminder_days: data.abandoned_cart_reminder_days || 10,
          password_min_length: data.password_min_length || 8,
          password_expiry_days: data.password_expiry_days || '',
          require_special_chars: data.require_special_chars || false,
          seo_default_title: data.seo_default_title || '',
          seo_default_description: data.seo_default_description || '',
          seo_default_og_image: data.seo_default_og_image || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Settings updated successfully!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 -m-4 sm:m-0">
      <div className="shrink-0 px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Store Settings</h1>
        <p className="text-sm text-[#312f2c]/60 mt-1">Manage global configurations and automations.</p>
      </div>

      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex flex-col overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8">
                <div className="flex items-center gap-3 border-b border-[#312f2c]/10 pb-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20 shadow-sm shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#312f2c] uppercase tracking-wider">Marketing Automations</h2>
                    <p className="text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider mt-0.5">Configure automated emails sent to customers.</p>
                  </div>
                </div>

                <div className="max-w-xl space-y-2">
                  <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Abandoned Cart Reminder (Days)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="abandoned_cart_reminder_days"
                    value={formData.abandoned_cart_reminder_days}
                    onChange={handleInputChange}
                    className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all"
                    required
                  />
                  <p className="text-xs font-bold text-[#312f2c]/40 uppercase tracking-wider mt-2 leading-relaxed">
                    Number of days a cart must be inactive before sending a reminder. Set to 0 to disable.
                  </p>
                </div>
              </div>

              <div className="bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8 mt-6">
                <div className="flex items-center gap-3 border-b border-[#312f2c]/10 pb-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20 shadow-sm shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#312f2c] uppercase tracking-wider">Password Policies</h2>
                    <p className="text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider mt-0.5">Global security constraints for all user accounts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Minimum Length</label>
                    <input
                      type="number"
                      min="6"
                      name="password_min_length"
                      value={formData.password_min_length}
                      onChange={handleInputChange}
                      className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Expiry (Days)</label>
                    <input
                      type="number"
                      min="0"
                      name="password_expiry_days"
                      value={formData.password_expiry_days}
                      onChange={handleInputChange}
                      placeholder="e.g. 90 (leave empty for no expiry)"
                      className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="require_special_chars"
                        checked={formData.require_special_chars}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded-md border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054] transition-colors"
                      />
                      <span className="text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Require Special Characters (!@#$%^&*)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ─── SEO Defaults ─────────────────────── */}
              <div className="mt-6">
                <SeoFormBlock
                  seoTitle={formData.seo_default_title}
                  seoDescription={formData.seo_default_description}
                  seoOgImage={formData.seo_default_og_image}
                  onChange={(field, value) => setFormData(prev => ({ ...prev, [`seo_default_${field.replace('seo_', '')}`]: value }))}
                  titlePlaceholder="e.g. Crown Findings — Wholesale Jewelry Findings"
                  descriptionPlaceholder="e.g. Shop premium quality jewelry findings at wholesale prices."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5] rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
