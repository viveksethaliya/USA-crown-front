'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, FileText, Newspaper, Loader2, Search, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

export default function PagesListPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchPages = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterType) params.set('page_type', filterType);
      if (filterPublished !== '') params.set('is_published', filterPublished);

      const res = await adminFetch(`${API}/pages?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPages(1); }, [search, filterType, filterPublished]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await adminFetch(`${API}/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success('Page deleted'); fetchPages(1); }
      else toast.error('Failed to delete page');
    } catch { toast.error('An error occurred'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c]">Pages & Blog Posts</h1>
          <p className="text-[#312f2c]/55 text-sm mt-1">Manage static pages and blog articles with SEO metadata</p>
        </div>
        <Link
          href="/crown-admin/pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          New Page / Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center bg-white/60 border border-[#312f2c]/10 rounded-xl px-3">
          <Search className="w-4 h-4 text-[#312f2c]/35 shrink-0" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-3 py-2.5 w-full outline-none text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="page">Static Pages</option>
          <option value="blog">Blog Posts</option>
        </select>
        <select
          value={filterPublished}
          onChange={e => setFilterPublished(e.target.value)}
          className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#d1a054]" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#312f2c]/5 border-b border-[#312f2c]/10 text-xs uppercase tracking-wider text-[#312f2c]/40">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">SEO</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312f2c]/8">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#312f2c]/40">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No pages found.</p>
                    <Link href="/crown-admin/pages/new" className="mt-3 inline-flex items-center gap-2 text-sm text-[#d1a054] hover:underline">
                      <Plus className="w-4 h-4" /> Create your first page
                    </Link>
                  </td>
                </tr>
              ) : (
                pages.map(page => (
                  <tr key={page.id} className="hover:bg-[#312f2c]/4 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${page.page_type === 'blog' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-[#d1a054]/10 text-[#d1a054] border border-[#d1a054]/20'}`}>
                          {page.page_type === 'blog' ? <Newspaper className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-[#312f2c] text-sm">{page.title}</p>
                          {page.users && <p className="text-xs text-[#312f2c]/40">{page.users.first_name} {page.users.last_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.page_type === 'blog' ? 'bg-blue-500/10 text-blue-700' : 'bg-amber-500/10 text-amber-700'}`}>
                        {page.page_type === 'blog' ? 'Blog Post' : 'Static Page'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#312f2c]/50">/{page.slug}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.is_published ? 'bg-green-500/10 text-green-700' : 'bg-[#312f2c]/8 text-[#312f2c]/50'}`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4">
                      {page.seo_title ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700">Customized</span>
                      ) : (
                        <span className="text-xs text-[#312f2c]/30 italic">Inheriting defaults</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/crown-admin/pages/${page.id}`}
                        className="inline-flex p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/12 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id, page.title)}
                        className="p-2 bg-[#312f2c]/6 hover:bg-red-500/10 hover:text-red-600 text-[#312f2c]/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => fetchPages(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-[#312f2c] text-white' : 'bg-white/60 text-[#312f2c] hover:bg-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
