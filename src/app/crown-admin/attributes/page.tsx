'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, SlidersHorizontal, Search, ChevronDown, ChevronRight, X, ImageIcon, Loader2 } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { toast } from 'react-hot-toast';

import { ADMIN_API } from '@/lib/config';
const API = `${ADMIN_API}/attributes`;

interface AttributeValue {
  id: number;
  value: string;
  color_hex: string | null;
  image_url?: string | null;
  position: number;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_global: boolean;
  attribute_values?: AttributeValue[];
}

interface FormData {
  name: string;
  slug: string;
  type: string;
  is_global: boolean;
}

function AttributeValuesPanel({ attribute }: { attribute: Attribute }) {
  const [values, setValues] = useState<AttributeValue[]>(attribute.attribute_values || []);
  const [newValue, setNewValue] = useState<string>('');
  const [newColorHex, setNewColorHex] = useState<string>('#d1a054');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false);

  const getToken = (): string | null => localStorage.getItem('adminToken');

  const handleAddValue = async (): Promise<void> => {
    if (!newValue.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/${attribute.id}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ 
          value: newValue.trim(), 
          color_hex: attribute.type === 'color' ? newColorHex : null, 
          image_url: attribute.type === 'image' ? newImageUrl : null,
          position: values.length 
        })
      });
      const data: any = await res.json();
      if (res.ok) {
        setValues(prev => [...prev, data]);
        setNewValue('');
        setNewColorHex('#d1a054');
        setNewImageUrl('');
        setShowImageUploader(false);
        toast.success('Value added successfully');
      } else {
        toast.error(data.error || 'Failed to add value');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateValue = async (valueId: number): Promise<void> => {
    try {
      const res = await fetch(`${API}/values/${valueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ value: editText })
      });
      const data = await res.json();
      if (res.ok) {
        setValues(prev => prev.map(v => v.id === valueId ? { ...v, value: editText } : v));
        setEditingValueId(null);
        toast.success('Value updated');
      } else {
        toast.error(data.error || 'Failed to update value');
      }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  const handleDeleteValue = async (valueId: number): Promise<void> => {
    if (!confirm('Delete this value?')) return;
    try {
      const res = await fetch(`${API}/values/${valueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setValues(prev => prev.filter(v => v.id !== valueId));
        toast.success('Value deleted');
      } else {
        toast.error('Failed to delete value');
      }
    } catch { toast.error('An error occurred'); }
  };

  return (
    <div className="px-4 pb-4 border-t border-[#312f2c]/8 mt-0 bg-[#312f2c]/3">
      <div className="pt-4 space-y-2">
        <p className="text-xs font-semibold text-[#312f2c]/40 uppercase tracking-wider mb-3">
          Values — e.g. "{attribute.name === 'Metal Type' ? '14K Yellow Gold' : attribute.name === 'Ring Size' ? '7' : 'Value 1'}"
        </p>

        {values.length === 0 ? (
          <p className="text-sm text-[#312f2c]/35 italic py-2">No values yet. Add the first one below.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {values.sort((a, b) => a.position - b.position).map(v => (
              <div key={v.id} className="flex items-center gap-1 group">
                {editingValueId === v.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateValue(v.id)}
                      autoFocus
                      className="bg-white border border-[#d1a054]/40 rounded-lg px-3 py-1 text-[#312f2c] text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40"
                    />
                    <button
                      onClick={() => handleUpdateValue(v.id)}
                      className="px-2 py-1 bg-[#d1a054] text-[#f0ede5] rounded text-xs font-medium"
                    >✓</button>
                    <button
                      onClick={() => setEditingValueId(null)}
                      className="px-2 py-1 bg-[#312f2c]/8 text-[#312f2c]/60 rounded text-xs"
                    >✕</button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#312f2c]/10 rounded-lg text-sm text-[#312f2c]">
                    {v.color_hex && (
                      <span
                        className="w-3 h-3 rounded-full border border-[#312f2c]/15 flex-shrink-0"
                        style={{ backgroundColor: v.color_hex }}
                      />
                    )}
                    {v.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={v.image_url} 
                        alt={v.value} 
                        className="w-4 h-4 rounded-full border border-[#312f2c]/15 object-cover" 
                      />
                    )}
                    {v.value}
                    <button
                      onClick={() => { setEditingValueId(v.id); setEditText(v.value); }}
                      className="ml-1 opacity-0 group-hover:opacity-100 text-[#312f2c]/35 hover:text-[#d1a054] transition-opacity"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteValue(v.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#312f2c]/35 hover:text-red-500 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-[#312f2c]/8">
          {attribute.type === 'color' && (
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-[#312f2c]/12 bg-white p-0.5"
              title="Pick color"
            />
          )}
          {attribute.type === 'image' && (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowImageUploader(!showImageUploader)}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${newImageUrl ? 'border-[#d1a054] bg-[#d1a054]/10 text-[#d1a054]' : 'border-[#312f2c]/12 bg-white hover:bg-[#312f2c]/5 text-[#312f2c]/50'}`}
                title={newImageUrl ? 'Image selected' : 'Upload image'}
              >
                {newImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newImageUrl} alt="Swatch" className="w-full h-full rounded-md object-cover p-0.5" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
            placeholder={`Add value (e.g. ${attribute.name === 'Metal Type' ? '14K Yellow Gold' : attribute.name === 'Ring Size' ? '7' : 'New value'})`}
            className="flex-1 bg-white border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none placeholder:text-[#312f2c]/35"
          />
          <button
            onClick={handleAddValue}
            disabled={isSaving || !newValue.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
        
        {/* Render Image Uploader Dropdown if open */}
        {attribute.type === 'image' && showImageUploader && (
          <div className="mt-3 p-4 bg-white border border-[#312f2c]/10 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#312f2c]/50">Upload Swatch Image</span>
              <button onClick={() => setShowImageUploader(false)} className="text-[#312f2c]/40 hover:text-[#312f2c]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ImageUploader 
              folder="attributes" 
              onUploaded={(url) => {
                setNewImageUrl(url);
                setShowImageUploader(false);
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', slug: '', type: 'select', is_global: true });
  const [search, setSearch] = useState<string>('');

  const getToken = (): string | null => localStorage.getItem('adminToken');

  const fetchAttributes = async (): Promise<void> => {
    try {
      const res = await fetch(API, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setAttributes(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAttributes(); }, []);

  const handleOpenForm = (attr: Attribute | null = null): void => {
    if (attr) {
      setEditingId(attr.id);
      setFormData({ name: attr.name, slug: attr.slug, type: attr.type, is_global: attr.is_global });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', type: 'select', is_global: true });
    }
    setShowForm(true);
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', type: 'select', is_global: true });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/${editingId}` : API;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Attribute updated successfully' : 'Attribute created successfully');
        await fetchAttributes();
        handleCloseForm();
      } else {
        toast.error(data.error || 'Failed to save attribute');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Delete this attribute? All its values will be lost.')) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) { toast.success('Attribute deleted successfully'); fetchAttributes(); }
      else toast.error('Failed to delete attribute');
    } catch { toast.error('An error occurred'); }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
  };

  const filteredAttributes = attributes.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

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
          <h2 className="text-2xl font-bold text-[#312f2c]">Attributes & Values</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">
            Define variation dimensions (Metal Type, Ring Size, Stone, etc.) then add their possible values
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Attribute
        </button>
      </div>

      {/* Hint box */}
      <div className="bg-[#d1a054]/8 border border-[#d1a054]/20 rounded-xl p-4 text-sm text-[#312f2c]/70">
        <strong className="text-[#d1a054]">Workflow:</strong> Create an attribute (e.g. <em>Metal Type</em>) → click to expand → add values (e.g. <em>14K Yellow Gold</em>, <em>Sterling Silver 925</em>) → then on a Variable product's Variations tab, those values become available.
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d1a054]"></div>
          <h3 className="text-lg font-medium text-[#312f2c] mb-4">{editingId ? 'Edit Attribute' : 'Create New Attribute'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Attribute Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Metal Type, Ring Size, Stone"
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
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Display Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
                >
                  <option value="select">Dropdown Select</option>
                  <option value="color">Color Swatch (shows color pickers)</option>
                  <option value="image">Image Swatch</option>
                  <option value="button">Button / Label (best for sizes)</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 text-sm font-medium text-[#312f2c]/65 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                    className="w-4 h-4 rounded border-[#312f2c]/20 accent-[#d1a054]"
                  />
                  Global (usable across all products)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCloseForm}
                className="px-4 py-2 text-[#312f2c]/55 hover:text-[#312f2c] hover:bg-[#312f2c]/8 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg transition-colors disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update Attribute' : 'Save Attribute'}
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
          placeholder="Search attributes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-2 w-full outline-none text-sm"
        />
      </div>

      {/* Attributes Accordion List */}
      <div className="space-y-2">
        {filteredAttributes.length === 0 ? (
          <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl p-12 text-center text-[#312f2c]/40">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-20" />
            No attributes found
          </div>
        ) : (
          filteredAttributes.map(attr => (
            <div key={attr.id} className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden hover:border-[#d1a054]/30 transition-colors">
              {/* Row Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#312f2c]/3 transition-colors"
                onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20 flex-shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#312f2c]">{attr.name}</span>
                    <span className="px-2 py-0.5 bg-[#312f2c]/6 rounded text-xs text-[#312f2c]/50">{attr.type}</span>
                    {attr.is_global && (
                      <span className="px-2 py-0.5 bg-[#d1a054]/10 border border-[#d1a054]/20 rounded text-xs text-[#d1a054]">global</span>
                    )}
                  </div>
                  <div className="text-xs text-[#312f2c]/40 font-mono mt-0.5">{attr.slug}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-[#312f2c]/40">
                    {attr.attribute_values?.length || 0} value{(attr.attribute_values?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenForm(attr)}
                      className="p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/12 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(attr.id)}
                      className="p-2 bg-[#312f2c]/6 hover:bg-red-500/10 hover:text-red-600 text-[#312f2c]/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {expandedId === attr.id
                    ? <ChevronDown className="w-4 h-4 text-[#d1a054]" />
                    : <ChevronRight className="w-4 h-4 text-[#312f2c]/30" />
                  }
                </div>
              </div>

              {/* Values Panel (expanded) */}
              {expandedId === attr.id && (
                <AttributeValuesPanel attribute={attr} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
