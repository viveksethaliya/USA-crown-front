'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/api';
import { ADMIN_API as API } from '@/lib/config';
import { toast } from 'react-hot-toast';
import { Undo2, CheckCircle, XCircle, PackageCheck, ClipboardCheck, CornerUpLeft, RefreshCcw, Ban, Archive, StickyNote, Send, Search } from 'lucide-react';

const money = (value: number | string | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

export default function ReturnsSection({ order, reloadOrder }: { order: any, reloadOrder: () => void }) {
  const [loading, setLoading] = useState<number | null>(null);
  const [returnNotes, setReturnNotes] = useState<{ [key: number]: string }>({});

  const returns = (order?.returns || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (returns.length === 0) return null;

  const handleAction = async (returnId: number, actionPath: string, payload: any = {}) => {
    setLoading(returnId);
    try {
      const response = await adminFetch(`${API}/returns/${returnId}/${actionPath}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Action failed`);
      toast.success('Return updated successfully');
      reloadOrder();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleInspect = async (returnId: number, itemId: number, condition: string, restock: boolean) => {
    setLoading(returnId);
    try {
      const response = await adminFetch(`${API}/returns/items/${itemId}/inspect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_condition: condition, restock })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Inspect failed`);
      toast.success('Item inspected');
      reloadOrder();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Undo2 className="h-5 w-5 text-[#d1a054]" />
        <h2 className="font-bold text-[#312f2c]">Returns ({returns.length})</h2>
      </div>

      <div className="space-y-6">
        {returns.map((ret: any) => (
          <div key={ret.id} className="rounded-xl border border-[#312f2c]/10 bg-white p-4 shadow-sm relative">
            <div className="flex justify-between items-start border-b border-[#312f2c]/10 pb-4 mb-4">
              <div>
                <p className="font-bold text-[#312f2c]">{ret.return_number} <span className="ml-2 rounded-full border border-[#d1a054]/30 bg-[#d1a054]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9b7132]">{ret.status}</span></p>
                <p className="text-xs text-[#312f2c]/50 mt-1">Requested {new Date(ret.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right text-xs">
                {ret.refund_amount > 0 && <p className="font-bold text-green-600">Refunded: {money(ret.refund_amount)}</p>}
                {ret.resolution_type && <p className="text-[#312f2c]/50 capitalize mt-0.5">Resolution: {ret.resolution_type.replace('_', ' ')}</p>}
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/50 mb-2">Return Items</h3>
              <div className="overflow-x-auto rounded-lg border border-[#312f2c]/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0ede5]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Reason</th>
                      <th className="p-2">Refund Val</th>
                      <th className="p-2">Condition</th>
                      <th className="p-2">Restock?</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#312f2c]/5">
                    {ret.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2 font-medium">{item.order_item?.product_name || `Item #${item.order_item_id}`}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2 capitalize">{item.reason?.replace(/_/g, ' ')}</td>
                        <td className="p-2">{money(item.line_refund_amount)}</td>
                        <td className="p-2">{item.item_condition || '—'}</td>
                        <td className="p-2">{item.restock ? 'Yes' : 'No'}</td>
                        <td className="p-2">
                          {ret.status === 'received' && !item.item_condition && (
                            <button onClick={() => {
                              const cond = prompt('Enter condition (unopened, opened_unused, used, damaged, defective_on_arrival):', 'unopened');
                              if (cond) {
                                const restock = confirm('Restock this item?');
                                handleInspect(ret.id, item.id, cond, restock);
                              }
                            }} className="text-[#d1a054] font-bold hover:underline">Inspect</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Note */}
            <div className="mb-4 bg-[#f0ede5]/50 p-3 rounded-lg border border-[#312f2c]/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/50 mb-2">Admin Notes</h3>
              <div className="text-xs text-[#312f2c]/70 whitespace-pre-wrap mb-3 max-h-32 overflow-y-auto">
                {ret.admin_note || 'No admin notes.'}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add a note..." 
                  value={returnNotes[ret.id] || ''}
                  onChange={e => setReturnNotes({ ...returnNotes, [ret.id]: e.target.value })}
                  className="flex-1 text-xs px-2 py-1.5 rounded border border-[#312f2c]/20 outline-none"
                />
                <button onClick={() => {
                  if (returnNotes[ret.id]) {
                    handleAction(ret.id, 'notes', { note: returnNotes[ret.id] });
                    setReturnNotes({ ...returnNotes, [ret.id]: '' });
                  }
                }} className="bg-[#312f2c] text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50" disabled={loading === ret.id}>
                  Add Note
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap gap-2 pt-2">
              {ret.status === 'requested' && (
                <>
                  <button onClick={() => handleAction(ret.id, 'approve')} disabled={loading === ret.id} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">Approve</button>
                  <button onClick={() => {
                    const note = prompt('Reason for rejection:');
                    if (note !== null) handleAction(ret.id, 'reject', { admin_note: note });
                  }} disabled={loading === ret.id} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                </>
              )}
              
              {ret.status === 'approved' && (
                <button onClick={() => handleAction(ret.id, 'receive')} disabled={loading === ret.id} className="bg-[#312f2c] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4a473f] disabled:opacity-50">Mark Received</button>
              )}

              {(ret.status === 'approved' || ret.status === 'received') && (
                <>
                  <button onClick={() => {
                    const amt = prompt('Refund Amount ($):', String(ret.items?.reduce((s: number, i: any) => s + Number(i.line_refund_amount), 0) || 0));
                    if (amt) handleAction(ret.id, 'refund', { amount: amt });
                  }} disabled={loading === ret.id} className="border border-[#d1a054] text-[#d1a054] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#d1a054]/10 disabled:opacity-50">Issue Refund</button>

                  <button onClick={() => {
                    const repId = prompt('Replacement Order ID (numeric):');
                    if (repId) handleAction(ret.id, 'replace', { replacement_order_id: Number(repId) });
                  }} disabled={loading === ret.id} className="border border-[#312f2c]/20 text-[#312f2c] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50">Create Replacement</button>
                </>
              )}

              {(ret.status === 'requested' || ret.status === 'approved') && (
                <button onClick={() => handleAction(ret.id, 'cancel')} disabled={loading === ret.id} className="text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50">Cancel Return</button>
              )}

              {['refunded', 'replaced', 'rejected', 'cancelled'].includes(ret.status) && (
                <button onClick={() => handleAction(ret.id, 'close')} disabled={loading === ret.id} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300 disabled:opacity-50">Close Return</button>
              )}
            </div>
            
            {loading === ret.id && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl backdrop-blur-[1px]"><div className="w-6 h-6 border-2 border-[#d1a054] border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        ))}
      </div>
    </section>
  );
}
