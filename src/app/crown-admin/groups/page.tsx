'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UsersRound, Search, Trash2, Loader2, Edit2, Tag } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/cart';

interface Group {
  id: number;
  name: string;
  slug: string;
  description: string;
  discount_pct: number;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', discount_pct: '', is_active: true });
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/groups'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(apiUrl('/api/admin/groups'), {
        method: 'POST',
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
      setShowCreate(false);
      setForm({ name: '', description: '', discount_pct: '', is_active: true });
      fetchGroups();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete group "${name}"? All member assignments will be removed.`)) return;
    try {
      await fetch(apiUrl(`/api/admin/groups/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(debouncedSearch));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Customer & Discount Groups</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">{groups.length} groups created</p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="flex items-center bg-white/60 p-2 border border-[#312f2c]/10 rounded-xl">
            <Search className="w-5 h-5 text-[#312f2c]/35 ml-2" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-1 w-64 outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-xl font-medium transition-colors shadow-sm"
          >
            Create Group
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl mx-4">
            <h2 className="text-xl font-bold text-[#312f2c] mb-6">Create New Group</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1">Group Name *</label>
                <input
                  required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gold Tier, Wholesale A"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional notes about this group"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c]/80 mb-1">Discount %</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054]"
                />
                <p className="text-xs text-[#312f2c]/50 mt-1">Applied as a flat discount for members.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#312f2c]/20 text-[#312f2c] font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-[#312f2c] text-[#f0ede5] font-medium hover:bg-[#312f2c]/90 transition-colors flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#312f2c]/60">
            <thead className="bg-[#312f2c]/5 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/10">
              <tr>
                <th className="px-6 py-4 font-medium">Group Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Members</th>
                <th className="px-6 py-4 font-medium">Base Discount</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312f2c]/8">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#312f2c]/40">
                    <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No groups found</p>
                  </td>
                </tr>
              ) : (
                filteredGroups.map(group => (
                  <tr key={group.id} className="hover:bg-[#312f2c]/4 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#312f2c] whitespace-nowrap">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 text-[#312f2c]/70 max-w-xs truncate" title={group.description}>
                      {group.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${group.is_active ? 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20' : 'bg-[#312f2c]/6 text-[#312f2c]/60 border-[#312f2c]/10'}`}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <UsersRound className="w-3.5 h-3.5 text-[#312f2c]/35" />
                      <span className="text-[#312f2c]/70">{group.member_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#312f2c]/70">
                        <Tag className={`w-3.5 h-3.5 ${group.discount_pct > 0 ? 'text-[#059669]' : 'text-[#312f2c]/35'}`} />
                        <span className={group.discount_pct > 0 ? 'text-[#059669] font-semibold' : ''}>
                          {group.discount_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#312f2c]/50">
                      {new Date(group.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/crown-admin/groups/${group.id}`}
                        className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors mr-1 inline-flex"
                        title="Edit Group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="p-2 text-[#312f2c]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Group"
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
    </div>
  );
}
