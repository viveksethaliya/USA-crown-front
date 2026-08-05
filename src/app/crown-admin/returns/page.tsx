'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';
import { Pagination } from '@/types/admin';
import { adminFetch } from '@/lib/api';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const statusClass = (status: string) => {
  if (status === 'received' || status === 'refunded' || status === 'replaced') return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (status === 'approved') return 'bg-[#d1a054]/15 text-[#9b7132] border-[#d1a054]/25';
  return 'bg-[#312f2c]/6 text-[#312f2c]/60 border-[#312f2c]/10';
};

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchReturns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (status) params.set('status', status);
      const response = await adminFetch(`${API}/returns?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to load returns');
      setReturnsList(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (error: any) {
      toast.error(error.message || 'Unable to load returns');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReturns(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReturns]);

  return (
    <div className="flex h-full flex-col gap-6 -m-4 sm:m-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-[#312f2c]">Returns (RMA)</h1>
          <p className="mt-1 text-sm text-[#312f2c]/55">{pagination.total} return requests.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-4 shadow-sm sm:p-6">
        <div className="mb-5 grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm font-medium text-[#312f2c] shadow-sm outline-none focus:ring-2 focus:ring-[#d1a054]/40 md:col-span-2">
            <option value="">All return statuses</option>
            {['requested', 'approved', 'rejected', 'received', 'refunded', 'replaced', 'cancelled', 'closed'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-white/60 bg-white/50 shadow-inner">
          {loading ? <div className="flex h-full min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#d1a054]" /></div> : (
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#312f2c]/10 bg-[#f4f2eb]/95 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/50 backdrop-blur">
                <tr><th className="p-4 pl-6">Return</th><th className="p-4">Customer</th><th className="p-4">Order</th><th className="p-4">Status</th><th className="p-4">Resolution</th><th className="p-4 text-right">Refund Total</th><th className="p-4">Date</th><th className="p-4 pr-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {returnsList.length === 0 ? <tr><td colSpan={8} className="p-16 text-center text-[#312f2c]/40"><Undo2 className="mx-auto mb-4 h-12 w-12 opacity-20" /><p className="font-medium">No returns match the selected filters.</p></td></tr> : returnsList.map((ret) => (
                  <tr key={ret.id} className="group transition-colors hover:bg-white/70">
                    <td className="p-4 pl-6"><p className="font-bold text-[#312f2c]">{ret.return_number}</p><p className="mt-1 text-[11px] font-medium text-[#312f2c]/40">ID: {ret.id}</p></td>
                    <td className="p-4"><p className="font-semibold text-[#312f2c]">{`${ret.customer?.first_name || ''} ${ret.customer?.last_name || ''}`.trim() || ret.customer?.username || '—'}</p><p className="mt-1 text-xs text-[#312f2c]/50">{ret.customer?.email || '—'}</p></td>
                    <td className="p-4 font-mono text-xs font-medium text-[#312f2c]/65">{ret.order?.order_number || `#${ret.order_id}`}</td>
                    <td className="p-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(ret.status)}`}>{ret.status}</span></td>
                    <td className="p-4 font-medium text-[#312f2c]/65">{ret.resolution_type || '—'}</td>
                    <td className="p-4 text-right font-bold text-[#312f2c]">{money(ret.refund_amount)}</td>
                    <td className="p-4 whitespace-nowrap text-xs font-medium text-[#312f2c]/55">{new Date(ret.created_at).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right"><Link href={`/crown-admin/returns/${ret.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#312f2c]/65 shadow-sm transition-all hover:bg-[#d1a054] hover:text-white"><Eye className="h-3.5 w-3.5" /> Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.totalPages > 1 && <div className="mt-4 flex shrink-0 items-center justify-between"><p className="text-sm text-[#312f2c]/55">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button onClick={() => fetchReturns(pagination.page - 1)} disabled={pagination.page === 1} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#312f2c]/60 disabled:opacity-40">Previous</button><button onClick={() => fetchReturns(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#312f2c]/60 disabled:opacity-40">Next</button></div></div>}
      </div>
    </div>
  );
}
