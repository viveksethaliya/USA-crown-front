'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, HelpCircle } from 'lucide-react';
import HelpDrawer from './HelpDrawer';

export default function GroupCustomers({ group }: { group: any }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [group.id]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      toast.error('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/customers?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out those who are already in this group, and exclude sub-users
        const existingIds = new Set(members.map(m => m.id));
        setSearchResults((data.data || []).filter((u: any) => !existingIds.has(u.id) && u.level !== 1 && !u.parent_user_id));
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/members`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to add member');
      
      toast.success('Member added successfully');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this user from the group?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to remove member');
      
      toast.success('Member removed');
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-8 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-[#312f2c]">Group Customers</h3>
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-1.5 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#312f2c]/50 text-sm mt-1 max-w-2xl">
            A business account can only belong to one pricing group at a time. 
            Sub-users automatically inherit the group of their parent account.
          </p>
        </div>
      </div>

      {/* Add new member section */}
      <div className="bg-[#312f2c]/5 p-4 rounded-lg border border-[#312f2c]/10 mb-8">
        <h4 className="font-semibold text-[#312f2c]/80 mb-3">Add Customer</h4>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-[#312f2c]/40 w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-[#312f2c]/20 rounded-lg focus:ring-2 focus:ring-[#d1a054]/40"
            />
          </div>
          <button 
            type="submit" 
            disabled={searching || !searchQuery.trim()}
            className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 border border-[#312f2c]/10 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#312f2c]/5 text-[#312f2c]/50 border-b border-[#312f2c]/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(user => (
                  <tr key={user.id} className="border-b border-[#312f2c]/5 last:border-0 hover:bg-[#312f2c]/5">
                    <td className="px-4 py-3 font-medium text-[#312f2c]">
                      {user.first_name} {user.last_name}
                      {user.parent_user_id && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-sm">Sub-user</span>}
                    </td>
                    <td className="px-4 py-3 text-[#312f2c]/60">{user.user_company_details?.company_name || '-'}</td>
                    <td className="px-4 py-3 text-[#312f2c]/60">{user.email}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => addMember(user.id)}
                        disabled={!!user.parent_user_id}
                        title={user.parent_user_id ? "Sub-users inherit from their parent." : "Add to group"}
                        className="text-[#d1a054] hover:text-[#312f2c] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Current members list */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h4 className="font-semibold text-[#312f2c]/80 mb-3">Current Members ({members.length})</h4>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#312f2c]/40">Loading...</div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#312f2c]/10 rounded-lg text-[#312f2c]/50 bg-[#312f2c]/5/50">
            No customers assigned to this group yet.
          </div>
        ) : (
          <div className="flex-1 overflow-auto border border-[#312f2c]/10 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#312f2c]/5 text-[#312f2c]/50 border-b border-[#312f2c]/10 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role Level</th>
                  <th className="px-4 py-3 font-medium w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(user => (
                  <tr key={user.id} className="border-b border-[#312f2c]/5 last:border-0 hover:bg-[#312f2c]/5">
                    <td className="px-4 py-3 font-medium text-[#312f2c]">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-[#312f2c]/60">{user.user_company_details?.company_name || '-'}</td>
                    <td className="px-4 py-3 text-[#312f2c]/60">{user.email}</td>
                    <td className="px-4 py-3 text-[#312f2c]/60 capitalize">{user.level || 'Standard'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => removeMember(user.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors inline-block"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Customers Tab Help">
        <p>The <strong>Customers</strong> tab allows you to manage which users (and by extension, their sub-accounts) belong to this Pricing Group.</p>
        
        <h3>Key Principles</h3>
        <ul>
          <li><strong>One Group Per User:</strong> A business account (or customer) can only belong to a single Pricing Group at a time. If you add a user who is currently in another group, they will automatically be moved to this one.</li>
          <li><strong>Inheritance:</strong> If a customer has sub-users or employee accounts under their main company account, all those sub-users automatically inherit the Pricing Group of their parent account. You do not need to add sub-users individually.</li>
          <li><strong>Search &amp; Add:</strong> Use the search bar to find users by their name, email, or phone number. Click &quot;Add&quot; to assign them to this group.</li>
          <li><strong>Live Evaluation:</strong> Once a user is added to an Active group, their storefront experience (including product visibility and cart pricing) is immediately evaluated against this group&apos;s rules.</li>
        </ul>
      </HelpDrawer>
    </div>
  );
}
