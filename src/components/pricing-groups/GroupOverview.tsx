'use client';
import React, { useState } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { HelpCircle, Archive, ArchiveRestore } from 'lucide-react';
import HelpDrawer from './HelpDrawer';

export default function GroupOverview({ group, onUpdate }: { group: any, onUpdate: (data: any) => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name || '',
    description: group.description || '',
    group_type: group.group_type || 'wholesale',
    status: group.status || 'draft',
    valid_from: group.valid_from ? group.valid_from.substring(0, 16) : '',
    valid_until: group.valid_until ? group.valid_until.substring(0, 16) : '',
    internal_note: group.internal_note || '',
  });

  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'status' && value === 'active' && group.status !== 'active') {
      setPendingStatus('active');
      setShowConfirm(true);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (dataToSave = formData) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update group');
      
      toast.success('Group updated successfully');
      onUpdate(resData.group);
      setFormData({
        name: resData.group.name || '',
        description: resData.group.description || '',
        group_type: resData.group.group_type || 'wholesale',
        status: resData.group.status || 'draft',
        valid_from: resData.group.valid_from ? resData.group.valid_from.substring(0, 16) : '',
        valid_until: resData.group.valid_until ? resData.group.valid_until.substring(0, 16) : '',
        internal_note: resData.group.internal_note || '',
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmActivation = () => {
    const newData = { ...formData, status: 'active' };
    setFormData(newData);
    setShowConfirm(false);
    setPendingStatus(null);
    handleSave(newData);
  };

  const cancelActivation = () => {
    setShowConfirm(false);
    setPendingStatus(null);
    // Revert select back to current status
    setFormData(prev => ({ ...prev, status: group.status }));
  };

  const confirmArchive = () => {
    const newData = { ...formData, status: 'archived' };
    setFormData(newData);
    setShowArchiveConfirm(false);
    handleSave(newData);
  };

  const handleUnarchive = () => {
    const newData = { ...formData, status: 'active' };
    setFormData(newData);
    handleSave(newData);
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#312f2c]">Group Overview</h3>
        <button 
          onClick={() => setHelpOpen(true)}
          className="p-2 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Group Name</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Group Slug</label>
          <input 
            type="text" 
            disabled
            value={group.slug || ''}
            className="w-full border border-[#312f2c]/10 bg-[#312f2c]/5 text-[#312f2c]/50 rounded-lg px-3 py-2" 
            title="Slug is auto-generated from the name."
          />
        </div>

        <div className="md:col-span-2">
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
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Type</label>
          <select 
            name="group_type"
            value={formData.group_type}
            onChange={handleChange}
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40"
          >
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail (VIP)</option>
            <option value="distributor">Distributor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Lifecycle Status</label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40"
            disabled={group.status === 'archived'}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            {group.status === 'archived' && <option value="archived">Archived</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Valid From</label>
          <input 
            type="datetime-local" 
            name="valid_from"
            value={formData.valid_from}
            onChange={handleChange}
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Valid Until</label>
          <input 
            type="datetime-local" 
            name="valid_until"
            value={formData.valid_until}
            onChange={handleChange}
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Internal Notes</label>
          <textarea 
            name="internal_note"
            value={formData.internal_note}
            onChange={handleChange}
            rows={2}
            placeholder="Staff only"
            className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d1a054]/40" 
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <div>
          {group.status === 'archived' ? (
            <button 
              onClick={handleUnarchive}
              disabled={saving}
              className="inline-flex items-center gap-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <ArchiveRestore className="w-4 h-4" /> Unarchive Group
            </button>
          ) : (
            <button 
              onClick={() => setShowArchiveConfirm(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 border border-red-500 text-red-500 hover:bg-red-50 px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Archive className="w-4 h-4" /> Archive Group
            </button>
          )}
        </div>
        <button 
          onClick={() => handleSave()}
          disabled={saving || group.status === 'archived'}
          className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-[#312f2c]/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#312f2c] mb-2">Activate Pricing Group?</h3>
            <p className="text-[#312f2c]/60 mb-6">
              Activating this group will immediately apply its base pricing and eligible promotions to all assigned customers. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelActivation}
                className="px-4 py-2 text-[#312f2c]/60 hover:bg-[#312f2c]/10 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmActivation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
              >
                Yes, Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-[#312f2c]/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2">Archive Pricing Group?</h3>
            <p className="text-[#312f2c]/60 mb-6">
              Archiving this group will immediately remove pricing for {group.member_count || 0} assigned customer(s), effective on their next page load or cart request. This can be undone by unarchiving.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-[#312f2c]/60 hover:bg-[#312f2c]/10 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmArchive}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Overview Tab Help">
        <p>The <strong>Overview</strong> tab acts as the central control panel for this Pricing Group. From here you manage its core identity, status, and high-level behavioral settings.</p>
        
        <h3>Key Fields Explained</h3>
        <ul>
          <li><strong>Group Name:</strong> The internal name used to identify the group. A URL-friendly slug is automatically generated from this.</li>
          <li><strong>Type:</strong> The broad categorization of the group (e.g. Wholesale, Retail, Distributor). This helps organize groups in your list.</li>
          <li><strong>Lifecycle Status:</strong>
            <ul>
              <li><em>Draft:</em> The group is inactive. Rules and assignments are safely ignored by the pricing engine.</li>
              <li><em>Active:</em> The group is live. Customers assigned to it will immediately receive its rules and benefits.</li>
              <li><em>Archived:</em> The group is retired. It preserves historical data but is no longer applied.</li>
            </ul>
          </li>
          <li><strong>Valid Dates:</strong> Optional start and end times for the entire group. If set, the group will automatically activate or deactivate across these dates.</li>
          <li><strong>Internal Notes:</strong> A private memo field for staff members.</li>
        </ul>
      </HelpDrawer>
    </div>
  );
}
