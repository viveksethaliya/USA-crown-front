'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  List, Plus, Trash2, Loader2, Save, Edit2, X, Search,
  Users, Package, ChevronRight, ToggleLeft, ToggleRight,
  Tag, DollarSign, Info, UserPlus, UserMinus, ArrowLeft,
  AlertCircle, CheckCircle2, Pencil, Download, Upload
} from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import { apiUrl } from '@/lib/cart';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/api';

// ─── helpers ────────────────────────────────────────────────
const token = () => (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '');
const authHdr = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

function pct(fixed: number, regular: number | null | undefined) {
  if (!regular || !fixed) return null;
  const diff = ((regular - fixed) / regular) * 100;
  return diff > 0 ? `-${diff.toFixed(0)}%` : diff < 0 ? `+${Math.abs(diff).toFixed(0)}%` : null;
}

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

// ─── List View (index) ────────────────────────────────────
interface PriceList {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  item_count: number;
  user_count: number;
  created_at: string;
}

// ─── Detail View ────────────────────────────────────────
interface PriceListDetail {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  items: any[];
  assignments: any[];
}

export default function PriceListsPage() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<PriceListDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Create/Edit list form
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [listForm, setListForm] = useState({ name: '', description: '', is_active: true });
  const [isSavingList, setIsSavingList] = useState(false);

  // Item add form (inside detail view)
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [itemForm, setItemForm] = useState<{ product_id?: number; variation_id?: number; name: string; sku: string; regular_price?: number; fixed_price: string; min_qty: string }>({ name: '', sku: '', fixed_price: '', min_qty: '1' });
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemValues, setEditItemValues] = useState<{ fixed_price: string; min_qty: string }>({ fixed_price: '', min_qty: '1' });

  // User assign
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Confirm modal
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importTargetId, setImportTargetId] = useState<number | null>(null);

  // ── Fetch list index ──
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`${API}/price-lists`, { headers: authHdr() });
      const json = await res.json();
      setLists(json.data || []);
    } catch { toast.error('Failed to load price lists'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // ── CSV Export / Import ──
  const handleExport = async (listId?: number) => {
    setIsExporting(true);
    try {
      const url = listId ? `${API}/price-lists/${listId}/export` : `${API}/price-lists/export`;
      const res = await adminFetch(url, { headers: authHdr() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      const disposition = res.headers.get('content-disposition');
      let filename = `price-lists-export-${Date.now()}.csv`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const url = importTargetId ? `${API}/price-lists/${importTargetId}/import` : `${API}/price-lists/import`;
      const res = await adminFetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      toast.success(`Import complete: ${data.imported} created, ${data.updated} updated, ${data.failed} failed.`);
      fetchLists();
      if (importTargetId) openDetail(importTargetId);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
      setImportTargetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Open detail ──
  const openDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetail(null);
    try {
      const res = await adminFetch(`${API}/price-lists/${id}`, { headers: authHdr() });
      const json = await res.json();
      setDetail(json.data);
    } catch { toast.error('Failed to load price list details'); }
    finally { setIsDetailLoading(false); }
  };

  // ── Save list (create / update) ──
  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listForm.name.trim()) return toast.error('Name is required');
    setIsSavingList(true);
    try {
      const method = editingList ? 'PUT' : 'POST';
      const url = editingList ? `${API}/price-lists/${editingList.id}` : `${API}/price-lists`;
      const res = await adminFetch(url, { method, headers: authHdr(), body: JSON.stringify(listForm) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editingList ? 'Price list updated' : 'Price list created');
      setShowForm(false);
      setEditingList(null);
      fetchLists();
      if (detail && editingList && detail.id === editingList.id) openDetail(detail.id);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSavingList(false); }
  };

  // ── Delete list ──
  const handleDeleteList = (pl: PriceList) => {
    setConfirm({
      message: `Delete price list "${pl.name}"? This will remove all ${pl.item_count} items and ${pl.user_count} assignments.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await adminFetch(`${API}/price-lists/${pl.id}`, { method: 'DELETE', headers: authHdr() });
          toast.success('Price list deleted');
          fetchLists();
          if (detail?.id === pl.id) setDetail(null);
        } catch { toast.error('Failed to delete'); }
      }
    });
  };

  // ── Product search debounce ──
  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await adminFetch(apiUrl(`/api/admin/products?search=${encodeURIComponent(productSearch)}&limit=10`), { headers: authHdr() });
        const json = await res.json();
        setSearchResults(json.data || []);
      } catch { } finally { setIsSearching(false); }
    }, 300);
  }, [productSearch]);

  // ── User search debounce ──
  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return; }
    clearTimeout(userSearchTimerRef.current);
    userSearchTimerRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await adminFetch(apiUrl(`/api/admin/customers?search=${encodeURIComponent(userSearch)}&limit=10`), { headers: authHdr() });
        const json = await res.json();
        setUserResults(json.data || []);
      } catch { } finally { setIsSearchingUsers(false); }
    }, 300);
  }, [userSearch]);

  // ── Add item ──
  const handleAddItem = async () => {
    if (!detail) return;
    if (!itemForm.fixed_price || parseFloat(itemForm.fixed_price) < 0) return toast.error('Enter a valid price');
    if (!itemForm.product_id && !itemForm.variation_id) return toast.error('Select a product first');
    setIsSavingItem(true);
    try {
      const res = await adminFetch(`${API}/price-lists/${detail.id}/items`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ product_id: itemForm.product_id, variation_id: itemForm.variation_id, fixed_price: itemForm.fixed_price, min_qty: itemForm.min_qty })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Item added');
      setItemForm({ name: '', sku: '', fixed_price: '', min_qty: '1' });
      setProductSearch('');
      setSearchResults([]);
      openDetail(detail.id);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSavingItem(false); }
  };

  // ── Update item inline ──
  const handleUpdateItem = async (itemId: number) => {
    if (!detail) return;
    try {
      const res = await adminFetch(`${API}/price-lists/${detail.id}/items/${itemId}`, {
        method: 'PUT', headers: authHdr(),
        body: JSON.stringify({ fixed_price: editItemValues.fixed_price, min_qty: editItemValues.min_qty })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Price updated');
      setEditingItemId(null);
      openDetail(detail.id);
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Delete item ──
  const handleDeleteItem = (itemId: number, name: string) => {
    setConfirm({
      message: `Remove "${name}" from this price list?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await adminFetch(`${API}/price-lists/${detail!.id}/items/${itemId}`, { method: 'DELETE', headers: authHdr() });
          toast.success('Item removed');
          openDetail(detail!.id);
        } catch { toast.error('Failed to remove item'); }
      }
    });
  };

  // ── Assign user ──
  const handleAssignUser = async (user: any) => {
    if (!detail) return;
    setUserSearch('');
    setUserResults([]);
    try {
      const res = await adminFetch(`${API}/price-lists/${detail.id}/users`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ user_id: user.id })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`${user.first_name || user.email} assigned`);
      openDetail(detail.id);
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Unassign user ──
  const handleUnassignUser = (userId: number, name: string) => {
    setConfirm({
      message: `Remove ${name} from this price list?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await adminFetch(`${API}/price-lists/${detail!.id}/users/${userId}`, { method: 'DELETE', headers: authHdr() });
          toast.success('User removed');
          openDetail(detail!.id);
        } catch { toast.error('Failed to remove user'); }
      }
    });
  };

  // ─── RENDER: Detail View ──────────────────────────────────
  if (detail !== null || isDetailLoading) {
    return (
      <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto">
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-white/50 text-[#312f2c]/60 hover:text-[#312f2c] border border-[#312f2c]/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {isDetailLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#d1a054]" />
          ) : detail && (
            <div className="flex-1 flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#312f2c]">{detail.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${detail.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {detail.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {detail.description && <p className="text-sm text-[#312f2c]/50 mt-1">{detail.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(detail.id)}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-[#312f2c]/15 rounded-xl text-sm font-semibold text-[#312f2c]/70 hover:text-[#312f2c] hover:border-[#312f2c]/30 transition-all disabled:opacity-50"
                  title="Export this list"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setImportTargetId(detail.id); fileInputRef.current?.click(); }}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-[#312f2c]/15 rounded-xl text-sm font-semibold text-[#312f2c]/70 hover:text-[#312f2c] hover:border-[#312f2c]/30 transition-all disabled:opacity-50"
                  title="Import into this list"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
                <a
                  href={`${API}/price-lists/template`}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-[#312f2c]/15 rounded-xl text-sm font-semibold text-[#312f2c]/70 hover:text-[#312f2c] hover:border-[#312f2c]/30 transition-all"
                  title="Download Template"
                >
                  Template
                </a>
                <button
                  onClick={() => { setEditingList(detail as any); setListForm({ name: detail.name, description: detail.description || '', is_active: detail.is_active }); setShowForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#312f2c]/15 rounded-xl text-sm font-semibold text-[#312f2c]/70 hover:text-[#312f2c] hover:border-[#312f2c]/30 transition-all"
                >
                  <Pencil className="w-4 h-4" /> Edit List
                </button>
              </div>
            </div>
          )}
        </div>
        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />

        {/* Inline edit form */}
        {showForm && (
          <form onSubmit={handleSaveList} className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">List Name *</label>
                <input required value={listForm.name} onChange={e => setListForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. VIP Customer Catalog" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Description</label>
                <input value={listForm.description} onChange={e => setListForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="Optional note" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={listForm.is_active} onChange={e => setListForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-[#d1a054]" />
              <span className="text-sm font-medium text-[#312f2c]">Active (applies to customers at checkout)</span>
            </label>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingList(null); }} className="px-5 py-2 rounded-xl border border-[#312f2c]/15 text-[#312f2c]/70 font-semibold hover:bg-white/50 transition-all text-sm">Cancel</button>
              <button type="submit" disabled={isSavingList} className="px-5 py-2 bg-[#d1a054] text-white rounded-xl font-semibold hover:bg-[#c19044] transition-all flex items-center gap-2 text-sm disabled:opacity-60">
                {isSavingList ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </form>
        )}

        {detail && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">

            {/* ─── Left: Items ─────────────────────────── */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-[#312f2c] flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-[#d1a054]" /> Product Price Overrides
                  <span className="ml-auto text-xs text-[#312f2c]/40 font-normal">{detail.items.length} items</span>
                </h3>

                {/* Add item */}
                <div className="bg-[#f8f7f4] border border-[#312f2c]/8 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3">Add / Update Product Price</p>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/30" />
                    <input
                      type="text"
                      placeholder={itemForm.name ? `Selected: ${itemForm.name}` : 'Search product by name or SKU...'}
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setItemForm(f => ({ ...f, product_id: undefined, variation_id: undefined, name: '', sku: '' })); }}
                      className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl outline-none text-sm transition-all ${itemForm.product_id ? 'border-[#d1a054] text-[#312f2c]' : 'border-[#312f2c]/15 text-[#312f2c]'}`}
                    />
                    {isSearching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#d1a054]" />}
                    {searchResults.length > 0 && productSearch && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#312f2c]/15 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                        {searchResults.map(p => (
                          <div key={p.id}
                            onClick={() => {
                              setItemForm(f => ({ ...f, product_id: p.id, variation_id: undefined, name: p.name, sku: p.sku, regular_price: p.regular_price }));
                              setProductSearch('');
                              setSearchResults([]);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-[#d1a054]/5 cursor-pointer border-b border-[#312f2c]/5 last:border-0">
                            {p.product_images?.[0]?.url ? (
                              <img src={p.product_images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[#312f2c]/10" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-[#312f2c]/5 flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-[#312f2c]/30" /></div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#312f2c] truncate">{p.name}</p>
                              <p className="text-xs text-[#312f2c]/45">{p.sku} · ${p.regular_price ?? '—'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {itemForm.product_id && (
                    <div className="bg-[#d1a054]/5 border border-[#d1a054]/20 rounded-xl p-3 mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#312f2c]">{itemForm.name}</p>
                        <p className="text-xs text-[#312f2c]/50">Regular price: ${itemForm.regular_price ?? '—'}</p>
                      </div>
                      <button onClick={() => setItemForm({ name: '', sku: '', fixed_price: '', min_qty: '1' })} className="p-1 hover:bg-red-50 rounded-lg text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#312f2c]/60 mb-1">Fixed Price ($) *</label>
                      <input type="number" min="0" step="0.01" value={itemForm.fixed_price} onChange={e => setItemForm(f => ({ ...f, fixed_price: e.target.value }))}
                        className="w-full bg-white border border-[#312f2c]/15 focus:border-[#d1a054] rounded-xl px-3 py-2.5 outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#312f2c]/60 mb-1">Min Qty</label>
                      <input type="number" min="1" step="1" value={itemForm.min_qty} onChange={e => setItemForm(f => ({ ...f, min_qty: e.target.value }))}
                        className="w-full bg-white border border-[#312f2c]/15 focus:border-[#d1a054] rounded-xl px-3 py-2.5 outline-none text-sm" placeholder="1" />
                    </div>
                  </div>
                  <button onClick={handleAddItem} disabled={isSavingItem || !itemForm.product_id}
                    className="mt-3 w-full py-2.5 bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                    {isSavingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add to Price List
                  </button>
                </div>

                {/* Items table */}
                {detail.items.length === 0 ? (
                  <div className="text-center py-10 text-[#312f2c]/40">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No items yet</p>
                    <p className="text-sm mt-1">Search and add products above to set custom prices.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#312f2c]/8">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#f4f2eb] text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/40 border-b border-[#312f2c]/10">
                          <th className="p-3 pl-4">Product</th>
                          <th className="p-3">Regular</th>
                          <th className="p-3">List Price</th>
                          <th className="p-3">Min Qty</th>
                          <th className="p-3 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#312f2c]/5">
                        {detail.items.map((item: any) => {
                          const prod = item.products || item.product_variations;
                          const img = item.products?.product_images?.[0]?.url;
                          const regularPrice = item.products?.regular_price ?? item.product_variations?.regular_price;
                          const diff = pct(item.fixed_price, regularPrice);
                          const isEditing = editingItemId === item.id;
                          return (
                            <tr key={item.id} className="hover:bg-white/60 transition-colors">
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-3">
                                  {img ? <img src={img} alt="" className="w-9 h-9 rounded-lg object-cover border border-[#312f2c]/10 flex-shrink-0" /> : <div className="w-9 h-9 rounded-lg bg-[#312f2c]/5 flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-[#312f2c]/20" /></div>}
                                  <div>
                                    <p className="font-semibold text-[#312f2c] leading-tight">{prod?.name || `#${item.product_id}`}</p>
                                    <p className="text-[10px] text-[#312f2c]/40 font-mono mt-0.5">{prod?.sku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-[#312f2c]/50 font-medium">{regularPrice != null ? `$${regularPrice}` : '—'}</td>
                              <td className="p-3">
                                {isEditing ? (
                                  <input type="number" min="0" step="0.01" value={editItemValues.fixed_price} onChange={e => setEditItemValues(v => ({ ...v, fixed_price: e.target.value }))}
                                    className="w-24 bg-white border border-[#d1a054] rounded-lg px-2 py-1.5 text-sm outline-none" autoFocus />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#d1a054]">${item.fixed_price}</span>
                                    {diff && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${diff.startsWith('-') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{diff}</span>}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing ? (
                                  <input type="number" min="1" step="1" value={editItemValues.min_qty} onChange={e => setEditItemValues(v => ({ ...v, min_qty: e.target.value }))}
                                    className="w-16 bg-white border border-[#d1a054] rounded-lg px-2 py-1.5 text-sm outline-none" />
                                ) : (
                                  <span className="text-[#312f2c]/60">{item.min_qty}+</span>
                                )}
                              </td>
                              <td className="p-3 pr-4 text-right">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => handleUpdateItem(item.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingItemId(null)} className="p-1.5 bg-[#312f2c]/10 text-[#312f2c]/60 rounded-lg hover:bg-[#312f2c]/20 transition-colors"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => { setEditingItemId(item.id); setEditItemValues({ fixed_price: String(item.fixed_price), min_qty: String(item.min_qty) }); }}
                                      className="p-1.5 text-[#312f2c]/40 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteItem(item.id, prod?.name || 'item')}
                                      className="p-1.5 text-red-400/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                )}
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

            {/* ─── Right: Assigned Users ───────────────── */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-[#312f2c] flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#d1a054]" /> Assigned Customers
                  <span className="ml-auto text-xs text-[#312f2c]/40 font-normal">{detail.assignments.length}</span>
                </h3>

                {/* User search */}
                <div className="relative mb-4">
                  <UserPlus className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/30" />
                  <input
                    type="text"
                    placeholder="Search customer to assign..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-[#312f2c]/15 focus:border-[#d1a054] rounded-xl outline-none text-sm"
                  />
                  {isSearchingUsers && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#d1a054]" />}
                  {userResults.length > 0 && userSearch && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#312f2c]/15 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                      {userResults.map(u => {
                        const alreadyAssigned = detail.assignments.some((a: any) => a.user_id === u.id);
                        return (
                          <div key={u.id}
                            onClick={() => !alreadyAssigned && handleAssignUser(u)}
                            className={`flex items-center gap-3 p-3 border-b border-[#312f2c]/5 last:border-0 ${alreadyAssigned ? 'opacity-40 cursor-default' : 'cursor-pointer hover:bg-[#d1a054]/5'}`}>
                            <div className="w-8 h-8 rounded-full bg-[#d1a054]/15 flex items-center justify-center text-[#d1a054] font-bold text-sm flex-shrink-0">
                              {(u.first_name || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#312f2c] truncate">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-[#312f2c]/45 truncate">{u.email}</p>
                            </div>
                            {alreadyAssigned && <span className="ml-auto text-xs font-bold text-emerald-600">Assigned</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignment list */}
                {detail.assignments.length === 0 ? (
                  <div className="text-center py-8 text-[#312f2c]/35">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-semibold">No customers assigned</p>
                    <p className="text-xs mt-1">Search above to assign customers to this price list.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.assignments.map((a: any) => {
                      const u = a.users;
                      return (
                        <div key={a.user_id} className="flex items-center gap-3 p-3 bg-white/60 border border-[#312f2c]/8 rounded-xl hover:border-[#312f2c]/15 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#d1a054]/15 flex items-center justify-center text-[#d1a054] font-bold text-sm flex-shrink-0">
                            {(u?.first_name || u?.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#312f2c] truncate">{u?.first_name} {u?.last_name}</p>
                            <p className="text-[11px] text-[#312f2c]/45 truncate">{u?.email}</p>
                          </div>
                          <button onClick={() => handleUnassignUser(a.user_id, `${u?.first_name || u?.email}`)}
                            className="p-1.5 text-red-400/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Remove">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Info box */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">Customers assigned here will see the fixed prices in this list at checkout, overriding the regular product price.</p>
                </div>
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
            <Tag className="w-8 h-8 text-[#d1a054]" /> Price Lists
          </h2>
          <p className="text-[#312f2c]/60 mt-1">Assign fixed per-product prices to specific B2B customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport()}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
            title="Export all lists"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => { setImportTargetId(null); fileInputRef.current?.click(); }}
            disabled={isImporting}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
            title="Global Import"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
          
          <a
            href={`${API}/price-lists/template`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            Template
          </a>

          <button
            onClick={() => { setEditingList(null); setListForm({ name: '', description: '', is_active: true }); setShowForm(v => !v); }}
            className="bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg text-sm"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'New Price List'}
          </button>
        </div>
      </div>
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>How Price Lists work:</strong> A price list lets you set an exact fixed price per product for specific customers — separate from Group % discounts.
          Example: <em>"Customer ABC gets ring blanks at $1.20 each regardless of the listed $2.50 price."</em>
          Customers can be assigned to multiple lists; the most specific/lowest price applies.
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSaveList} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <h3 className="font-bold text-[#312f2c]">New Price List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">List Name *</label>
              <input required value={listForm.name} onChange={e => setListForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. Crown VIP Pricing" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Description</label>
              <input value={listForm.description} onChange={e => setListForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none" placeholder="Optional internal note" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={listForm.is_active} onChange={e => setListForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-[#d1a054]" />
            <span className="text-sm font-medium text-[#312f2c]">Active immediately</span>
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[#312f2c]/70 hover:bg-white/50 transition-all">Cancel</button>
            <button type="submit" disabled={isSavingList} className="bg-[#d1a054] hover:bg-[#c19044] text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-60">
              {isSavingList ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Create
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
        ) : lists.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#312f2c]/40">
            <Tag className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">No price lists yet</p>
            <p className="text-sm">Create your first price list to start assigning custom prices to customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/50 text-[#312f2c]/60 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Customers</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 text-sm">
                {lists.map(pl => (
                  <tr key={pl.id} className="hover:bg-white/30 transition-colors group cursor-pointer" onClick={() => openDetail(pl.id)}>
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-[#312f2c]">{pl.name}</div>
                      {pl.description && <div className="text-xs text-[#312f2c]/40 mt-0.5 truncate max-w-[220px]">{pl.description}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pl.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                        {pl.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[#312f2c]/70 font-medium">
                        <Package className="w-3.5 h-3.5 text-[#d1a054]" /> {pl.item_count}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[#312f2c]/70 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#d1a054]" /> {pl.user_count}
                      </span>
                    </td>
                    <td className="p-4 text-[#312f2c]/45 text-xs">{new Date(pl.created_at).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetail(pl.id)} className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Open">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingList(pl); setListForm({ name: pl.name, description: pl.description || '', is_active: pl.is_active }); setShowForm(true); }}
                          className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteList(pl)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
