'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ShoppingCart, ChevronRight, Search, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'updatedAt' | 'subtotal' | 'customer' | 'company'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'updatedAt' | 'subtotal' | 'customer' | 'company') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'updatedAt' || field === 'subtotal' ? 'desc' : 'asc');
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/carts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch carts');
      const data = await res.json();
      setCarts(data.data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (userId: string) => {
    setSendingReminder(userId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/carts/${userId}/remind`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to send reminder');
      toast.success('Reminder sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSendingReminder(null);
    }
  };

  const filteredCarts = carts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = c.customer?.id?.toLowerCase() || '';
    const name = `${c.customer?.firstName} ${c.customer?.lastName}`.toLowerCase();
    const email = c.customer?.email?.toLowerCase() || '';
    const company = c.customer?.companyName?.toLowerCase() || '';
    const phone = c.customer?.phone?.toLowerCase() || '';

    if (searchField === 'id') return id.includes(q);
    if (searchField === 'name') return name.includes(q);
    if (searchField === 'email') return email.includes(q);
    if (searchField === 'phone') return phone.includes(q);

    return id.includes(q) || name.includes(q) || email.includes(q) || company.includes(q) || phone.includes(q);
  });

  const sortedCarts = [...filteredCarts].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'customer') {
      const nameA = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim().toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortField === 'company') {
      const compA = (a.customer?.companyName || '').toLowerCase();
      const compB = (b.customer?.companyName || '').toLowerCase();
      comparison = compA.localeCompare(compB);
    } else if (sortField === 'subtotal') {
      comparison = (a.subtotal || 0) - (b.subtotal || 0);
    } else { // updatedAt
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const isUntouched = (updatedAt: string) => {
    const days = (new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 3600 * 24);
    return days > 10;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Active Carts</h1>
          <p className="text-sm text-[#312f2c]/60 mt-1">Manage active shopping carts for customers.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#312f2c]/10 overflow-hidden">
        <div className="p-4 border-b border-[#312f2c]/10 bg-[#f8f7f5] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-white border border-[#312f2c]/12 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#d1a054] text-[#312f2c]"
            >
              <option value="all">All Fields</option>
              <option value="id">User ID</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d1a054] text-[#312f2c]"
              />
            </div>
          </div>
          <div className="text-sm text-[#312f2c]/60">
            Total Active: <strong className="text-[#312f2c]">{filteredCarts.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="p-12 text-center text-[#312f2c]/50">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-[#312f2c]/20" />
            <p>No active carts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-[#312f2c]/50 border-b border-[#312f2c]/10 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#312f2c]/5 transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center gap-1">Customer {sortField === 'customer' && <span className="text-[#d1a054]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#312f2c]/5 transition-colors" onClick={() => handleSort('company')}>
                    <div className="flex items-center gap-1">Company {sortField === 'company' && <span className="text-[#d1a054]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                  </th>
                  <th className="px-6 py-4 text-center">Total Items</th>
                  <th className="px-6 py-4 text-center">Unique Products</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#312f2c]/5 transition-colors text-right" onClick={() => handleSort('subtotal')}>
                    <div className="flex items-center justify-end gap-1">Cart Value {sortField === 'subtotal' && <span className="text-[#d1a054]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#312f2c]/5 transition-colors" onClick={() => handleSort('updatedAt')}>
                    <div className="flex items-center gap-1">Last Updated {sortField === 'updatedAt' && <span className="text-[#d1a054]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {sortedCarts.map(cart => {
                  const untouched = isUntouched(cart.updatedAt);
                  return (
                  <tr key={cart.id} className="hover:bg-[#f8f7f5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#312f2c]">
                        {cart.customer?.firstName} {cart.customer?.lastName}
                      </div>
                      <div className="text-xs text-[#312f2c]/50 mt-0.5">{cart.customer?.email}</div>
                      <div className="text-[10px] text-[#312f2c]/40 mt-1 uppercase tracking-wider font-mono">ID: {cart.customer?.id}</div>
                    </td>
                    <td className="px-6 py-4 text-[#312f2c]/70">
                      {cart.customer?.companyName || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-[#312f2c]/5 text-[#312f2c] rounded font-medium">
                        {cart.itemCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[#312f2c]/70">
                      {cart.uniqueItemCount}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#312f2c]">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cart.subtotal || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#312f2c]/60">
                      {new Date(cart.updatedAt).toLocaleDateString()} at {new Date(cart.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button
                        onClick={() => handleSendReminder(cart.userId)}
                        disabled={sendingReminder === cart.userId}
                        className={`inline-flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50 ${untouched ? 'text-red-500 hover:text-red-600 animate-pulse hover:animate-none' : 'text-[#312f2c]/60 hover:text-[#d1a054]'}`}
                        title={untouched ? 'Cart untouched for >10 days! Send a reminder.' : 'Send reminder email'}
                      >
                        {sendingReminder === cart.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Remind
                      </button>
                      <Link 
                        href={`/crown-admin/carts/${cart.userId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#d1a054] hover:text-[#b08544] transition-colors"
                      >
                        Manage Cart
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
