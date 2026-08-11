'use client';
import React, { useState } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function CampaignEditor({ group, initialCampaign, onClose, onSaved }: { 
  group: any, 
  initialCampaign: any, 
  onClose: () => void,
  onSaved: () => void
}) {
  const isEditing = !!initialCampaign;
  
  const [formData, setFormData] = useState({
    name: initialCampaign?.name || '',
    description: initialCampaign?.description || '',
    status: initialCampaign?.status || 'draft',
    starts_at: initialCampaign?.starts_at ? initialCampaign.starts_at.substring(0, 16) : '',
    ends_at: initialCampaign?.ends_at ? initialCampaign.ends_at.substring(0, 16) : ''
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Campaign name is required');
    
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null
      };

      const token = localStorage.getItem('adminToken');
      const endpoint = isEditing 
        ? `/api/admin/pricing-groups/${group.id}/campaigns/${initialCampaign.id}`
        : `/api/admin/pricing-groups/${group.id}/campaigns`;
        
      const method = isEditing ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save campaign');
      
      toast.success(isEditing ? 'Campaign updated' : 'Campaign created');
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#312f2c]/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#312f2c]/10">
          <h3 className="text-xl font-bold text-[#312f2c]">
            {isEditing ? 'Edit Campaign' : 'Create Campaign'}
          </h3>
          <button onClick={onClose} className="text-[#312f2c]/40 hover:text-[#312f2c]/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="campaignForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Campaign Name</label>
              <input 
                required
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
                placeholder="e.g. Summer Sale"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Starts At</label>
                <input 
                  type="datetime-local" 
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Ends At</label>
                <input 
                  type="datetime-local" 
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
                />
              </div>
            </div>

          </form>
        </div>

        <div className="border-t border-[#312f2c]/10 px-6 py-4 flex justify-end gap-3 bg-[#312f2c]/5 rounded-b-xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#312f2c]/60 hover:bg-[#312f2c]/15 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="campaignForm"
            disabled={saving}
            className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
