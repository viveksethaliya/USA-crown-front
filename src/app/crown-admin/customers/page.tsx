'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Mail, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/types/admin';

import { ADMIN_API as API } from '@/lib/config';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
      if (roleFilter) params.set('role', roleFilter);
      if (yearFilter) params.set('year', yearFilter);
      const res = await fetch(`${API}/customers?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      setCustomers(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, yearFilter]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username || id}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API}/customers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchCustomers(pagination.page);
    } catch (error) { console.error(error); }
  };

  const getRoleBadge = (roles: any) => {
    if (!roles) return null;
    const colors: Record<string, string> = {
      admin: 'bg-[#312f2c]/10 text-[#312f2c] border-[#312f2c]/20',
      customer: 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20',
      wholesale: 'bg-[#d1a054]/15 text-[#d1a054] border-[#d1a054]/25',
      employee: 'bg-[#312f2c]/8 text-[#312f2c]/70 border-[#312f2c]/15',
      'sub-user': 'bg-[#312f2c]/8 text-[#312f2c]/70 border-[#312f2c]/15',
      b2b: 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20',
    };
    const cls = colors[roles.slug] || 'bg-[#312f2c]/6 text-[#312f2c]/60 border-[#312f2c]/10';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${cls}`}>
        {roles.name}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-[#d1a054]';
    if (status === 'pending') return 'text-[#312f2c]/60';
    if (status === 'rejected') return 'text-red-500';
    return 'text-[#312f2c]/50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Customers</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">{pagination.total} registered accounts</p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/60 p-2 border border-[#312f2c]/10 rounded-xl flex-grow sm:flex-grow-0">
            <Search className="w-5 h-5 text-[#312f2c]/35 ml-2" />
            <input
              type="text"
              placeholder="Search by ID, Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-1 w-64 outline-none text-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-3 py-2.5 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="sub-user">Sub-User</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-3 py-2.5 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
          >
            <option value="">All Years</option>
            {Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          <Link
            href="/crown-admin/customers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-xl font-medium transition-colors shadow-sm"
          >
            Create User
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#312f2c]/60">
            <thead className="bg-[#312f2c]/5 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/10">
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
            <tbody className="divide-y divide-[#312f2c]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#312f2c]/40">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-[#312f2c]/4 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#312f2c] whitespace-nowrap">
                      {customer.username || '-'}
                    </td>
                    <td className="px-6 py-4 text-[#312f2c]/70">{customer.first_name || '-'}</td>
                    <td className="px-6 py-4 text-[#312f2c]/70">{customer.last_name || '-'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#312f2c]/35" />
                      <span className="text-[#312f2c]/70">{customer.email}</span>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(customer.roles)}</td>
                    <td className="px-6 py-4">
                      <span className={`capitalize font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#312f2c]/50">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/crown-admin/customers/${customer.id}`}
                        className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors mr-1 inline-flex"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {customer.roles?.slug !== 'admin' && (
                        <button
                          onClick={() => handleDelete(customer.id, customer.username)}
                          className="p-2 text-[#312f2c]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#312f2c]/10">
            <button onClick={() => fetchCustomers(pagination.page - 1)} disabled={pagination.page === 1}
              className="p-2 hover:bg-[#312f2c]/8 rounded-lg disabled:opacity-30 transition-colors text-[#312f2c]/50 hover:text-[#312f2c]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#312f2c]/50">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => fetchCustomers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-[#312f2c]/8 rounded-lg disabled:opacity-30 transition-colors text-[#312f2c]/50 hover:text-[#312f2c]">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
