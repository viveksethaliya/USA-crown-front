'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, ShoppingCart, DollarSign, Calendar, Filter } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

const COLORS = ['#d1a054', '#312f2c', '#8a7d65', '#d4c9b9', '#a69a84'];

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#312f2c]/10 p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-[#312f2c] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('value') ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [salesData, setSalesData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [breakdownData, setBreakdownData] = useState<any>(null);

  // Filters
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = new URLSearchParams({ startDate, endDate });
      const salesParams = new URLSearchParams({ startDate, endDate, interval });
      const customerParams = new URLSearchParams({ startDate, endDate });
      if (roleFilter !== 'all') customerParams.append('role', roleFilter);

      const [salesRes, custRes, breakRes] = await Promise.all([
        adminFetch(`${API}/analytics/sales?${salesParams}`, { headers }),
        adminFetch(`${API}/analytics/customers?${customerParams}`, { headers }),
        adminFetch(`${API}/analytics/breakdown?${params}`, { headers })
      ]);

      if (!salesRes.ok || !custRes.ok || !breakRes.ok) throw new Error('Failed to load analytics data');

      setSalesData(await salesRes.json());
      setCustomerData(await custRes.json());
      setBreakdownData(await breakRes.json());
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, interval, roleFilter]);

  if (isLoading && !salesData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Analytics & Reporting</h2>
          <p className="text-[#312f2c]/50 text-sm mt-1">Deep dive into sales and customer trends.</p>
        </div>
        
        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-[#312f2c]/10 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-[#312f2c]/40" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-[#312f2c] cursor-pointer"
            />
            <span className="text-[#312f2c]/40">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-[#312f2c] cursor-pointer"
            />
          </div>
          <div className="h-6 w-px bg-[#312f2c]/10" />
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-[#312f2c]/40" />
            <select 
              value={interval} 
              onChange={e => setInterval(e.target.value as any)}
              className="text-sm border-none bg-transparent focus:ring-0 text-[#312f2c] cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {isRefreshing && (
        <div className="flex items-center gap-2 text-xs font-medium text-[#d1a054] bg-[#d1a054]/10 px-3 py-1.5 rounded-lg w-max">
          <Loader2 className="w-3 h-3 animate-spin" /> Updating reports...
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#312f2c]/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg"><DollarSign className="w-4 h-4" /></div>
            <h3 className="text-sm font-semibold text-[#312f2c]/50 uppercase tracking-wider">Total Sales</h3>
          </div>
          <p className="text-2xl font-bold text-[#312f2c]">{formatCurrency(salesData?.summary?.totalRevenue || 0)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-[#312f2c]/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#312f2c]/5 text-[#312f2c]/40 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
            <h3 className="text-sm font-semibold text-[#312f2c]/50 uppercase tracking-wider">Avg Order Value</h3>
          </div>
          <p className="text-2xl font-bold text-[#312f2c]">{formatCurrency(salesData?.summary?.averageOrderValue || 0)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#312f2c]/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#312f2c]/5 text-[#312f2c]/40 rounded-lg"><ShoppingCart className="w-4 h-4" /></div>
            <h3 className="text-sm font-semibold text-[#312f2c]/50 uppercase tracking-wider">Total Orders</h3>
          </div>
          <p className="text-2xl font-bold text-[#312f2c]">{salesData?.summary?.totalOrders || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#312f2c]/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#312f2c]/5 text-[#312f2c]/40 rounded-lg"><Users className="w-4 h-4" /></div>
            <h3 className="text-sm font-semibold text-[#312f2c]/50 uppercase tracking-wider">Unique Customers</h3>
          </div>
          <p className="text-2xl font-bold text-[#312f2c]">{customerData?.topCustomers?.length || 0}</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-[#312f2c]/10">
        <h3 className="text-lg font-bold text-[#312f2c] mb-6">Sales Trend ({interval})</h3>
        <div className="h-80 w-full">
          {salesData?.timeline && salesData.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#d1a054" strokeWidth={3} dot={{ r: 4, fill: '#d1a054', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#312f2c]/40 text-sm">No sales data for this period.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-2xl border border-[#312f2c]/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#312f2c]">Top Customers (Revenue)</h3>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className="text-xs bg-[#ece9e1] border-none rounded-lg text-[#312f2c] focus:ring-0"
            >
              <option value="all">All Roles</option>
              <option value="customer">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
          <div className="h-64 w-full">
            {customerData?.topCustomers && customerData.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData.topCustomers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#312f2c' }} width={100} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#312f2c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#312f2c]/40 text-sm">No customer data for this period.</div>
            )}
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* New vs Returning */}
          <div className="bg-white p-6 rounded-2xl border border-[#312f2c]/10">
            <h3 className="text-lg font-bold text-[#312f2c] mb-2 text-center">New vs Returning</h3>
            <p className="text-[10px] text-center text-[#312f2c]/40 mb-4 uppercase tracking-wider">Revenue Share</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData?.retention || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(customerData?.retention || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {(customerData?.retention || []).map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[#312f2c]/70">{entry.name}</span>
                  </div>
                  <span className="font-bold text-[#312f2c]">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-[#312f2c]/10">
            <h3 className="text-lg font-bold text-[#312f2c] mb-2 text-center">Category Sales</h3>
            <p className="text-[10px] text-center text-[#312f2c]/40 mb-4 uppercase tracking-wider">Revenue Breakdown</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    labelLine={false}
                  >
                    {(breakdownData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-24 pr-2 custom-scrollbar">
              {(breakdownData || []).map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-3 h-3 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                    <span className="text-[#312f2c]/70 truncate">{entry.name}</span>
                  </div>
                  <span className="font-bold text-[#312f2c]">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
