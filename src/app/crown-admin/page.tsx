'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, Users, Clock, DollarSign, ShoppingCart, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ADMIN_API as API } from '@/lib/config';

interface DashboardStats {
  revenue: {
    current: number;
    trend: number;
  };
  newCustomers: number;
  pendingApprovals: number;
  abandonedCarts: number;
  recentOrders: any[];
  topProducts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await fetch(`${API}/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error('Failed to load stats', err); }
      finally { setIsLoading(false); }
    };
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-[#312f2c]/45">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const statCards = [
    {
      label: 'Revenue (This Month)',
      value: formatCurrency(stats.revenue.current),
      icon: DollarSign,
      href: '/crown-admin/orders',
      accent: false,
      trend: stats.revenue.trend
    },
    {
      label: 'New Customers (7d)',
      value: stats.newCustomers,
      icon: Users,
      href: '/crown-admin/customers',
      accent: false,
    },
    {
      label: 'Pending B2B Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      href: '/crown-admin/b2b',
      accent: stats.pendingApprovals > 0,
    },
    {
      label: 'Abandoned Carts (Active)',
      value: stats.abandonedCarts,
      icon: ShoppingCart,
      href: '/crown-admin/carts',
      accent: stats.abandonedCarts > 0,
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-[#312f2c]">Dashboard Overview</h2>
        <p className="text-[#312f2c]/50 text-sm mt-1">Here is what is happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, href, accent, trend }, idx) => (
          <Link key={idx} href={href}
            className={`group bg-white p-6 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden ${
              accent ? 'border-[#d1a054]/40 shadow-sm' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'
            }`}>
            {accent && <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d1a054]" />}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[#312f2c]/50 text-xs font-semibold mb-3 uppercase tracking-wider">{label}</h3>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-bold ${accent ? 'text-[#d1a054]' : 'text-[#312f2c]'}`}>
                    {value}
                  </p>
                </div>
                {trend !== undefined && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend).toFixed(1)}% vs last month
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl ${accent ? 'bg-[#d1a054]/12 text-[#d1a054]' : 'bg-[#312f2c]/6 text-[#312f2c]/40 group-hover:text-[#d1a054] group-hover:bg-[#d1a054]/10 transition-colors'}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#312f2c]/10 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#312f2c]/10 flex items-center justify-between">
            <h3 className="font-bold text-[#312f2c]">Recent Orders</h3>
            <Link href="/crown-admin/orders" className="text-sm font-medium text-[#d1a054] hover:text-[#d1a054]/80 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#ece9e1]/50 border-b border-[#312f2c]/10 text-[#312f2c]/60 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5 text-sm">
                {stats.recentOrders.length > 0 ? stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#ece9e1]/20 transition-colors">
                    <td className="p-4 font-medium text-[#312f2c]">
                      <Link href={`/crown-admin/orders/${order.id}`} className="hover:text-[#d1a054]">{order.orderNumber}</Link>
                    </td>
                    <td className="p-4 text-[#312f2c]/80">{order.customerName}</td>
                    <td className="p-4 text-[#312f2c]/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-[#312f2c]">{formatCurrency(order.total)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#312f2c]/40">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-[#312f2c]/10 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-[#312f2c]/10 flex items-center justify-between">
            <h3 className="font-bold text-[#312f2c]">Top Products (30d)</h3>
            <Package className="w-4 h-4 text-[#312f2c]/40" />
          </div>
          <div className="p-5 flex-1">
            {stats.topProducts.length > 0 ? (
              <div className="space-y-6">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#d1a054]/10 text-[#d1a054] font-bold flex items-center justify-center text-sm flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#312f2c] truncate" title={product.name}>{product.name}</p>
                      <p className="text-xs text-[#312f2c]/50 mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#312f2c]">{product.quantitySold}</p>
                      <p className="text-[10px] text-[#312f2c]/50 uppercase tracking-wider">Sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#312f2c]/40 text-sm">
                No product data available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
