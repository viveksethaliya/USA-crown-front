'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SeoFormBlock from '@/components/SeoFormBlock';
import MediaPickerModal from '@/components/media/MediaPickerModal';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

const emptyPage = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  is_published: false,
  page_type: 'blog',
  featured_image: '',
  seo_title: '',
  seo_description: '',
  seo_og_image: '',
  seo_keywords: '',
};

export default function PageEditorPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = idStr === 'new';

  const [page, setPage] = useState<any>(emptyPage);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetchPage = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await adminFetch(`${API}/pages/${idStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { toast.error('Page not found'); router.push('/crown-admin/pages'); return; }
        const data = await res.json();
        setPage({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          is_published: data.is_published || false,
          page_type: data.page_type || 'blog',
          featured_image: data.featured_image || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          seo_og_image: data.seo_og_image || '',
          seo_keywords: data.seo_keywords || '',
        });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [idStr, isNew, router]);

  const handleChange = (field: string, value: any) => {
    setPage((prev: any) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && isNew) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!page.title.trim()) { toast.error('Title is required'); return; }
    if (!page.slug.trim()) { toast.error('Slug is required'); return; }

    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API}/pages` : `${API}/pages/${idStr}`;

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(page)
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to save'); return; }
      toast.success(isNew ? 'Page created successfully' : 'Page updated successfully');
      if (isNew) router.push(`/crown-admin/pages/${data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  const tabs = [{ id: 'content', label: 'Content' }];
  if (page.page_type !== 'page') {
    tabs.push({ id: 'seo', label: 'SEO & Metadata' });
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/crown-admin/pages"
            className="p-2 bg-[#312f2c]/8 hover:bg-[#312f2c]/12 text-[#312f2c]/55 hover:text-[#312f2c] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[#312f2c]">
              {isNew ? 'Create New Page / Post' : (page.title || 'Edit Page')}
            </h2>
            <p className="text-[#312f2c]/45 text-sm capitalize">{page.page_type === 'blog' ? 'Blog Post' : 'Static Page'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChange('is_published', !page.is_published)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              page.is_published
                ? 'bg-green-500/10 text-green-700 border-green-500/25'
                : 'bg-[#312f2c]/6 text-[#312f2c]/50 border-[#312f2c]/12'
            }`}
          >
            {page.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {page.is_published ? 'Published' : 'Draft'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Page' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#312f2c]/12 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#d1a054] text-[#d1a054]'
                : 'border-transparent text-[#312f2c]/50 hover:text-[#312f2c] hover:border-[#312f2c]/25'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="space-y-5">
          {/* Core Fields */}
          <div className="bg-white/50 border border-white/60 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={page.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Page title"
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">URL Slug</label>
                <div className="flex items-center bg-white/60 border border-white/80 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#d1a054]/40">
                  <span className="px-3 py-3 text-sm text-[#312f2c]/40 border-r border-white/60 bg-white/30">/</span>
                  <input
                    type="text"
                    value={page.slug}
                    onChange={e => handleChange('slug', e.target.value)}
                    placeholder="url-slug"
                    className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none font-mono text-[#312f2c]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Excerpt / Summary</label>
              <textarea
                value={page.excerpt}
                onChange={e => handleChange('excerpt', e.target.value)}
                rows={2}
                placeholder="Short description shown in blog listing pages..."
                className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] shadow-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Content</label>
              <textarea
                value={page.content}
                onChange={e => handleChange('content', e.target.value)}
                rows={35}
                placeholder="Write your page content here. HTML is supported."
                className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 text-[#312f2c] shadow-sm resize-y font-mono min-h-[600px]"
              />
              <p className="text-xs text-[#312f2c]/40">HTML is supported. A rich-text editor can be integrated here later.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">Featured Image</label>
              <div className="flex items-center gap-3">
                {page.featured_image ? (
                  <div className="relative group w-32 h-20 rounded-xl overflow-hidden border border-white shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.featured_image} alt="Featured Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => handleChange('featured_image', '')}
                      className="absolute inset-0 bg-[#312f2c]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-xl border-2 border-dashed border-[#312f2c]/20 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-[#312f2c]/25" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="px-4 py-2.5 bg-white/70 hover:bg-white border border-white/80 rounded-xl text-sm font-bold text-[#312f2c] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {page.featured_image ? 'Change Image' : 'Select from Media Library'}
                  </button>
                  {page.featured_image && (
                    <p className="text-xs text-[#312f2c]/40 font-medium truncate max-w-xs">{page.featured_image}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <SeoFormBlock
          seoTitle={page.seo_title}
          seoDescription={page.seo_description}
          seoOgImage={page.seo_og_image}
          seoKeywords={page.seo_keywords}
          onChange={(field, value) => handleChange(field, value)}
          titlePlaceholder={`Leave blank to use: "${page.title || 'Page Title'}"`}
          descriptionPlaceholder={`Leave blank to use: "${page.excerpt || 'Page excerpt or site default'}"`}
        />
      )}

      <MediaPickerModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          handleChange('featured_image', url);
          setMediaOpen(false);
        }}
        title="Select Featured Image"
      />
    </div>
  );
}
