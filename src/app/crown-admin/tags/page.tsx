'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';

export default function TagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [search, setSearch] = useState('');

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/tags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTags(await res.json());
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleOpenForm = (tag: any | null = null) => {
    if (tag) {
      setEditingId(tag.id);
      setFormData({ name: tag.name, slug: tag.slug });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId
        ? `${API}/tags/${editingId}`
        : `${API}/tags`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingId ? 'Tag updated successfully' : 'Tag created successfully');
        await fetchTags();
        handleCloseForm();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save tag');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/tags/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success('Tag deleted successfully'); await fetchTags(); }
      else toast.error('Failed to delete tag');
    } catch { toast.error('An error occurred'); }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Tags</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">Manage descriptive tags for products (e.g., Best Seller, New Arrival)</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d1a054]"></div>
          <h3 className="text-lg font-medium text-[#312f2c] mb-4">{editingId ? 'Edit Tag' : 'Create New Tag'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c]/60 focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-[#312f2c]/55 hover:text-[#312f2c] hover:bg-[#312f2c]/8 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update Tag' : 'Save Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center bg-white/60 p-2 border border-[#312f2c]/10 rounded-xl">
        <Search className="w-5 h-5 text-[#312f2c]/35 ml-2" />
        <input
          type="text"
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-2 w-full outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#312f2c]/5 border-b border-[#312f2c]/10 text-xs uppercase tracking-wider text-[#312f2c]/40">
              <th className="p-4 font-medium">Tag Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#312f2c]/8">
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#312f2c]/40">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No tags found
                </td>
              </tr>
            ) : (
              filteredTags.map(tag => (
                <tr key={tag.id} className="hover:bg-[#312f2c]/4 transition-colors group">
                  <td className="p-4 font-medium text-[#312f2c] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20">
                      <Tag className="w-4 h-4" />
                    </div>
                    {tag.name}
                  </td>
                  <td className="p-4 text-[#312f2c]/50 font-mono text-sm">{tag.slug}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenForm(tag)}
                      className="p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/12 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
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
      </div>
    </div>
  );
}
