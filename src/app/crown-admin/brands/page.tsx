'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Brand } from '@/types/admin';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [search, setSearch] = useState('');

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/brands', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenForm = (brand: Brand | null = null) => {
    if (brand) {
      setEditingId(brand.id);
      setFormData({ name: brand.name, slug: brand.slug });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:5000/api/admin/brands/${editingId}`
      : 'http://localhost:5000/api/admin/brands';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingId ? 'Brand updated successfully' : 'Brand created successfully');
        await fetchBrands();
        handleCloseForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save brand');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Brand deleted successfully');
        fetchBrands();
      } else {
        toast.error('Failed to delete brand');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Brands
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage product manufacturers and brands</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Form Card (Conditional) */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Brand' : 'Create New Brand'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Brand Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update Brand' : 'Save Brand'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Controls */}
      <div className="flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl backdrop-blur-sm">
        <Search className="w-5 h-5 text-gray-500 ml-2" />
        <input 
          type="text" 
          placeholder="Search brands..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-white px-4 py-2 w-full outline-none"
        />
      </div>

      {/* Data Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-medium">Brand Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No brands found
                </td>
              </tr>
            ) : (
              filteredBrands.map(brand => (
                <tr key={brand.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                      {brand.name.charAt(0)}
                    </div>
                    {brand.name}
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-sm">{brand.slug}</td>
                  <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenForm(brand)}
                      className="p-2 bg-gray-800 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(brand.id)}
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
