'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Mail, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Pagination } from '@/types/admin';

const API = 'http://localhost:5000/api/admin';

const ROLES = [
  { id: 1, name: 'Admin', slug: 'admin' },
  { id: 4, name: 'Customer', slug: 'customer' },
  { id: 5, name: 'Employee', slug: 'employee' }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: String(25) });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`${API}/customers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      setCustomers(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });

      // Update selected user if in list
      setSelectedUser((prev: any) => {
        if (!prev) return prev;
        const updated = (json.data || []).find((c: any) => c.id === prev.id);
        return updated || prev;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username || id}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (selectedUser?.id === id) setSelectedUser(null);
      fetchCustomers(pagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const getRoleBadge = (roles: any) => {
    if (!roles) return null;
    const colors: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-400 border-red-500/20',
      customer: 'bg-green-500/10 text-green-400 border-green-500/20',
      wholesale: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      employee: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      b2b: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    const cls = colors[roles.slug] || 'bg-gray-800 text-gray-400 border-gray-700';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${cls}`}>
        {roles.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Customers
          </h2>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} registered accounts</p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl backdrop-blur-sm">
            <Search className="w-5 h-5 text-gray-500 ml-2" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white px-4 py-1 w-64 outline-none"
            />
          </div>
          <Link
            href="/crown-admin/customers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
          >
            Create User
          </Link>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800/50 text-xs uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">First Name</th>
                <th className="px-6 py-4 font-medium">Last Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                      {customer.username || '-'}
                    </td>
                    <td className="px-6 py-4">{customer.first_name || '-'}</td>
                    <td className="px-6 py-4">{customer.last_name || '-'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {customer.email}
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(customer.roles)}</td>
                    <td className="px-6 py-4">
                      <span className={`capitalize ${
                        customer.status === 'approved' ? 'text-emerald-400' :
                        customer.status === 'pending' ? 'text-amber-400' :
                        customer.status === 'rejected' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {customer.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/crown-admin/customers/${customer.id}`}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors mr-2 inline-flex"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {customer.roles?.slug !== 'admin' && (
                        <button
                          onClick={() => handleDelete(customer.id, customer.username)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/50">
            <button onClick={() => fetchCustomers(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => fetchCustomers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors text-gray-400 hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
