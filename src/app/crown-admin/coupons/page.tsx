'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Trash2, Loader2, Save, XCircle, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import toast from 'react-hot-toast';

function ActionBadge({ rule }: { rule: any }) {
  const action = rule?.discount_actions?.[0];
  if (!action) return <span className="text-red-500 text-xs font-medium">⚠ No action</span>;
  if (action.action_type === 'percent_off') return <span className="text-emerald-600 font-semibold text-xs">{action.percent_value}% off</span>;
  if (action.action_type === 'fixed_amount_off') return <span className="text-emerald-600 font-semibold text-xs">${action.fixed_value} off</span>;
  return <span className="text-xs text-[#312f2c]/50">{action.action_type}</span>;
}

function UsageBar({ used, max }: { used: number; max: number | null }) {
  if (!max) return <span className="text-xs text-[#312f2c]/40">Unlimited</span>;
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#312f2c]/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#d1a054] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#312f2c]/60">{used}/{max}</span>
    </div>
  );
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    is_active: true,
    discount_rule_id: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [couponsRes, rulesRes] = await Promise.all([
        fetch(`${API}/coupons`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/discounts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCoupons((await couponsRes.json()).data || []);
      setRules(((await rulesRes.json()).data || []).filter((r: any) => r.trigger_type === 'coupon'));
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return toast.error('Coupon code is required');
    if (!newCoupon.discount_rule_id) return toast.error('Please select an underlying discount rule');

    setIsSaving(true);
    try {
      const res = await fetch(`${API}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newCoupon, code: newCoupon.code.toUpperCase() }),
      });
      if (res.ok) {
        toast.success('Coupon created!');
        setShowNewForm(false);
        setNewCoupon({ code: '', description: '', is_active: true, discount_rule_id: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create coupon');
      }
    } catch {
      toast.error('Error creating coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: any) => {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`${API}/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      if (res.ok) {
        toast.success(coupon.is_active ? 'Coupon disabled' : 'Coupon enabled');
        fetchData();
      }
    } catch {
      toast.error('Error toggling coupon');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${API}/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success('Coupon deleted'); fetchData(); }
    } catch { toast.error('Error deleting coupon'); }
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#312f2c] tracking-tight flex items-center gap-2">
            <Ticket className="w-8 h-8 text-[#d1a054]" /> Coupon Codes
          </h2>
          <p className="text-[#312f2c]/60 mt-1">Manage codes that customers can enter at checkout</p>
        </div>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
        >
          {showNewForm ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showNewForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Create Form */}
      {showNewForm && (
        <form onSubmit={handleCreate} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-[#312f2c] mb-4">Create New Coupon Code</h3>

          {rules.length === 0 ? (
            <div className="p-4 bg-amber-500/10 text-amber-700 rounded-xl mb-4 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">No coupon-type promotion rules exist yet.</p>
                <p className="text-sm mt-0.5">Go to <strong>Promotions</strong> and create a rule with Trigger = "Coupon (requires a code)", then come back here to attach a code to it.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-2">Coupon Code</label>
                <input type="text" required value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full bg-white/50 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all uppercase font-mono tracking-widest"
                  placeholder="SAVE20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-2">Linked Promotion Rule</label>
                <select required value={newCoupon.discount_rule_id}
                  onChange={e => setNewCoupon({ ...newCoupon, discount_rule_id: e.target.value })}
                  className="w-full bg-white/50 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  <option value="" disabled>Select a rule...</option>
                  {rules.map(r => <option key={r.id} value={r.id}>{r.name} (Priority: {r.priority})</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#312f2c] mb-2">Internal Description <span className="font-normal text-[#312f2c]/40">(optional)</span></label>
                <input type="text" value={newCoupon.description}
                  onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full bg-white/50 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                  placeholder="e.g. Sent via email campaign for returning VIPs" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowNewForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[#312f2c]/70 hover:bg-white/50 transition-all">Cancel</button>
            <button type="submit" disabled={isSaving || rules.length === 0}
              className="bg-[#d1a054] hover:bg-[#c19044] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Create Coupon
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#312f2c]/50">
            <Ticket className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">No coupons yet</p>
            <p className="text-sm">Click "New Coupon" to create your first promo code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/50 text-[#312f2c]/60 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Code</th>
                  <th className="p-4">Linked Rule</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 text-sm">
                {coupons.map(coupon => {
                  const rule = coupon.discount_rules;
                  const isExpired = rule?.ends_at && new Date(rule.ends_at) < new Date();
                  return (
                    <tr key={coupon.id} className={`hover:bg-white/30 transition-colors ${!coupon.is_active || isExpired ? 'opacity-60' : ''}`}>
                      <td className="p-4 pl-6">
                        <span className="font-mono font-bold text-[#312f2c] bg-white/60 px-2.5 py-1 rounded-lg border border-white/50 tracking-widest text-sm">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#312f2c]/80 text-sm">
                        {rule?.name || <span className="text-red-500 text-xs">Rule Deleted</span>}
                      </td>
                      <td className="p-4"><ActionBadge rule={rule} /></td>
                      <td className="p-4">
                        <UsageBar used={rule?.current_use_count || 0} max={rule?.max_total_uses || null} />
                      </td>
                      <td className="p-4 text-xs">
                        {rule?.ends_at ? (
                          <span className={isExpired ? 'text-red-500 font-semibold' : 'text-orange-500'}>
                            {isExpired ? '🔴 Expired ' : ''}{new Date(rule.ends_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[#312f2c]/30">No expiry</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${coupon.is_active && !isExpired ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}>
                          {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={togglingId === coupon.id || isExpired}
                            className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors disabled:opacity-40"
                            title={coupon.is_active ? 'Disable coupon' : 'Enable coupon'}>
                            {togglingId === coupon.id ? <Loader2 className="w-4 h-4 animate-spin" /> : coupon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
