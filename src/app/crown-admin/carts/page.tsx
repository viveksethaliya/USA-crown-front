'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ShoppingCart, ChevronRight, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredCarts = carts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${c.customer?.firstName} ${c.customer?.lastName}`.toLowerCase();
    const email = c.customer?.email?.toLowerCase() || '';
    const company = c.customer?.companyName?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || company.includes(q);
  });

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
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
            <input
              type="text"
              placeholder="Search by customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#312f2c]/12 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d1a054] text-[#312f2c]"
            />
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
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-center">Total Items</th>
                  <th className="px-6 py-4 text-center">Unique Products</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {filteredCarts.map(cart => (
                  <tr key={cart.id} className="hover:bg-[#f8f7f5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#312f2c]">
                        {cart.customer?.firstName} {cart.customer?.lastName}
                      </div>
                      <div className="text-xs text-[#312f2c]/50 mt-0.5">{cart.customer?.email}</div>
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
                    <td className="px-6 py-4 text-[#312f2c]/60 text-xs">
                      {new Date(cart.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/crown-admin/carts/${cart.userId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#d1a054] hover:text-[#b08544] transition-colors"
                      >
                        Manage Cart
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
