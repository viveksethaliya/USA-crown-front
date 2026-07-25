'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, X, Box, DollarSign, RefreshCw, Send, Save, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';

const money = (value: number | string | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ret, setRet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  // Action states
  const [inspectingItem, setInspectingItem] = useState<any>(null);
  const [inspectCondition, setInspectCondition] = useState('unopened');
  const [inspectRestock, setInspectRestock] = useState(true);

  const request = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API}/returns${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return json;
  };

  const loadReturn = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/${id}`);
      setRet(data);
    } catch (error: any) {
      toast.error(error.message || 'Unable to load return');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadReturn(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReturn]);

  const approveReturn = async () => {
    try {
      setSaving(true);
      await request(`/${id}/approve`, { method: 'POST' });
      toast.success('Return approved');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const rejectReturn = async () => {
    const note = prompt('Enter a reason for rejection (optional):');
    if (note === null) return;
    try {
      setSaving(true);
      await request(`/${id}/reject`, { method: 'POST', body: JSON.stringify({ admin_note: note }) });
      toast.success('Return rejected');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const receiveReturn = async () => {
    try {
      setSaving(true);
      await request(`/${id}/receive`, { method: 'POST' });
      toast.success('Items marked as received');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const inspectItem = async () => {
    if (!inspectingItem) return;
    try {
      setSaving(true);
      await request(`/items/${inspectingItem.id}/inspect`, { method: 'POST', body: JSON.stringify({ item_condition: inspectCondition, restock: inspectRestock }) });
      toast.success('Item inspected');
      setInspectingItem(null);
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const issueRefund = async () => {
    const amount = prompt('Enter refund amount:');
    if (!amount || isNaN(Number(amount))) return;
    try {
      setSaving(true);
      await request(`/${id}/refund`, { method: 'POST', body: JSON.stringify({ amount: Number(amount), method: 'manual_other' }) });
      toast.success('Refund issued');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const createReplacement = async () => {
    const orderId = prompt('Enter the ID of the new replacement order:');
    if (!orderId || isNaN(Number(orderId))) return;
    try {
      setSaving(true);
      await request(`/${id}/replace`, { method: 'POST', body: JSON.stringify({ replacement_order_id: Number(orderId) }) });
      toast.success('Replacement created');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const cancelReturn = async () => {
    if (!confirm('Cancel this return?')) return;
    try {
      setSaving(true);
      await request(`/${id}/cancel`, { method: 'POST' });
      toast.success('Return cancelled');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const closeReturn = async () => {
    try {
      setSaving(true);
      await request(`/${id}/close`, { method: 'POST' });
      toast.success('Return closed');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const addNote = async () => {
    if (!noteContent.trim()) return;
    try {
      setSaving(true);
      await request(`/${id}/notes`, { method: 'POST', body: JSON.stringify({ note: noteContent }) });
      setNoteContent('');
      toast.success('Note added');
      loadReturn();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-[#d1a054]" /></div>;
  if (!ret) return <div className="p-8 text-center">Return not found</div>;

  const isFinal = ['refunded', 'replaced', 'rejected', 'cancelled'].includes(ret.status);
  const isClosed = ret.status === 'closed';

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/crown-admin/returns" className="mt-1 rounded-lg p-2 text-[#312f2c]/55 transition-colors hover:bg-white hover:text-[#312f2c]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#312f2c]">{ret.return_number}</h1>
            <p className="mt-1 text-sm text-[#312f2c]/55">Requested {new Date(ret.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isClosed && !isFinal && <button onClick={cancelReturn} disabled={saving} className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-600 disabled:opacity-50"><Ban className="inline h-4 w-4 mr-1"/> Cancel Return</button>}
          {isFinal && !isClosed && <button onClick={closeReturn} disabled={saving} className="rounded-xl bg-[#312f2c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle className="inline h-4 w-4 mr-1"/> Close Return</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Workflow Actions */}
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#312f2c]">Status: <span className="uppercase tracking-wide text-[#d1a054] ml-2">{ret.status}</span></h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {ret.status === 'requested' && (
                <>
                  <button onClick={approveReturn} disabled={saving} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-green-700"><Check className="h-4 w-4" /> Approve Request</button>
                  <button onClick={rejectReturn} disabled={saving} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-red-700"><X className="h-4 w-4" /> Reject Request</button>
                </>
              )}
              {ret.status === 'approved' && (
                <button onClick={receiveReturn} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#d1a054] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#c29148]"><Box className="h-4 w-4" /> Mark as Received</button>
              )}
              {(ret.status === 'received' || ret.status === 'approved') && (
                <>
                  <button onClick={issueRefund} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-blue-700"><DollarSign className="h-4 w-4" /> Issue Refund</button>
                  <button onClick={createReplacement} disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-indigo-700"><RefreshCw className="h-4 w-4" /> Create Replacement</button>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm">
            <h2 className="font-bold text-[#312f2c] mb-4">Return Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#312f2c]/10 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/45">
                  <tr><th className="pb-3">Product</th><th className="pb-3">Reason</th><th className="pb-3">Condition</th><th className="pb-3 text-right">Qty</th><th className="pb-3 text-right">Total Refund</th><th className="pb-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-[#312f2c]/5">
                  {ret.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3"><p className="font-bold text-[#312f2c]">{item.order_item?.product?.name || `Product ID ${item.product_id}`}</p><p className="mt-1 text-xs text-[#312f2c]/50">{item.order_item?.product?.sku}</p></td>
                      <td className="py-3 font-medium text-[#312f2c]/65">{item.reason}</td>
                      <td className="py-3 text-xs">
                        {item.item_condition ? <span className="uppercase text-[#d1a054] font-bold">{item.item_condition}</span> : 'Pending inspection'}
                        {item.restock && <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Restocked</span>}
                      </td>
                      <td className="py-3 text-right font-bold text-[#312f2c]">{item.quantity}</td>
                      <td className="py-3 text-right font-bold text-[#312f2c]">{money(item.line_refund_amount)}</td>
                      <td className="py-3 text-right">
                        {(ret.status === 'received' || ret.status === 'refunded' || ret.status === 'replaced') && !item.item_condition && (
                          <button onClick={() => setInspectingItem(item)} className="text-xs bg-[#312f2c] text-white px-3 py-1.5 rounded-lg font-bold">Inspect</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Refund Ledger */}
          {ret.refunds?.length > 0 && (
            <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm">
              <h2 className="font-bold text-[#312f2c] mb-4">Refund Ledger</h2>
              <div className="space-y-3">
                {ret.refunds.map((refund: any) => (
                  <div key={refund.id} className="flex justify-between items-center bg-white/60 border border-[#312f2c]/10 p-3 rounded-xl">
                    <div>
                      <p className="font-bold text-[#312f2c]">{money(refund.amount)} <span className="text-sm font-medium text-[#312f2c]/50">via {refund.method}</span></p>
                      <p className="text-xs text-[#312f2c]/50">{new Date(refund.created_at).toLocaleString()}</p>
                    </div>
                    <span className="uppercase text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">{refund.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm">
            <h2 className="font-bold text-[#312f2c] mb-3">Original Order</h2>
            <Link href={`/crown-admin/orders/${ret.order_id}`} className="block bg-white/60 border border-[#312f2c]/10 p-3 rounded-xl hover:border-[#d1a054] transition-colors">
              <p className="font-bold text-[#312f2c]">{ret.order?.order_number || `Order #${ret.order_id}`}</p>
              <p className="text-sm text-[#312f2c]/55 mt-1">{new Date(ret.order?.created_at).toLocaleDateString()}</p>
              <p className="text-sm font-bold text-[#312f2c] mt-2">{money(ret.order?.total)}</p>
            </Link>

            <h2 className="font-bold text-[#312f2c] mb-3 mt-6">Customer</h2>
            <div className="bg-white/60 border border-[#312f2c]/10 p-3 rounded-xl">
              <p className="font-bold text-[#312f2c]">{ret.customer?.username}</p>
              <p className="text-sm text-[#312f2c]/65 mt-1">{ret.customer?.first_name} {ret.customer?.last_name}</p>
              <p className="text-xs text-[#312f2c]/50 mt-1">{ret.customer?.email}</p>
            </div>
            
            {ret.customer_note && (
              <>
                <h2 className="font-bold text-[#312f2c] mb-3 mt-6">Customer Note</h2>
                <p className="bg-white/60 border border-[#312f2c]/10 p-3 rounded-xl text-sm italic text-[#312f2c]/75">{ret.customer_note}</p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm">
            <h2 className="font-bold text-[#312f2c]">Admin Notes</h2>
            <div className="mt-4 flex gap-2">
              <input value={noteContent} onChange={(event) => setNoteContent(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addNote()} placeholder="Add a private note..." className="min-w-0 flex-1 rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm outline-none" />
              <button onClick={addNote} disabled={saving} className="rounded-lg bg-[#312f2c] px-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
            {ret.admin_note && (
              <div className="mt-4 p-3 bg-[#312f2c]/5 border border-[#312f2c]/10 rounded-xl whitespace-pre-wrap text-sm text-[#312f2c]/75">
                {ret.admin_note}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#312f2c]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/50 bg-[#f0ede5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#312f2c]/10 bg-white/40 p-5">
              <h2 className="font-bold text-[#312f2c]">Inspect Item</h2>
              <button onClick={() => setInspectingItem(null)} className="rounded-lg p-2 text-[#312f2c]/50 hover:bg-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-bold">{inspectingItem.order_item?.product?.name || `Item ${inspectingItem.id}`}</p>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Condition
                <select value={inspectCondition} onChange={e => setInspectCondition(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm normal-case text-[#312f2c] outline-none">
                  <option value="unopened">Unopened</option>
                  <option value="opened_unused">Opened Unused</option>
                  <option value="used">Used</option>
                  <option value="damaged">Damaged</option>
                  <option value="defective_on_arrival">Defective on Arrival</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-[#312f2c]">
                <input type="checkbox" checked={inspectRestock} onChange={e => setInspectRestock(e.target.checked)} className="w-4 h-4 rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054]" />
                Restock to inventory
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#312f2c]/10 bg-white/40 p-5">
              <button onClick={() => setInspectingItem(null)} className="rounded-lg px-4 py-2 text-sm font-bold text-[#312f2c]/60">Cancel</button>
              <button onClick={inspectItem} disabled={saving} className="rounded-lg bg-[#d1a054] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
