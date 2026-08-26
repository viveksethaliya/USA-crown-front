'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, Users, Clock, DollarSign, ShoppingCart, TrendingUp, TrendingDown, ArrowRight, BarChart2, LayoutDashboard, Download } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';

import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [reportType, setReportType] = useState<'sales' | 'customers'>('sales');
  const [datePreset, setDatePreset] = useState<'year' | 'last_month' | 'this_month' | 'last_7_days' | 'custom'>('last_7_days');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [salesToggles, setSalesToggles] = useState({ gross: true, net: false, orders: false, items: false, refunds: false, shipping: false, coupons: false });
  const [customerToggles, setCustomerToggles] = useState({ signups: true, sales: false });

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    
    if (datePreset === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    } else if (datePreset === 'last_month') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else if (datePreset === 'this_month') {
      start.setDate(1);
    } else if (datePreset === 'last_7_days') {
      start.setDate(start.getDate() - 7);
    }
    
    if (datePreset !== 'custom') {
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    }
  }, [datePreset]);

  useEffect(() => {
    if (activeTab === 'reports' && startDate && endDate) {
      const fetchReport = async () => {
        setIsReportLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
          const endpoint = reportType === 'sales' ? '/analytics/sales' : '/analytics/customers';
          const res = await adminFetch(`${API}${endpoint}?startDate=${startDate}&endDate=${endDate}&interval=daily`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setReportData(data.timeline || []);
            setReportSummary(data.summary || null);
          }
        } catch (err) {
          console.error('Failed to load report data', err);
        } finally {
          setIsReportLoading(false);
        }
      };
      fetchReport();
    }
  }, [activeTab, reportType, startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    
    const headers = reportType === 'sales' 
      ? ['Date', 'Gross Sales', 'Net Sales', 'Orders Placed', 'Items Purchased', 'Refunded Amount', 'Charged For Shipping', 'Coupons Used']
      : ['Date', 'Signups', 'Customer Sales', 'Guest Sales'];
      
    const rows = reportData.map(row => {
      if (reportType === 'sales') {
        return [row.name, row.grossSales || 0, row.netSales || 0, row.ordersPlaced || 0, row.itemsPurchased || 0, row.refundedAmount || 0, row.chargedForShipping || 0, row.couponsUsed || 0];
      }
      return [row.name, row.signups || 0, row.customerSales || 0, row.guestSales || 0];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await adminFetch(`${API}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
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
      href: '/crown-admin/customers',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Dashboard</h2>
          <p className="text-[#312f2c]/50 text-sm mt-1">
            {activeTab === 'overview' ? 'Here is what is happening with your store today.' : 'Analyze your sales performance over time.'}
          </p>
        </div>
        <div className="flex bg-[#312f2c]/5 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white text-[#d1a054] shadow-sm' : 'text-[#312f2c]/60 hover:text-[#312f2c]'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white text-[#d1a054] shadow-sm' : 'text-[#312f2c]/60 hover:text-[#312f2c]'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Reports
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
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
      </>
      ) : (
        <div className="bg-white rounded-2xl border border-[#312f2c]/10 shadow-sm overflow-hidden flex flex-col">
          {/* Sub Nav & Date Controls */}
          <div className="bg-[#fcfbf9] border-b border-[#312f2c]/10 p-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              <div className="flex items-center gap-2 border-r border-[#312f2c]/10 pr-6">
                <button 
                  onClick={() => setReportType('sales')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${reportType === 'sales' ? 'bg-[#312f2c] text-white' : 'text-[#312f2c]/60 hover:bg-[#312f2c]/5'}`}
                >
                  Sales
                </button>
                <button 
                  onClick={() => setReportType('customers')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${reportType === 'customers' ? 'bg-[#312f2c] text-white' : 'text-[#312f2c]/60 hover:bg-[#312f2c]/5'}`}
                >
                  Customers
                </button>
              </div>

              <div className="flex-1 overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
                <div className="flex items-center gap-1 min-w-max">
                  {['year', 'last_month', 'this_month', 'last_7_days'].map((preset) => (
                    <button 
                      key={preset}
                      onClick={() => setDatePreset(preset as any)}
                      className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-lg transition-colors ${datePreset === preset ? 'text-[#d1a054] bg-[#d1a054]/10' : 'text-[#312f2c]/60 hover:bg-[#312f2c]/5'}`}
                    >
                      {preset.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                  
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider">Custom:</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => { setDatePreset('custom'); setStartDate(e.target.value); }}
                      className="bg-white border border-[#312f2c]/10 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#d1a054]"
                    />
                    <span className="text-[#312f2c]/30">-</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => { setDatePreset('custom'); setEndDate(e.target.value); }}
                      className="bg-white border border-[#312f2c]/10 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#d1a054]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center pl-6 border-l border-[#312f2c]/10">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>

            </div>
          </div>

          {/* Main Layout: Sidebar + Chart */}
          <div className="flex flex-col md:flex-row border-t border-[#312f2c]/5 min-h-[500px]">
            
            {/* Sidebar Metrics */}
            <div className="w-full md:w-64 border-r border-[#312f2c]/10 bg-[#fdfdfc] flex flex-col">
              {isReportLoading || !reportSummary ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#d1a054]" /></div>
              ) : reportType === 'sales' ? (
                <>
                  <button onClick={() => setSalesToggles(prev => ({...prev, gross: !prev.gross}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.gross ? 'border-l-blue-400 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{formatCurrency(reportSummary.grossSales)}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">gross sales in this period</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, net: !prev.net}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.net ? 'border-l-blue-600 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{formatCurrency(reportSummary.netSales)}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">net sales in this period</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, orders: !prev.orders}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.orders ? 'border-l-gray-400 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{reportSummary.ordersPlaced}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">orders placed</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, items: !prev.items}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.items ? 'border-l-gray-300 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{reportSummary.itemsPurchased}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">items purchased</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, refunds: !prev.refunds}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.refunds ? 'border-l-red-500 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{formatCurrency(reportSummary.refundedAmount)}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">refunded {reportSummary.refundedOrdersCount} orders ({reportSummary.refundedItemsCount} items)</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, shipping: !prev.shipping}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.shipping ? 'border-l-emerald-400 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{formatCurrency(reportSummary.chargedForShipping)}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">charged for shipping</div>
                  </button>
                  <button onClick={() => setSalesToggles(prev => ({...prev, coupons: !prev.coupons}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${salesToggles.coupons ? 'border-l-amber-400 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-xl font-medium text-[#312f2c]">{formatCurrency(reportSummary.couponsUsed)}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">worth of coupons used</div>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setCustomerToggles(prev => ({...prev, signups: !prev.signups}))} className={`p-4 text-left border-l-4 border-b border-b-[#312f2c]/5 transition-colors hover:bg-white ${customerToggles.signups ? 'border-l-blue-400 bg-white shadow-sm' : 'border-l-transparent bg-transparent'}`}>
                    <div className="text-2xl font-medium text-[#312f2c] mb-1">{reportSummary.signups}</div>
                    <div className="text-xs text-[#312f2c]/50 font-medium">signups in this period</div>
                  </button>
                  <div className="mt-8 p-4">
                    <button onClick={() => setCustomerToggles(prev => ({...prev, sales: !prev.sales}))} className={`flex items-center gap-2 mb-2 transition-opacity ${customerToggles.sales ? 'opacity-100' : 'opacity-50'}`}>
                      <div className="w-8 h-0.5 bg-emerald-400"></div>
                      <span className="text-xs font-medium text-[#312f2c]">Customer sales</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Chart Area */}
            <div className="flex-1 p-6 relative">
              {isReportLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
                </div>
              ) : reportData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[#312f2c]/40 font-medium">
                  No data available for this date range.
                </div>
              ) : null}
              
              <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                <ComposedChart data={reportData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#312f2c" strokeOpacity={0.06} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#312f2c', strokeOpacity: 0.1 }}
                    tickLine={false} 
                    tick={{ fill: '#312f2c', opacity: 0.4, fontSize: 10 }} 
                    dy={10}
                    tickFormatter={(val) => {
                      const d = new Date(val + 'T12:00:00Z');
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                  />
                  
                  {/* Y Axis Currency (Left) */}
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#312f2c', opacity: 0.4, fontSize: 10 }}
                    tickFormatter={(val) => val > 0 ? (val >= 1000 ? (val/1000).toFixed(1) + 'k' : val) : '0'}
                  />
                  
                  {/* Y Axis Count (Right) */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#312f2c', opacity: 0.4, fontSize: 10 }}
                  />

                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(49, 47, 44, 0.1)', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#312f2c', fontWeight: 'bold', marginBottom: '8px' }}
                    itemStyle={{ fontSize: '13px' }}
                    labelFormatter={(label) => {
                      const d = new Date(label + 'T12:00:00Z');
                      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    }}
                    formatter={(value: number, name: string) => {
                      if (name.toLowerCase().includes('sales') || name.toLowerCase().includes('refund') || name.toLowerCase().includes('shipping') || name.toLowerCase().includes('coupon')) {
                        return [formatCurrency(value), name];
                      }
                      return [value, name];
                    }}
                  />

                  {/* Sales Metrics */}
                  {reportType === 'sales' && salesToggles.gross && (
                    <Line yAxisId="left" type="monotone" dataKey="grossSales" name="Gross Sales" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#60a5fa', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.net && (
                    <Line yAxisId="left" type="monotone" dataKey="netSales" name="Net Sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.orders && (
                    <Line yAxisId="right" type="monotone" dataKey="ordersPlaced" name="Orders Placed" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#9ca3af', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.items && (
                    <Line yAxisId="right" type="monotone" dataKey="itemsPurchased" name="Items Purchased" stroke="#d1d5db" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#d1d5db', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.refunds && (
                    <Line yAxisId="left" type="monotone" dataKey="refundedAmount" name="Refunds" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.shipping && (
                    <Line yAxisId="left" type="monotone" dataKey="chargedForShipping" name="Shipping" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#34d399', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'sales' && salesToggles.coupons && (
                    <Line yAxisId="left" type="monotone" dataKey="couponsUsed" name="Coupons" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#fbbf24', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}

                  {/* Customer Metrics */}
                  {reportType === 'customers' && customerToggles.signups && (
                    <Line yAxisId="right" type="monotone" dataKey="signups" name="Signups" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#60a5fa', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                  {reportType === 'customers' && customerToggles.sales && (
                    <Line yAxisId="left" type="monotone" dataKey="customerSales" name="Customer Sales" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#34d399', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
