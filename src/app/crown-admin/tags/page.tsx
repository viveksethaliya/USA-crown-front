'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      const res = await fetch('http://localhost:5000/api/admin/tags', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

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

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId 
        ? `http://localhost:5000/api/admin/tags/${editingId}`
        : 'http://localhost:5000/api/admin/tags';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingId ? 'Tag updated successfully' : 'Tag created successfully');
        await fetchTags();
        handleCloseForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save tag');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/admin/tags/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Tag deleted successfully');
        await fetchTags();
      } else {
        toast.error('Failed to delete tag');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
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

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

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
            Tags
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage descriptive tags for products (e.g., Best Seller, New Arrival)</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Tag' : 'Create New Tag'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tag Name</label>
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
                {editingId ? 'Update Tag' : 'Save Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl backdrop-blur-sm">
        <Search className="w-5 h-5 text-gray-500 ml-2" />
        <input 
          type="text" 
          placeholder="Search tags..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-white px-4 py-2 w-full outline-none"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-medium">Tag Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No tags found
                </td>
              </tr>
            ) : (
              filteredTags.map(tag => (
                <tr key={tag.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Tag className="w-4 h-4" />
                    </div>
                    {tag.name}
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-sm">{tag.slug}</td>
                  <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenForm(tag)}
                      className="p-2 bg-gray-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-400 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(tag.id)}
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
