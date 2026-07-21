'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, ChevronRight, Package, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  total: number;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string | null;
  };
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Order status updated');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase().includes(q) ||
      (o.customer?.email || '').toLowerCase().includes(q) ||
      (o.customer?.companyName || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#312f2c]">Orders</h1>
          <p className="text-sm text-[#312f2c]/60 mt-1">
            Manage customer orders and update their fulfillment status.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#312f2c]/40" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#312f2c]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/20 focus:border-[#d1a054] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#312f2c]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f8f7f5] border-b border-[#312f2c]/10">
                <th className="px-6 py-4 font-medium text-[#312f2c]/60">Order</th>
                <th className="px-6 py-4 font-medium text-[#312f2c]/60">Date</th>
                <th className="px-6 py-4 font-medium text-[#312f2c]/60">Customer</th>
                <th className="px-6 py-4 font-medium text-[#312f2c]/60">Items</th>
                <th className="px-6 py-4 font-medium text-[#312f2c]/60">Total</th>
                <th className="px-6 py-4 font-medium text-[#312f2c]/60 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312f2c]/5">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-[#f8f7f5] transition-colors cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#312f2c]">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-[#312f2c]/70">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#312f2c]">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </span>
                          {order.customer?.companyName && (
                            <span className="text-xs text-[#312f2c]/50">
                              {order.customer.companyName}
                            </span>
                          )}
                          <span className="text-xs text-[#312f2c]/50">
                            {order.customer?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#312f2c]/40" />
                          <span>{order.itemCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#312f2c]">
                          ${order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className={`text-xs px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-[#faf9f8]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white border border-[#312f2c]/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-[#312f2c] mb-3">Order Items</h4>
                            {order.order_items && order.order_items.length > 0 ? (
                              <table className="w-full text-sm text-left">
                                <thead className="bg-[#f8f7f5] text-[#312f2c]/60">
                                  <tr>
                                    <th className="px-4 py-2 font-medium rounded-l-lg">Product</th>
                                    <th className="px-4 py-2 font-medium">Quantity</th>
                                    <th className="px-4 py-2 font-medium">Price</th>
                                    <th className="px-4 py-2 font-medium rounded-r-lg text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#312f2c]/5">
                                  {order.order_items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-3 text-[#312f2c]">{item.product_name}</td>
                                      <td className="px-4 py-3 text-[#312f2c]/70">{item.quantity}</td>
                                      <td className="px-4 py-3 text-[#312f2c]/70">${Number(item.unit_price).toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right font-medium text-[#312f2c]">${Number(item.line_total).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-sm text-[#312f2c]/50 italic">No items found for this order.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#312f2c]/40">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
