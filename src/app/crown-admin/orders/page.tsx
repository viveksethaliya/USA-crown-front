'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Download, Eye, FileText, Loader2, Plus, Search, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const statusClass = (status: string) => {
  if (status === 'completed' || status === 'paid') return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (status === 'cancelled' || status === 'failed' || status === 'refunded') return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (status === 'processing') return 'bg-[#d1a054]/15 text-[#9b7132] border-[#d1a054]/25';
  return 'bg-[#312f2c]/6 text-[#312f2c]/60 border-[#312f2c]/10';
};

export default function OrdersPage() {
  const [activeReturnOrders, setActiveReturnOrders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchActiveReturns = useCallback(async () => {
    try {
      const response = await adminFetch(`${API}/orders?active_returns_only=true`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const json = await response.json();
      if (response.ok) {
        setActiveReturnOrders(json.data || []);
        return json.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load active returns', error);
      return [];
    }
  }, []);

  const fetchOrders = useCallback(async (reset = true) => {
    if (reset) {
      setLoadingInitial(true);
      setOrders([]);
      setHasMore(true);
      setTotalCount(0);
    } else {
      setLoadingMore(true);
    }

    try {
      let activeList = activeReturnOrders;
      if (reset) {
         activeList = await fetchActiveReturns();
      }

      const params = new URLSearchParams({ limit: '25', search_field: searchField });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status) params.set('status', status);
      if (paymentStatus) params.set('payment_status', paymentStatus);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      
      const excludeIds = activeList.map((o: any) => o.id).join(',');
      if (excludeIds) params.set('exclude_ids', excludeIds);

      // We need to use cursor from current orders if not resetting
      // However, fetchOrders could be called with stale orders state if not careful.
      // We will access orders state directly from functional update or use ref.
      // But since we include orders in dependencies, it's fine.
      if (!reset && orders.length > 0) {
        const lastOrder = orders[orders.length - 1];
        params.set('cursor_date', lastOrder.created_at);
        params.set('cursor_id', String(lastOrder.id));
      }

      const response = await adminFetch(`${API}/orders?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to load orders');
      
      const newData = json.data || [];
      if (newData.length < 25) setHasMore(false);
      
      if (reset) {
        setTotalCount((json.pagination?.total || 0) + activeList.length);
      }
      
      setOrders(prev => reset ? newData : [...prev, ...newData]);
    } catch (error: any) {
      toast.error(error.message || 'Unable to load orders');
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, searchField, status, paymentStatus, dateFrom, dateTo, orders, activeReturnOrders, fetchActiveReturns]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchOrders(true); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, searchField, status, paymentStatus, dateFrom, dateTo]);

  useEffect(() => {
    if (loadingInitial || loadingMore || !hasMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchOrders(false);
      }
    }, { rootMargin: '200px' });
    
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingInitial, loadingMore, hasMore, fetchOrders]);

  const exportOrders = async () => {
    setExporting(true);
    try {
      const response = await adminFetch(`${API}/orders/export`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      if (!response.ok) throw new Error('Export failed');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Orders exported');
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const renderOrderRow = (order: any, isActiveReturn: boolean) => (
    <tr key={order.id} className={`group transition-colors ${isActiveReturn ? 'bg-[#d1a054]/5 hover:bg-[#d1a054]/10' : 'hover:bg-white/70'}`}>
      <td className="p-4 pl-6">
        <p className="font-bold text-[#312f2c]">{order.order_number || `#${order.id}`}</p>
        <p className="mt-1 text-[11px] font-medium text-[#312f2c]/40">ID: {order.id}</p>
      </td>
      <td className="p-4 font-mono text-xs font-medium text-[#312f2c]/65">{order.customer?.username || '—'}</td>
      <td className="p-4">
        <p className="font-semibold text-[#312f2c]">{`${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || '—'}</p>
        <p className="mt-1 text-xs text-[#312f2c]/50">{order.customer?.email || '—'}</p>
      </td>
      <td className="p-4 font-bold text-[#312f2c]/70">{order.item_count}</td>
      <td className="p-4">
        <div className="flex flex-col gap-2 items-start">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(order.status)}`}>{order.status}</span>
          {isActiveReturn && (
             <>
               {order.latest_active_return && (
                 <div className="flex items-center gap-1.5 text-[#d1a054] text-[10px] font-bold uppercase tracking-wide">
                   <span className="w-2.5 h-2.5 rounded-full bg-[#d1a054] animate-pulse flex-shrink-0" />
                   Return: {order.latest_active_return.status}
                 </div>
               )}
               {!order.latest_active_return && order.cancellation_requested_at && (
                 <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold uppercase tracking-wide">
                   <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
                   Cancel Requested
                 </div>
               )}
             </>
          )}
        </div>
      </td>
      <td className="p-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(order.payment_status)}`}>{String(order.payment_status).replace('_', ' ')}</span></td>
      <td className="p-4 text-right font-bold text-[#312f2c]">{money(order.total)}</td>
      <td className="p-4 whitespace-nowrap text-xs font-medium text-[#312f2c]/55">{new Date(order.created_at).toLocaleDateString()}</td>
      <td className="p-4 pr-6 text-right"><Link href={`/crown-admin/orders/${order.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#312f2c]/65 shadow-sm transition-all hover:bg-[#d1a054] hover:text-white"><Eye className="h-3.5 w-3.5" /> Manage</Link></td>
    </tr>
  );

  return (
    <div className="flex h-full flex-col gap-6 -m-4 sm:m-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-[#312f2c]">Orders</h1>
          <p className="mt-1 text-sm text-[#312f2c]/55">{totalCount} orders across your store.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportOrders} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white px-3.5 py-2.5 text-sm font-bold text-[#312f2c]/70 shadow-sm transition-all hover:bg-white/70 disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download / Print
          </button>
          <Link href="/crown-admin/orders/new" className="inline-flex items-center gap-2 rounded-xl bg-[#d1a054] px-4 py-2.5 text-sm font-bold text-[#f0ede5] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#c29148] hover:shadow-lg">
            <Plus className="h-4 w-4" /> Create Order
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-4 shadow-sm sm:p-6">
        <div className="mb-5 grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div className="flex rounded-xl border border-white/60 bg-white/60 shadow-sm focus-within:ring-2 focus-within:ring-[#d1a054]/40 md:col-span-2">
            <Search className="ml-3 h-5 w-5 self-center text-[#312f2c]/40" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders..." className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-[#312f2c] outline-none placeholder:text-[#312f2c]/40" />
          </div>
          <select value={searchField} onChange={(event) => setSearchField(event.target.value)} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm font-medium text-[#312f2c] shadow-sm outline-none focus:ring-2 focus:ring-[#d1a054]/40">
            <option value="all">All fields</option><option value="order_id">Order ID</option><option value="email">Email</option><option value="customer_name">Customer name / username</option><option value="phone">Phone number</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm font-medium text-[#312f2c] shadow-sm outline-none focus:ring-2 focus:ring-[#d1a054]/40">
            <option value="">All order statuses</option>{['pending', 'on-hold', 'processing', 'completed', 'cancelled', 'refunded', 'failed'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm font-medium text-[#312f2c] shadow-sm outline-none focus:ring-2 focus:ring-[#d1a054]/40">
            <option value="">All payment statuses</option>{['pending', 'partially_paid', 'paid', 'refunded', 'failed'].map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
          </select>
          <div className="flex items-center gap-2 xl:col-span-1">
             <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="From date" className="min-w-0 flex-1 rounded-xl border border-white/60 bg-white/60 px-2 py-2.5 text-xs font-medium text-[#312f2c] shadow-sm outline-none" />
             <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="To date" className="min-w-0 flex-1 rounded-xl border border-white/60 bg-white/60 px-2 py-2.5 text-xs font-medium text-[#312f2c] shadow-sm outline-none" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-white/60 bg-white/50 shadow-inner relative">
          {loadingInitial ? (
            <div className="flex h-full min-h-64 items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-[#d1a054]" />
            </div>
          ) : (
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#312f2c]/10 bg-[#f4f2eb]/95 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/50 backdrop-blur">
                <tr>
                   <th className="p-4 pl-6">Order</th>
                   <th className="p-4">Username</th>
                   <th className="p-4">Customer</th>
                   <th className="p-4">Items</th>
                   <th className="p-4">Order status</th>
                   <th className="p-4">Payment</th>
                   <th className="p-4 text-right">Total</th>
                   <th className="p-4">Date</th>
                   <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              
              {activeReturnOrders.length > 0 && (
                <tbody className="divide-y divide-[#312f2c]/5 relative">
                  {/* Segment A: Active Returns */}
                  {activeReturnOrders.map(order => renderOrderRow(order, true))}
                  <tr>
                    <td colSpan={9} className="p-0">
                      <div className="h-1 bg-gradient-to-r from-transparent via-[#d1a054]/20 to-transparent"></div>
                    </td>
                  </tr>
                </tbody>
              )}

              <tbody className="divide-y divide-[#312f2c]/5">
                {/* Segment B: Standard Orders */}
                {orders.length === 0 && activeReturnOrders.length === 0 ? (
                   <tr>
                      <td colSpan={9} className="p-16 text-center text-[#312f2c]/40">
                        <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="font-medium">No orders match the selected filters.</p>
                      </td>
                   </tr>
                ) : orders.map((order) => renderOrderRow(order, false))}
              </tbody>
            </table>
          )}
          
          {/* Infinite Scroll Sentinel */}
          {!loadingInitial && hasMore && (
            <div ref={loadMoreRef} className="flex justify-center p-6">
               <Loader2 className="h-6 w-6 animate-spin text-[#312f2c]/40" />
            </div>
          )}
          
          {!hasMore && (orders.length > 0 || activeReturnOrders.length > 0) && (
            <div className="text-center p-6 text-xs text-[#312f2c]/40 font-bold uppercase tracking-widest">
              End of results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
