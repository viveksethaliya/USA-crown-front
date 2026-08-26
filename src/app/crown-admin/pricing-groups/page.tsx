'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, UsersRound, Settings, Archive, ArchiveRestore, ChevronDown, ChevronRight } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type GroupData = {
  id: number;
  name: string;
  status: string;
  group_type: string;
  member_count?: number;
  eligibility_mode?: string;
  member_names?: string[];
};

export default function PricingGroupsList() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<GroupData[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch('/api/admin/pricing-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        setArchivedCount(data.archivedCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedGroups = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch('/api/admin/pricing-groups?status=archived', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArchivedGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to fetch archived groups', error);
      toast.error('Failed to load archived groups');
    }
  };

  const toggleArchived = () => {
    if (!isArchivedExpanded && archivedGroups.length === 0) {
      fetchArchivedGroups();
    }
    setIsArchivedExpanded(!isArchivedExpanded);
  };

  const handleArchive = async (group: GroupData) => {
    if (!window.confirm(`Archiving this group will immediately remove pricing for ${group.member_count || 0} assigned customer(s), effective on their next page load or cart request. This can be undone by unarchiving.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      if (!res.ok) throw new Error('Failed to archive group');
      toast.success('Group archived');
      setGroups(groups.filter(g => g.id !== group.id));
      setArchivedCount(archivedCount + 1);
      if (isArchivedExpanded || archivedGroups.length > 0) {
        setArchivedGroups(prev => [...prev, { ...group, status: 'archived' }].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err: any) {
      toast.error(err.message || 'Error archiving group');
    }
  };

  const handleUnarchive = async (group: GroupData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }) // Defaulting to active as per spec
      });
      if (!res.ok) throw new Error('Failed to unarchive group');
      toast.success('Group unarchived');
      setArchivedGroups(archivedGroups.filter(g => g.id !== group.id));
      setArchivedCount(Math.max(0, archivedCount - 1));
      setGroups(prev => [...prev, { ...group, status: 'active' }].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      toast.error(err.message || 'Error unarchiving group');
    }
  };

  const createGroup = async () => {
    const name = prompt('Enter a name for the new pricing group:');
    if (!name) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch('/api/admin/pricing-groups', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create group');
      
      toast.success('Group created');
      router.push(`/crown-admin/pricing-groups/${resData.group.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col gap-6 -m-4 sm:m-0">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-[#312f2c]">B2B Pricing Groups</h1>
          <p className="mt-1 text-sm text-[#312f2c]/55">{groups.length} groups managing special pricing and promotions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createGroup} className="inline-flex items-center gap-2 rounded-xl bg-[#d1a054] px-4 py-2.5 text-sm font-bold text-[#f0ede5] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#c29148] hover:shadow-lg">
            <Plus className="h-4 w-4" /> Create Group
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-4 shadow-sm sm:p-6">
        
        {/* Search Bar */}
        <div className="mb-5 flex">
          <div className="flex w-full max-w-md rounded-xl border border-white/60 bg-white/60 shadow-sm focus-within:ring-2 focus-within:ring-[#d1a054]/40">
            <Search className="ml-3 h-5 w-5 self-center text-[#312f2c]/40" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search groups..." 
              className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-[#312f2c] outline-none placeholder:text-[#312f2c]/40" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-white/60 bg-white/50 shadow-inner">
          {loading ? (
            <div className="p-8 text-[#312f2c]/50 animate-pulse text-center mt-10">Loading B2B Pricing Groups...</div>
          ) : (
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#312f2c]/10 bg-[#f4f2eb]/95 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/50 backdrop-blur">
                <tr>
                  <th className="p-4 pl-6 w-1/3">Group Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-center">Members</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-[#312f2c]/40">
                      <UsersRound className="mx-auto mb-4 h-12 w-12 opacity-20" />
                      <p className="font-medium">No groups match your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map(group => (
                    <tr key={group.id} className="group transition-colors hover:bg-white/70">
                      <td className="p-4 pl-6">
                        <Link href={`/crown-admin/pricing-groups/${group.id}`} className="font-bold text-[#312f2c] hover:text-[#d1a054] transition-colors block">
                          {group.name}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {group.eligibility_mode === 'all_customers' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              All
                            </span>
                          ) : (
                            <>
                              {group.member_names?.slice(0, 5).map((name, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#312f2c]/5 text-[#312f2c]/70 border border-[#312f2c]/10">
                                  {name}
                                </span>
                              ))}
                              {(group.member_names?.length || 0) > 5 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#312f2c]/5 text-[#312f2c]/70 border border-[#312f2c]/10">
                                  +{(group.member_names?.length || 0) - 5} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-[#312f2c]/65 capitalize">
                        {group.group_type.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#312f2c]/5 text-xs font-bold text-[#312f2c]/70">
                          {group.member_count || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          group.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' : 
                          group.status === 'draft' ? 'bg-[#312f2c]/10 text-[#312f2c]/70' : 'bg-amber-100 text-amber-700 border border-amber-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            group.status === 'active' ? 'bg-emerald-500' : 
                            group.status === 'draft' ? 'bg-[#312f2c]/40' : 'bg-amber-500'
                          }`}></span>
                          {group.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleArchive(group)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-500 shadow-sm transition-all hover:bg-red-50"
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" /> Archive
                          </button>
                          <Link 
                            href={`/crown-admin/pricing-groups/${group.id}`} 
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#312f2c] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#d1a054]"
                          >
                            <Settings className="h-3.5 w-3.5" /> Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {/* Archived Groups Section */}
                {archivedCount > 0 && !search && (
                  <>
                    <tr className="bg-[#312f2c]/5 cursor-pointer hover:bg-[#312f2c]/10 transition-colors" onClick={toggleArchived}>
                      <td colSpan={5} className="p-4 pl-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#312f2c]/70">
                          {isArchivedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          Archived ({archivedCount})
                        </div>
                      </td>
                    </tr>
                    {isArchivedExpanded && archivedGroups.map(group => (
                      <tr key={`archived-${group.id}`} className="group transition-colors bg-white/30 hover:bg-white/50 opacity-80">
                        <td className="p-4 pl-6">
                          <span className="font-bold text-[#312f2c]/60 block line-through decoration-[#312f2c]/20">
                            {group.name}
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 opacity-60">
                            {group.eligibility_mode === 'all_customers' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                All
                              </span>
                            ) : (
                              <>
                                {group.member_names?.slice(0, 5).map((name, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#312f2c]/5 text-[#312f2c]/70 border border-[#312f2c]/10">
                                    {name}
                                  </span>
                                ))}
                                {(group.member_names?.length || 0) > 5 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#312f2c]/5 text-[#312f2c]/70 border border-[#312f2c]/10">
                                    +{(group.member_names?.length || 0) - 5} more
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-[#312f2c]/50 capitalize">
                          {group.group_type.replace('_', ' ')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#312f2c]/5 text-xs font-bold text-[#312f2c]/50">
                            {group.member_count || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                            <Archive className="w-3 h-3 opacity-50" />
                            Archived
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUnarchive(group)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-600 shadow-sm transition-all hover:bg-emerald-50"
                              title="Unarchive"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                            </button>
                            <Link 
                              href={`/crown-admin/pricing-groups/${group.id}`} 
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#312f2c]/50 shadow-sm transition-all hover:bg-[#312f2c]/10"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
