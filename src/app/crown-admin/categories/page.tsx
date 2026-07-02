'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Category } from '@/types/admin';

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
      const res = await fetch('http://localhost:5000/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
      ? `http://localhost:5000/api/admin/categories/${editingId}`
      : 'http://localhost:5000/api/admin/categories';

    const payload = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(editingId ? 'Category updated successfully' : 'Category created successfully');
        await fetchCategories();
        handleCloseForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save category');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Sub-categories will be unlinked.')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  // Helper to build hierarchy
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

  // If searching, show flat filtered list. Otherwise, show hierarchy
  const displayCategories = search 
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, depth: 0 }))
    : buildHierarchy(categories);

  // Helper to find parent name
  const getParentName = (parentId: string) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Categories
          </h2>
          <p className="text-gray-400 text-sm mt-1">Organize products into hierarchical structures</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Category' : 'Create New Category'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Parent Category</label>
                <select 
                  value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Sort Position</label>
                <input 
                  type="number" 
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={handleCloseForm}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl backdrop-blur-sm">
        <Search className="w-5 h-5 text-gray-500 ml-2" />
        <input 
          type="text" 
          placeholder="Search categories..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-white px-4 py-2 w-full outline-none"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-medium">Category Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Parent</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {displayCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No categories found
                </td>
              </tr>
            ) : (
              displayCategories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="flex items-center" style={{ marginLeft: `${cat.depth * 2}rem` }}>
                      {cat.depth > 0 && <div className="w-4 h-4 border-l-2 border-b-2 border-gray-600 rounded-bl mr-2 -mt-2 opacity-50" />}
                      <div className={`w-8 h-8 rounded-lg ${cat.depth === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'} flex items-center justify-center shrink-0`}>
                        <FolderTree className="w-4 h-4" />
                      </div>
                    </div>
                    <span>{cat.name}</span>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-sm">{cat.slug}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {cat.parent_id ? (
                       <span className="px-2 py-1 bg-gray-800 rounded text-xs">{getParentName(cat.parent_id)}</span>
                    ) : (
                       <span className="text-gray-600 italic">Top Level</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenForm(cat)}
                      className="p-2 bg-gray-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-400 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors"
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
