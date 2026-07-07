'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, UserMinus, UserPlus, Save, Loader2, UsersRound, Settings, Tags, Plus } from 'lucide-react';
import { apiUrl } from '@/lib/cart';
import DiscountRulesPanel from './DiscountRulesPanel';

interface Group {
  id: number;
  name: string;
  description: string;
  discount_pct: number;
  is_active: boolean;
  members: any[];
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  user_company_details?: { company_name?: string }[];
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', discount_pct: '', is_active: true });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'rules'>('general');

  // Member picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [available, setAvailable] = useState<Customer[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load group');
      const data = await res.json();
      setGroup(data);
      setForm({
        name: data.name,
        description: data.description || '',
        discount_pct: data.discount_pct?.toString() || '0',
        is_active: data.is_active
      });
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const fetchAvailable = useCallback(async (search = '') => {
    setPickerLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${id}/available-customers?search=${encodeURIComponent(search)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAvailable(data.customers || []);
    } catch {
      setAvailable([]);
    } finally {
      setPickerLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (showPicker) fetchAvailable(pickerSearch);
  }, [showPicker, pickerSearch, fetchAvailable]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          discount_pct: parseFloat(form.discount_pct) || 0,
          is_active: form.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ text: 'Group saved successfully!', type: 'success' });
      fetchGroup();
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId: number) => {
    setAddingId(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${id}/members`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      if (!res.ok) throw new Error('Failed to add member');
      await fetchGroup();
      fetchAvailable(pickerSearch);
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setAddingId(null);
    }
  };

  const removeMember = async (userId: number) => {
    if (!confirm('Remove member from group?')) return;
    setRemovingId(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${id}/members/${userId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove member');
      fetchGroup();
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin" />
    </div>
  );

  const members = group?.members || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/crown-admin/groups')} className="flex items-center gap-1.5 text-sm text-[#312f2c]/60 hover:text-[#312f2c] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </button>
        <h2 className="text-2xl font-bold text-[#312f2c]">{group?.name}</h2>
        <p className="text-[#312f2c]/55 text-sm mt-1">Manage group settings, members, and advanced rules.</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-[#dcfce3] text-[#15803d] border-[#86efac]' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#312f2c]/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'general' ? 'border-[#d1a054] text-[#d1a054]' : 'border-transparent text-[#312f2c]/60 hover:text-[#312f2c]'}`}
        >
          <Settings className="w-4 h-4" /> General Settings
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'members' ? 'border-[#d1a054] text-[#d1a054]' : 'border-transparent text-[#312f2c]/60 hover:text-[#312f2c]'}`}
        >
          <UsersRound className="w-4 h-4" /> Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'rules' ? 'border-[#d1a054] text-[#d1a054]' : 'border-transparent text-[#312f2c]/60 hover:text-[#312f2c]'}`}
        >
          <Tags className="w-4 h-4" /> Discount Rules
        </button>
      </div>

      {/* Content */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl p-6">
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="max-w-xl space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1.5">Group Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1.5">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white resize-y" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1.5">Flat Discount % (0–100)</label>
              <input type="number" min="0" max="100" step="0.1"
                value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white" />
              <p className="text-xs text-[#312f2c]/50 mt-1.5">Applied to all products for members of this group (unless overridden by advanced rules).</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-sm font-semibold text-[#312f2c]/80">Active Status</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-[#d1a054]' : 'bg-[#312f2c]/20'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#312f2c] hover:bg-[#312f2c]/90 text-[#f0ede5] rounded-xl font-medium transition-colors disabled:opacity-70">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#312f2c]">Assigned Members</h3>
              <button onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#d1a054]/10 hover:bg-[#d1a054]/20 text-[#d1a054] border border-[#d1a054]/30 rounded-xl font-medium transition-colors text-sm">
                <UserPlus className="w-4 h-4" /> Add Members
              </button>
            </div>

            <div className="bg-white border border-[#312f2c]/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-[#312f2c]/60">
                <thead className="bg-[#312f2c]/5 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#312f2c]/8">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#312f2c]/40">
                        <UsersRound className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No members assigned to this group</p>
                      </td>
                    </tr>
                  ) : members.map((m: any) => {
                    const company = Array.isArray(m.user_company_details) ? m.user_company_details[0] : m.user_company_details;
                    return (
                      <tr key={m.id} className="hover:bg-[#312f2c]/4 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-[#312f2c]">{m.first_name} {m.last_name}</span>
                          {m.level === 1 && <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-[#312f2c]/10 text-[#312f2c] rounded-md">Sub-user</span>}
                        </td>
                        <td className="px-6 py-4">{m.email}</td>
                        <td className="px-6 py-4">{company?.company_name || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => removeMember(m.id)} disabled={removingId === m.id}
                            className="p-1.5 text-[#312f2c]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            {removingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <DiscountRulesPanel groupId={id} token={token || ''} />
        )}
      </div>

      {/* Member Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#312f2c]">Add Members</h3>
                <p className="text-sm text-[#312f2c]/60 mt-0.5">Search for approved customers not in any group.</p>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-[#312f2c]/40 hover:text-[#312f2c] text-2xl leading-none">&times;</button>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
              <input
                placeholder="Search by name or email..."
                value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054]"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto border border-[#312f2c]/10 rounded-xl bg-gray-50">
              {(() => {
                const filteredAvailable = available.filter((c: Customer) => !members.some((m: any) => m.id === c.id));
                return pickerLoading ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#d1a054]" /></div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="p-8 text-center text-[#312f2c]/50">No available customers found.</div>
                ) : (
                  <ul className="divide-y divide-[#312f2c]/5">
                    {filteredAvailable.map((c: Customer) => {
                    const company = Array.isArray(c.user_company_details) ? c.user_company_details[0] : c.user_company_details;
                    return (
                      <li key={c.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                        <div>
                          <p className="font-semibold text-[#312f2c]">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-[#312f2c]/60">{c.email} {company?.company_name ? `• ${company.company_name}` : ''}</p>
                        </div>
                        <button onClick={() => addMember(c.id)} disabled={addingId === c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#312f2c]/20 hover:border-[#d1a054] text-[#312f2c] hover:text-[#d1a054] rounded-lg text-sm font-medium transition-colors">
                          {addingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
