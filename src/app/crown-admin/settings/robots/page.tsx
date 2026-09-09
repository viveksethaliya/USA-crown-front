'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, ArrowLeft, ShieldAlert, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/cart';
import { adminFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function RobotsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    robots_block_faceted: true,
    robots_block_ai: false,
    robots_site_noindex: false,
    robots_custom_block: ''
  });
  
  const [savedData, setSavedData] = useState({ ...formData });

  const [preview, setPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const [unlockHide, setUnlockHide] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await adminFetch(apiUrl('/api/admin/settings'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const incoming = {
          robots_block_faceted: data.robots_block_faceted !== false,
          robots_block_ai: data.robots_block_ai === true,
          robots_site_noindex: data.robots_site_noindex === true,
          robots_custom_block: data.robots_custom_block || ''
        };
        setFormData(incoming);
        setSavedData(incoming);
      }
    } catch (err) {
      console.error('Error fetching robots settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check dirtiness
  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(savedData);
    setIsDirty(dirty);
  }, [formData, savedData]);

  // Debounced Preview
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      setValidationError('');
      try {
        const res = await adminFetch(apiUrl('/api/admin/robots-preview'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          const text = await res.text();
          setPreview(text);
        } else {
          const err = await res.json();
          setValidationError(err.error || 'Validation failed');
          setPreviewError('Fix validation errors to see preview');
        }
      } catch (err) {
        console.error('Error fetching preview:', err);
        setPreviewError('Failed to load preview');
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, loading]);

  const handleToggle = (field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setValidationError('');
    try {
      const res = await adminFetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully');
        setSavedData(formData);
      } else {
        const err = await res.json();
        setValidationError(err.error || 'Failed to save settings');
        toast.error(err.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Internal server error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {formData.robots_site_noindex && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-700 font-bold text-sm">Site-wide Noindex is Active</h3>
            <p className="text-red-600/80 text-xs mt-1 font-medium leading-relaxed">
              Every page on the site currently has a noindex meta tag. Crawlers will drop these pages from search results next time they visit. This does not alter robots.txt.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link 
          href="/crown-admin/settings"
          className="w-10 h-10 rounded-xl bg-white border border-[#312f2c]/10 flex items-center justify-center text-[#312f2c]/50 hover:text-[#312f2c] hover:bg-white/60 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c]">Search & Crawlers</h1>
          <p className="text-[#312f2c]/50 font-medium text-sm mt-1">Manage robots.txt rules and search engine visibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          
          <div className="bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#312f2c] uppercase tracking-wider mb-6">Toggles</h2>
            
            <div className="space-y-6">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center w-12 h-6 bg-[#312f2c]/10 rounded-full shrink-0 transition-colors group-hover:bg-[#312f2c]/20">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.robots_block_faceted}
                    onChange={() => handleToggle('robots_block_faceted')}
                  />
                  <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.robots_block_faceted ? 'translate-x-3 bg-[#d1a054]' : '-translate-x-3'}`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#312f2c]">Block filtered catalog URLs from search engines</div>
                  <div className="text-xs text-[#312f2c]/50 font-medium mt-1 leading-relaxed">
                    Adds Disallow rules for URL parameters like ?category= and ?search=. Turning this off allows crawlers to index near-duplicate filtered catalog pages.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center w-12 h-6 bg-[#312f2c]/10 rounded-full shrink-0 transition-colors group-hover:bg-[#312f2c]/20">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.robots_block_ai}
                    onChange={() => handleToggle('robots_block_ai')}
                  />
                  <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.robots_block_ai ? 'translate-x-3 bg-[#d1a054]' : '-translate-x-3'}`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#312f2c]">Block AI training crawlers</div>
                  <div className="text-xs text-[#312f2c]/50 font-medium mt-1 leading-relaxed">
                    Prevents well-known AI bots (GPTBot, CCBot, anthropic-ai, meta-externalagent) from scraping the site for training data. Does not affect Google or standard search indexing.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-red-900 uppercase tracking-wider mb-6">Danger Zone</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center w-12 h-6 bg-red-900/10 rounded-full shrink-0 transition-colors">
                  <input
                    type="checkbox"
                    className="sr-only"
                    disabled={!formData.robots_site_noindex && unlockHide !== 'HIDE-SITE-FROM-SEARCH'}
                    checked={formData.robots_site_noindex}
                    onChange={() => {
                      handleToggle('robots_site_noindex');
                      if (!formData.robots_site_noindex) setUnlockHide('');
                    }}
                  />
                  <div className={`absolute w-4 h-4 rounded-full transition-transform shadow-sm ${formData.robots_site_noindex ? 'translate-x-3 bg-red-600' : '-translate-x-3 bg-white'}`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-red-900">Hide entire site from search engines</div>
                  <div className="text-xs text-red-800/70 font-medium mt-1 leading-relaxed">
                    Adds a noindex tag to every page. Does not change robots.txt, and does not remove pages already indexed — Google must recrawl them first.
                  </div>
                </div>
              </label>

              {!formData.robots_site_noindex && (
                <div className="pl-16">
                  <input
                    type="text"
                    value={unlockHide}
                    onChange={e => setUnlockHide(e.target.value)}
                    placeholder="Type HIDE-SITE-FROM-SEARCH to unlock"
                    className="w-full bg-white border border-red-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-red-400 font-medium text-red-900 placeholder:text-red-900/30"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#312f2c] uppercase tracking-wider mb-2">Custom Rules Block</h2>
            <p className="text-xs text-[#312f2c]/50 font-medium mb-6 leading-relaxed">
              Add specific bot blocks or allows here. The Sitemap is appended automatically.
            </p>
            
            <textarea
              value={formData.robots_custom_block}
              onChange={e => setFormData(prev => ({ ...prev, robots_custom_block: e.target.value }))}
              rows={6}
              className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm font-mono transition-all"
              placeholder="User-agent: BadBot&#10;Disallow: /"
            />
            {validationError && (
              <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${isDirty ? 'bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5]' : 'bg-black/5 text-black/30 cursor-not-allowed'}`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />}
              {saving ? 'Saving...' : (isDirty ? 'Save Changes' : 'Saved')}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-[#1e1e1e] rounded-2xl shadow-xl overflow-hidden border border-[#312f2c]/20">
            <div className="bg-[#2a2a2a] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Live Preview (robots.txt)</h3>
              {previewLoading && <Loader2 className="w-4 h-4 animate-spin text-white/30" />}
            </div>
            <div className="p-4 sm:p-6 text-sm text-[#d4d4d4] font-mono leading-relaxed whitespace-pre-wrap min-h-[300px]">
              {previewError ? (
                <div className="text-red-400/80 flex items-center gap-2 h-full justify-center text-xs">
                  {previewError}
                </div>
              ) : (
                preview
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
