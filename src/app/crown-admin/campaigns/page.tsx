'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone, Plus, Trash2, Loader2, Save, Edit2, X,
  CalendarRange, AlertCircle, ChevronRight,
  Info, Users, Zap
} from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────
const token = () => (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '');
const authHdr = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ─── Confirm Modal ────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
        <p className="text-center text-[#312f2c] font-semibold mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-[#312f2c]/15 text-[#312f2c]/70 font-semibold hover:bg-[#312f2c]/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Types ────────────────────────────────────────────────
interface Campaign {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
  target_audience_note?: string;
  rule_count: number;
  created_at: string;
}

interface CampaignDetail extends Campaign {
  discount_rules: any[];
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', status: 'draft',
    starts_at: '', ends_at: '', target_audience_note: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ── Fetch list ──
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/campaigns`, { headers: authHdr() });
      const json = await res.json();
      setCampaigns(json.data || []);
    } catch { toast.error('Failed to load campaigns'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ── Open detail ──
  const openDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetail(null);
    setShowForm(false);
    try {
      const res = await fetch(`${API}/campaigns/${id}`, { headers: authHdr() });
      const json = await res.json();
      setDetail(json.data);
    } catch { toast.error('Failed to load campaign details'); }
    finally { setIsDetailLoading(false); }
  };

  // ── Generate Slug ──
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingCampaign) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setForm(f => ({ ...f, name, slug }));
    } else {
      setForm(f => ({ ...f, name }));
    }
  };

  // ── Save ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return toast.error('Name and slug are required');
    setIsSaving(true);
    try {
      const method = editingCampaign ? 'PUT' : 'POST';
      const url = editingCampaign ? `${API}/campaigns/${editingCampaign.id}` : `${API}/campaigns`;
      
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };

      const res = await fetch(url, { method, headers: authHdr(), body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      
      toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
      setShowForm(false);
      setEditingCampaign(null);
      fetchCampaigns();
      if (detail && editingCampaign && detail.id === editingCampaign.id) openDetail(detail.id);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSaving(false); }
  };

  // ── Delete ──
  const handleDelete = (c: Campaign) => {
    setConfirm({
      message: `Delete campaign "${c.name}"? Any attached discount rules will be kept but unlinked from this campaign.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await fetch(`${API}/campaigns/${c.id}`, { method: 'DELETE', headers: authHdr() });
          toast.success('Campaign deleted');
          fetchCampaigns();
          if (detail?.id === c.id) setDetail(null);
        } catch { toast.error('Failed to delete'); }
      }
    });
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status === 'draft') return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    if (status === 'completed') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20'; // cancelled
  };

  // ─── RENDER: Detail View ──────────────────────────────────
  if (detail !== null || isDetailLoading) {
    return (
      <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto">
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button onClick={() => setDetail(null)} className="p-2 self-start rounded-xl hover:bg-white/50 text-[#312f2c]/60 hover:text-[#312f2c] border border-[#312f2c]/10 transition-all">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          {isDetailLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#d1a054]" />
          ) : detail && (
            <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#312f2c]">{detail.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColor(detail.status)}`}>
                    {detail.status}
                  </span>
                </div>
                <p className="text-sm text-[#312f2c]/50 mt-1 font-mono">{detail.slug}</p>
              </div>
              <button
                onClick={() => {
                  setEditingCampaign(detail as any);
                  setForm({
                    name: detail.name, slug: detail.slug, description: detail.description || '', status: detail.status,
                    starts_at: detail.starts_at ? detail.starts_at.slice(0, 16) : '',
                    ends_at: detail.ends_at ? detail.ends_at.slice(0, 16) : '',
                    target_audience_note: detail.target_audience_note || ''
                  });
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#312f2c]/15 rounded-xl text-sm font-semibold text-[#312f2c]/70 hover:text-[#312f2c] hover:border-[#312f2c]/30 transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit Campaign
              </button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {showForm && (
          <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 space-y-5">
            <h3 className="font-bold text-[#312f2c]">Edit Campaign</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Campaign Name *</label>
                <input required value={form.name} onChange={handleNameChange}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Slug (URL friendly) *</label>
                <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Starts At</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Ends At</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Target Audience Note</label>
                <input value={form.target_audience_note} onChange={e => setForm(f => ({ ...f, target_audience_note: e.target.value }))}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. VIP Retailers Only" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingCampaign(null); }} className="px-5 py-2.5 rounded-xl font-semibold text-[#312f2c]/70 hover:bg-white/50 transition-all text-sm">Cancel</button>
              <button type="submit" disabled={isSaving} className="bg-[#d1a054] hover:bg-[#c19044] text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-60">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Dashboard Panels */}
        {detail && !showForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-[#312f2c] mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-[#d1a054]" /> Overview</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[#312f2c]/50 font-semibold mb-1">Schedule</p>
                    {detail.starts_at || detail.ends_at ? (
                      <div className="text-[#312f2c] font-medium space-y-1">
                        {detail.starts_at && <p>From: {new Date(detail.starts_at).toLocaleString()}</p>}
                        {detail.ends_at && <p>To: {new Date(detail.ends_at).toLocaleString()}</p>}
                      </div>
                    ) : <p className="text-[#312f2c]/40 italic">No schedule set</p>}
                  </div>
                  <div>
                    <p className="text-[#312f2c]/50 font-semibold mb-1">Target Audience</p>
                    <p className="text-[#312f2c] font-medium">{detail.target_audience_note || <span className="text-[#312f2c]/40 italic">Global / Not specified</span>}</p>
                  </div>
                  {detail.description && (
                    <div>
                      <p className="text-[#312f2c]/50 font-semibold mb-1">Description</p>
                      <p className="text-[#312f2c] font-medium">{detail.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm h-full">
                <h3 className="font-bold text-[#312f2c] mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#d1a054]" /> Included Promotions
                  <span className="ml-auto text-xs text-[#312f2c]/40 font-normal">{detail.discount_rules.length} rules</span>
                </h3>
                
                {detail.discount_rules.length === 0 ? (
                  <div className="text-center py-10 text-[#312f2c]/40">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No rules attached yet</p>
                    <p className="text-sm mt-1">Go to the Promotions page to create rules and assign them to this campaign.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.discount_rules.map(rule => (
                      <a key={rule.id} href={`/crown-admin/discounts`} className="flex items-center gap-4 p-3 bg-white/70 border border-[#312f2c]/8 rounded-xl hover:border-[#d1a054]/30 hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-[#312f2c]/5 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 text-[#312f2c]/40 group-hover:text-[#d1a054] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#312f2c] truncate">{rule.name}</p>
                          <p className="text-xs text-[#312f2c]/50 flex gap-2">
                            <span className="capitalize">{rule.rule_type.replace('_', ' ')}</span> • 
                            <span className="capitalize">{rule.trigger_type}</span>
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {rule.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#312f2c]/30 group-hover:text-[#d1a054] transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Index View ───────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto">
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#312f2c] tracking-tight flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-[#d1a054]" /> Campaigns
          </h2>
          <p className="text-[#312f2c]/60 mt-1">Group multiple promotion rules into scheduled campaigns</p>
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setForm({ name: '', slug: '', description: '', status: 'draft', starts_at: '', ends_at: '', target_audience_note: '' }); setShowForm(v => !v); }}
          className="bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
          <h3 className="font-bold text-[#312f2c]">New Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Campaign Name *</label>
              <input required value={form.name} onChange={handleNameChange}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. Summer Sale 2026" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Slug *</label>
              <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none font-mono text-sm" placeholder="summer-sale-2026" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Starts At</label>
              <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Ends At</label>
              <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[#312f2c]/70 hover:bg-white/50 transition-all text-sm">Cancel</button>
            <button type="submit" disabled={isSaving} className="bg-[#d1a054] hover:bg-[#c19044] text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-60">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Create Campaign
            </button>
          </div>
        </form>
      )}

      {/* Lists grid */}
      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#312f2c]/40">
            <Megaphone className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">No campaigns yet</p>
            <p className="text-sm">Group your promotions into campaigns for better organization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/50 text-[#312f2c]/60 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Campaign</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Rules</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 text-sm">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-white/30 transition-colors group cursor-pointer" onClick={() => openDetail(c.id)}>
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-[#312f2c]">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#312f2c]/40 mt-0.5">{c.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[#312f2c]/60">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : '—'} 
                      <span className="mx-1">to</span> 
                      {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[#312f2c]/70 font-medium">
                        <Zap className="w-3.5 h-3.5 text-[#d1a054]" /> {c.rule_count}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetail(c.id)} className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Open">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
