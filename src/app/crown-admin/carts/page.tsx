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
    <div className="flex flex-col h-full gap-6 -m-4 sm:m-0">
      <div className="shrink-0 px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Active Carts</h1>
        <p className="text-sm text-[#312f2c]/60 mt-1">Manage active shopping carts for customers.</p>
      </div>

      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all w-full sm:w-auto outline-none"
            >
              <option value="all">All Fields</option>
              <option value="id">User ID</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
              <input
                type="text"
                placeholder="Search carts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/60 border border-white/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm placeholder:text-[#312f2c]/40 transition-all outline-none"
              />
            </div>
          </div>
          <div className="text-sm font-bold text-[#312f2c]/60 bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] whitespace-nowrap">
            Total Active: <strong className="text-[#312f2c] text-lg ml-1">{filteredCarts.length}</strong>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white/50 border border-white/60 rounded-2xl shadow-inner">
          {loading ? (
            <div className="p-12 flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
            </div>
          ) : filteredCarts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center h-full text-[#312f2c]/40">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No active carts found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-[#f8f7f5]/90 backdrop-blur-md text-[#312f2c]/50 border-b border-[#312f2c]/10 text-xs uppercase font-bold z-10 shadow-sm">
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
                    <tr key={cart.id} className="hover:bg-white/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#312f2c]">
                          {cart.customer?.firstName} {cart.customer?.lastName}
                        </div>
                        <div className="text-xs text-[#312f2c]/60 mt-0.5 font-medium">{cart.customer?.email}</div>
                        <div className="text-[10px] text-[#312f2c]/40 mt-1 uppercase tracking-wider font-bold">ID: {cart.customer?.id}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#312f2c]/80">
                        {cart.customer?.companyName || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-white border border-white shadow-sm text-[#312f2c] rounded-lg font-bold">
                          {cart.itemCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#312f2c]/70">
                        {cart.uniqueItemCount}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#312f2c]">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cart.subtotal || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#312f2c]/60">
                        {new Date(cart.updatedAt).toLocaleDateString()} at {new Date(cart.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button
                          onClick={() => handleSendReminder(cart.userId)}
                          disabled={sendingReminder === cart.userId}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-50 ${untouched ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-500/20' : 'bg-white/60 text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-white border border-white/80'}`}
                          title={untouched ? 'Cart untouched for >10 days! Send a reminder.' : 'Send reminder email'}
                        >
                          {sendingReminder === cart.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          Remind
                        </button>
                        <Link
                          href={`/crown-admin/carts/${cart.userId}`}
                          className="inline-flex items-center gap-1 text-sm font-bold text-[#d1a054] hover:text-[#b08544] transition-colors"
                        >
                          Manage Cart
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
