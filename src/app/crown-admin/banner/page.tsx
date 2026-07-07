'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Image as ImageIcon, Library, Trash2 } from 'lucide-react';
import MediaPickerModal from '@/components/media/MediaPickerModal';
import { apiUrl } from '@/lib/cart';

export default function BannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    banner_is_active: false,
    banner_title: '',
    banner_content: '',
    banner_length: 'medium',
    banner_opacity: 50,
    banner_button_text: '',
    banner_button_link: '',
    banner_alignment: 'center',
    banner_background_image: '/web-phts/a-17.jpg'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const bannerRes = await fetch(apiUrl('/api/admin/settings/hero-banner'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        setFormData({
          banner_is_active: bannerData.is_active || false,
          banner_title: bannerData.title || '',
          banner_content: bannerData.content || '',
          banner_length: bannerData.length || 'medium',
          banner_opacity: bannerData.opacity ?? 50,
          banner_button_text: bannerData.button_text || '',
          banner_button_link: bannerData.button_link || '',
          banner_alignment: bannerData.alignment || 'center',
          banner_background_image: bannerData.background_image || '/web-phts/a-17.jpg'
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    setMessage({ text: '', type: '' });

    try {
      const bannerRes = await fetch(apiUrl('/api/admin/settings/hero-banner'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          is_active: formData.banner_is_active,
          title: formData.banner_title,
          content: formData.banner_content,
          length: formData.banner_length,
          opacity: formData.banner_opacity,
          button_text: formData.banner_button_text,
          button_link: formData.banner_button_link,
          alignment: formData.banner_alignment,
          background_image: formData.banner_background_image
        })
      });

      if (bannerRes.ok) {
        setMessage({ text: 'Banner updated successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to update banner', type: 'error' });
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleMediaSelected = async (url: string, path: string) => {
    // Delete the older image if it's a Supabase storage upload
    const oldUrl = formData.banner_background_image;
    if (oldUrl && oldUrl.includes('/storage/v1/object/public/storage/')) {
      const oldPath = oldUrl.split('/storage/v1/object/public/storage/')[1];
      if (oldPath && oldPath !== path) { // Don't delete if they pick the exact same image
        try {
          await fetch(apiUrl('/api/admin/upload'), {
            method: 'DELETE',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
            },
            body: JSON.stringify({ path: oldPath })
          });
        } catch (e) {
          console.error('Failed to delete old banner image', e);
        }
      }
    }

    setFormData(prev => ({ ...prev, banner_background_image: url }));
    setIsMediaPickerOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c]">Hero Banner Settings</h1>
          <p className="text-[#312f2c]/55 text-sm mt-1">Customize the main banner that appears beneath the header on the homepage.</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#d1a054] hover:bg-[#b88a44] disabled:opacity-50 text-white rounded-lg shadow-sm transition-all font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Banner'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-[#d4edda] text-[#155724] border border-[#c3e6cb]' : 'bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb]'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visibility */}
        <div className="bg-white/60 p-6 border border-[#312f2c]/10 rounded-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#312f2c]">Visibility</h2>
            <p className="text-[#312f2c]/55 text-sm mt-1">Toggle the hero banner on or off.</p>
          </div>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${formData.banner_is_active ? 'bg-[#312f2c] text-white' : 'bg-[#312f2c]/10 text-[#312f2c]/60'}`}>
            <input
              type="checkbox"
              name="banner_is_active"
              checked={formData.banner_is_active}
              onChange={handleInputChange}
              className="hidden"
            />
            <span className="font-medium text-sm">{formData.banner_is_active ? 'Active' : 'Hidden'}</span>
          </label>
        </div>

        {/* Text Content */}
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#312f2c]/10 bg-white/40">
            <h2 className="font-semibold text-[#312f2c]">1. Text Content</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/60">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Title (H2)</label>
              <input
                type="text"
                name="banner_title"
                value={formData.banner_title}
                onChange={handleInputChange}
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
                placeholder="e.g. Summer Collection 2026"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Content / Subtitle</label>
              <textarea
                name="banner_content"
                value={formData.banner_content}
                onChange={handleInputChange}
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
                rows={2}
                placeholder="e.g. Discover our new arrivals..."
              />
            </div>
          </div>
        </div>

        {/* Appearance & Alignment */}
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#312f2c]/10 bg-white/40">
            <h2 className="font-semibold text-[#312f2c]">2. Appearance & Alignment</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/60">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Background Image</label>
              <div className="flex items-center gap-4 mt-1">
                {formData.banner_background_image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#312f2c]/10 relative group bg-[#eee]">
                    <img src={formData.banner_background_image} alt="Banner background" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#d1a054]/10 hover:bg-[#d1a054]/20 text-[#d1a054] rounded-lg border border-[#d1a054]/20 transition-colors font-medium text-sm"
                >
                  <Library className="w-4 h-4" /> 
                  {formData.banner_background_image ? 'Change Image' : 'Browse Media Library'}
                </button>
              </div>
              <span className="text-xs text-[#312f2c]/55 mt-1">Select an image from your library. The old image will be automatically deleted.</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Banner Height</label>
              <select 
                name="banner_length" 
                value={formData.banner_length} 
                onChange={handleInputChange} 
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
              >
                <option value="small">Small (200px)</option>
                <option value="medium">Medium (400px)</option>
                <option value="large">Large (600px)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Overlay Opacity ({formData.banner_opacity}%)</label>
              <input
                type="range"
                min="0" max="100"
                name="banner_opacity"
                value={formData.banner_opacity}
                onChange={handleInputChange}
                className="w-full accent-[#312f2c]"
              />
              <span className="text-xs text-[#312f2c]/55">Controls the dark filter over the background image.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Text Alignment</label>
              <select 
                name="banner_alignment" 
                value={formData.banner_alignment} 
                onChange={handleInputChange} 
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#312f2c]/10 bg-white/40">
            <h2 className="font-semibold text-[#312f2c]">3. Call to Action (Button)</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/60">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Button Text (Leave empty to hide)</label>
              <input
                type="text"
                name="banner_button_text"
                value={formData.banner_button_text}
                onChange={handleInputChange}
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
                placeholder="e.g. Shop Now"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#312f2c]">Button Link</label>
              <input
                type="text"
                name="banner_button_link"
                value={formData.banner_button_link}
                onChange={handleInputChange}
                className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
                placeholder="e.g. /products?category=new"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#312f2c]/10 bg-white/40 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#312f2c]/60" />
            <h2 className="font-semibold text-[#312f2c]">Live Preview</h2>
          </div>
          <div className="p-6 bg-white/60">
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#eee',
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              height: formData.banner_length === 'small' ? '200px' : formData.banner_length === 'large' ? '600px' : '400px',
              backgroundImage: `url(${formData.banner_background_image || '/web-phts/a-17.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: formData.banner_alignment === 'left' ? 'flex-start' : formData.banner_alignment === 'right' ? 'flex-end' : 'center',
              padding: '2rem'
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: `rgba(0,0,0, ${formData.banner_opacity / 100})`
              }}></div>
              <div style={{
                position: 'relative',
                zIndex: 1,
                color: '#fff',
                textAlign: formData.banner_alignment as 'left' | 'center' | 'right',
                maxWidth: '800px',
                width: '100%'
              }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>{formData.banner_title || 'Your Title Here'}</h2>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{formData.banner_content || 'Your content goes here...'}</p>
                {formData.banner_button_text && (
                  <button type="button" style={{
                    padding: '12px 28px',
                    backgroundColor: 'var(--color-gold)',
                    color: '#fff',
                    border: '2px solid #fff',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    {formData.banner_button_text}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen} 
        onClose={() => setIsMediaPickerOpen(false)} 
        onSelect={handleMediaSelected} 
      />
    </div>
  );
}
