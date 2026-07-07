'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Category } from '@/types/admin';
import { ADMIN_API as API } from '@/lib/config';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', parent_id: '', position: 0 });
  const [search, setSearch] = useState('');

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleOpenForm = (cat: Category | null = null) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id || '', position: cat.position || 0 });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', parent_id: '', position: 0 });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', parent_id: '', position: 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `${API}/categories/${editingId}`
      : `${API}/categories`;
    const payload = { ...formData, parent_id: formData.parent_id ? parseInt(formData.parent_id) : null };
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(editingId ? 'Category updated successfully' : 'Category created successfully');
        await fetchCategories();
        handleCloseForm();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save category');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Sub-categories will be unlinked.')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API}/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success('Category deleted successfully'); fetchCategories(); }
      else toast.error('Failed to delete category');
    } catch { toast.error('An error occurred'); }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
  };

  const buildHierarchy = (cats: any[], parentId: any = null, depth: number = 0): any[] => {
    let result: any[] = [];
    const children = cats.filter(c => c.parent_id === parentId);
    children.sort((a, b) => (a.position || 0) - (b.position || 0));
    for (const child of children) {
      result.push({ ...child, depth });
      result = result.concat(buildHierarchy(cats, child.id, depth + 1));
    }
    return result;
  };

  const displayCategories = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, depth: 0 }))
    : buildHierarchy(categories);

  const getParentName = (parentId: string) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

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
          <h2 className="text-2xl font-bold text-[#312f2c]">Categories</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">Organize products into hierarchical structures</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d1a054]"></div>
          <h3 className="text-lg font-medium text-[#312f2c] mb-4">{editingId ? 'Edit Category' : 'Create New Category'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Category Name</label>
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
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
                >
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Sort Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
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
                {editingId ? 'Update Category' : 'Save Category'}
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
          placeholder="Search categories..."
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
              <th className="p-4 font-medium">Category Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Parent</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#312f2c]/8">
            {displayCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#312f2c]/40">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No categories found
                </td>
              </tr>
            ) : (
              displayCategories.map(cat => (
                <tr key={cat.id} className="hover:bg-[#312f2c]/4 transition-colors group">
                  <td className="p-4 font-medium text-[#312f2c] flex items-center gap-3">
                    <div className="flex items-center" style={{ marginLeft: `${cat.depth * 2}rem` }}>
                      {cat.depth > 0 && <div className="w-4 h-4 border-l-2 border-b-2 border-[#312f2c]/20 rounded-bl mr-2 -mt-2" />}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        cat.depth === 0
                          ? 'bg-[#d1a054]/10 text-[#d1a054] border border-[#d1a054]/20'
                          : 'bg-[#312f2c]/6 text-[#312f2c]/40'
                      }`}>
                        <FolderTree className="w-4 h-4" />
                      </div>
                    </div>
                    <span>{cat.name}</span>
                  </td>
                  <td className="p-4 text-[#312f2c]/50 font-mono text-sm">{cat.slug}</td>
                  <td className="p-4 text-[#312f2c]/45 text-sm">
                    {cat.parent_id ? (
                      <span className="px-2 py-1 bg-[#312f2c]/6 rounded text-xs text-[#312f2c]/60">{getParentName(cat.parent_id)}</span>
                    ) : (
                      <span className="text-[#312f2c]/30 italic text-xs">Top Level</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenForm(cat)}
                      className="p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/12 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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
