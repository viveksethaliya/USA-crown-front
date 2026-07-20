'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, FileText, Loader2, Mail, PackagePlus, Printer, Save, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';

const ORDER_STATUSES = ['pending', 'on-hold', 'processing', 'completed', 'cancelled', 'refunded', 'failed'];
const PAYMENT_STATUSES = ['pending', 'partially_paid', 'paid', 'refunded', 'failed'];
const money = (value: number | string | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
const isLocked = (status?: string) => ['cancelled', 'completed', 'refunded'].includes(status || '');

function Address({ title, address }: { title: string; address: any }) {
  if (!address || !Object.keys(address).length) return <div className="rounded-xl border border-[#312f2c]/10 bg-white/45 p-4 text-sm text-[#312f2c]/45"><p className="font-bold text-[#312f2c]/65">{title}</p><p className="mt-2">No address recorded.</p></div>;
  return <div className="rounded-xl border border-[#312f2c]/10 bg-white/45 p-4 text-sm text-[#312f2c]/65"><p className="font-bold text-[#312f2c]">{title}</p><div className="mt-2 leading-relaxed"><p>{address.address_line1}</p>{address.address_line2 && <p>{address.address_line2}</p>}<p>{[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}</p><p>{address.country}</p>{address.phone && <p className="mt-1">{address.phone}</p>}</div></div>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const creating = id === 'new';
  const [order, setOrder] = useState<any>(null);
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(!creating);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [status, setStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [shippingTotal, setShippingTotal] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('internal');
  const [addOpen, setAddOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variationId, setVariationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customLength, setCustomLength] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [searching, setSearching] = useState(false);

  const request = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API}/orders${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return json;
  };

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/${id}`);
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setShippingTotal(String(data.shipping_total || 0));
      setPaymentMethod(data.payment_method || '');
      setCustomerNote(data.customer_note || '');
    } catch (error: any) {
      toast.error(error.message || 'Unable to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (creating) return;
    const timer = window.setTimeout(() => { void loadOrder(); }, 0);
    return () => window.clearTimeout(timer);
  }, [creating, loadOrder]);

  const currentItems = useMemo(() => creating ? draftItems : (order?.items || []), [creating, draftItems, order]);
  const previewTotal = useMemo(() => currentItems.reduce((sum, item) => {
    const multiplier = (Number(item.custom_length) || 1) * (Number(item.custom_width) || 1);
    return sum + Math.max(0, Number(item.unit_price || 0) * Number(item.quantity || 0) * multiplier - Number(item.discount_amount || 0));
  }, 0) + Number(shippingTotal || 0), [currentItems, shippingTotal]);

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    try {
      setSearching(true);
      const response = await fetch(`${API}/customers?search=${encodeURIComponent(customerSearch)}&limit=10`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Customer search failed');
      setCustomers(json.data || []);
    } catch (error: any) { toast.error(error.message); } finally { setSearching(false); }
  };

  const saveHeader = async () => {
    if (creating) return;
    try {
      setSaving(true);
      const data = await request(`/${id}`, { method: 'PUT', body: JSON.stringify({ status, payment_status: paymentStatus, shipping_total: shippingTotal, payment_method: paymentMethod, customer_note: customerNote }) });
      setOrder(data);
      toast.success('Order details saved');
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const createOrder = async () => {
    if (!customer) return toast.error('Select a customer first');
    if (!draftItems.length) return toast.error('Add at least one product');
    try {
      setSaving(true);
      const data = await request('', { method: 'POST', body: JSON.stringify({ user_id: customer.id, status, payment_status: paymentStatus, payment_method: paymentMethod, shipping_total: shippingTotal, customer_note: customerNote, items: draftItems }) });
      toast.success('Order created');
      router.replace(`/crown-admin/orders/${data.id}`);
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const searchProducts = async () => {
    if (!productSearch.trim()) return;
    try {
      setSearching(true);
      const response = await fetch(`${API}/products?search=${encodeURIComponent(productSearch)}&limit=10`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Product search failed');
      setProductResults(json.data || []);
    } catch (error: any) { toast.error(error.message); } finally { setSearching(false); }
  };

  const chooseProduct = async (product: any) => {
    try {
      setSearching(true);
      const response = await fetch(`${API}/products/${product.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load product');
      setSelectedProduct(data);
      setVariationId(''); setQuantity('1'); setCustomLength(''); setCustomWidth(''); setManualPrice('');
    } catch (error: any) { toast.error(error.message); } finally { setSearching(false); }
  };

  const resetAdd = () => { setAddOpen(false); setSelectedProduct(null); setProductResults([]); setProductSearch(''); };

  const addProduct = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.type === 'variable' && !variationId) return toast.error('Select a product variation');
    const payload: any = { product_id: selectedProduct.id, variation_id: variationId || null, quantity: Number(quantity || 1), custom_length: customLength || null, custom_width: customWidth || null };
    if (manualPrice !== '') payload.unit_price = Number(manualPrice);
    try {
      if (creating) {
        const selectedVariation = selectedProduct.product_variations?.find((item: any) => String(item.id) === variationId);
        const catalogPrice = Number(selectedVariation?.sale_price ?? selectedVariation?.regular_price ?? selectedProduct.sale_price ?? selectedProduct.regular_price ?? 0);
        const regularPrice = Number(selectedVariation?.regular_price ?? selectedProduct.regular_price ?? catalogPrice);
        setDraftItems((items) => [...items, { ...payload, id: `draft-${Date.now()}`, product_name: selectedProduct.name, sku: selectedVariation?.sku || selectedProduct.sku, variation_label: selectedVariation?.variation_attribute_values?.map((entry: any) => entry.attribute_values?.value).filter(Boolean).join(' / ') || null, original_unit_price: regularPrice, unit_price: manualPrice === '' ? catalogPrice : Number(manualPrice), discount_amount: 0, is_manual_price: manualPrice !== '' }]);
      } else {
        const data = await request(`/${id}/items`, { method: 'POST', body: JSON.stringify(payload) });
        setOrder(data);
      }
      toast.success('Product added to order'); resetAdd();
    } catch (error: any) { toast.error(error.message); }
  };

  const editLocalItem = (itemId: string | number, field: string, value: any) => {
    if (creating) setDraftItems((items) => items.map((item) => item.id === itemId ? { ...item, [field]: value, ...(field === 'unit_price' ? { discount_amount: 0, is_manual_price: true } : {}) } : item));
    else setOrder((current: any) => ({ ...current, items: current.items.map((item: any) => item.id === itemId ? { ...item, [field]: value, ...(field === 'unit_price' ? { discount_amount: 0, is_manual_price: true } : {}) } : item) }));
  };

  const saveItem = async (item: any) => {
    if (creating || isLocked(order?.status)) return;
    try {
      const data = await request(`/${id}/items/${item.id}`, { method: 'PUT', body: JSON.stringify({ quantity: item.quantity, unit_price: item.unit_price, custom_length: item.custom_length, custom_width: item.custom_width, is_manual_price: item.is_manual_price }) });
      setOrder(data);
    } catch (error: any) { toast.error(error.message); loadOrder(); }
  };

  const removeItem = async (item: any) => {
    if (!confirm(`Remove ${item.product_name} from this order?`)) return;
    try {
      if (creating) setDraftItems((items) => items.filter((entry) => entry.id !== item.id));
      else { const data = await request(`/${id}/items/${item.id}`, { method: 'DELETE' }); setOrder(data); }
      toast.success('Product removed');
    } catch (error: any) { toast.error(error.message); }
  };

  const addNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const data = await request(`/${id}/notes`, { method: 'POST', body: JSON.stringify({ content: noteContent, note_type: noteType }) });
      setOrder(data); setNoteContent(''); toast.success('Note added');
    } catch (error: any) { toast.error(error.message); }
  };

  const cancelOrder = async () => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    try { const data = await request(`/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelled by administrator' }) }); setOrder(data); setStatus(data.status); toast.success('Order cancelled'); } catch (error: any) { toast.error(error.message); }
  };
  const deleteOrder = async () => {
    if (!confirm('Permanently delete this order? This cannot be undone.')) return;
    try { await request(`/${id}`, { method: 'DELETE' }); toast.success('Order deleted'); router.push('/crown-admin/orders'); } catch (error: any) { toast.error(error.message); }
  };
  const remindPayment = async () => {
    try { const data = await request(`/${id}/payment-reminder`, { method: 'POST' }); await navigator.clipboard?.writeText(data.payment_url); toast.success('Payment reminder sent; secure link copied'); } catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-[#d1a054]" /></div>;
  const locked = !creating && isLocked(order?.status);

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><Link href="/crown-admin/orders" className="mt-1 rounded-lg p-2 text-[#312f2c]/55 transition-colors hover:bg-white hover:text-[#312f2c]"><ArrowLeft className="h-5 w-5" /></Link><div><h1 className="text-2xl font-bold text-[#312f2c]">{creating ? 'Create Order' : (order?.order_number || `Order #${order?.id}`)}</h1><p className="mt-1 text-sm text-[#312f2c]/55">{creating ? 'Create a manual order for an existing customer.' : `Placed ${new Date(order?.created_at).toLocaleString()}`}</p></div></div>
        {!creating && <div className="flex flex-wrap gap-2"><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white px-3 py-2 text-sm font-bold text-[#312f2c]/65 shadow-sm"><Printer className="h-4 w-4" /> Print</button><button onClick={remindPayment} disabled={order?.payment_status === 'paid'} className="inline-flex items-center gap-2 rounded-xl border border-[#d1a054]/25 bg-[#d1a054]/10 px-3 py-2 text-sm font-bold text-[#9b7132] disabled:opacity-40"><Mail className="h-4 w-4" /> Payment reminder</button>{!locked && <button onClick={cancelOrder} className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-600">Cancel order</button>}<button onClick={deleteOrder} className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>}
      </div>

      {creating && <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm"><h2 className="font-bold text-[#312f2c]">Customer <span className="text-red-500">*</span></h2>{customer ? <div className="mt-3 flex items-center justify-between rounded-xl border border-[#d1a054]/25 bg-[#d1a054]/10 p-3"><div><p className="font-bold text-[#312f2c]">{customer.username}</p><p className="text-sm text-[#312f2c]/60">{customer.first_name} {customer.last_name} · {customer.email}</p></div><button onClick={() => setCustomer(null)} className="rounded-lg p-2 text-[#312f2c]/50 hover:bg-white"><X className="h-4 w-4" /></button></div> : <div className="mt-3 flex gap-2"><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && searchCustomers()} placeholder="Search by username, email, name, or phone" className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d1a054]/40" /><button onClick={searchCustomers} className="rounded-xl bg-[#312f2c] px-3 text-white"><Search className="h-4 w-4" /></button></div>}{!customer && customers.length > 0 && <div className="mt-2 divide-y divide-[#312f2c]/5 rounded-xl border border-white/60 bg-white">{customers.map((entry) => <button key={entry.id} onClick={() => { setCustomer(entry); setCustomers([]); }} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-[#f0ede5]"><span><strong>{entry.username}</strong> <span className="text-[#312f2c]/55">{entry.first_name} {entry.last_name}</span></span><span className="text-xs text-[#312f2c]/50">{entry.email}</span></button>)}</div>}</section>}

      <section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-[#312f2c]">Order details</h2>{!creating && <button onClick={saveHeader} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#312f2c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes</button>}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Order status<select value={status} disabled={locked} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm font-medium normal-case text-[#312f2c] outline-none disabled:opacity-60">{ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Payment status<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm font-medium normal-case text-[#312f2c] outline-none">{PAYMENT_STATUSES.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Shipping price<input type="number" min="0" step="0.01" value={shippingTotal} disabled={locked} onChange={(event) => setShippingTotal(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm font-medium text-[#312f2c] outline-none disabled:opacity-60" /></label><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Payment method<input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="e.g. Bank transfer" className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm font-medium text-[#312f2c] outline-none" /></label><div className="rounded-xl bg-[#312f2c] p-3 text-[#f0ede5]"><p className="text-[10px] font-bold uppercase tracking-widest text-[#f0ede5]/60">Order total</p><p className="mt-1 text-xl font-bold">{money(creating ? previewTotal : order?.total)}</p></div></div><label className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Customer-visible note<textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} rows={2} placeholder="Shown to the customer with their order" className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm font-medium normal-case text-[#312f2c] outline-none" /></label></section>

      <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/45 shadow-sm"><div className="flex items-center justify-between border-b border-[#312f2c]/10 p-5"><div><h2 className="font-bold text-[#312f2c]">Items</h2><p className="mt-1 text-sm text-[#312f2c]/55">Original price, discount, and final price are preserved per line item.</p></div>{!locked && <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#d1a054] px-3.5 py-2 text-sm font-bold text-white"><PackagePlus className="h-4 w-4" /> Add product</button>}</div><div className="overflow-x-auto"><table className="min-w-[960px] w-full text-left text-sm"><thead className="bg-[#312f2c]/4 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/45"><tr><th className="p-4 pl-5">Product</th><th className="p-4">Original price</th><th className="p-4">Quantity</th><th className="p-4">Price</th><th className="p-4">Discount</th><th className="p-4 text-right">Total price</th><th className="p-4 pr-5"></th></tr></thead><tbody className="divide-y divide-[#312f2c]/5">{currentItems.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-[#312f2c]/40">No products have been added.</td></tr> : currentItems.map((item) => { const multiplier = (Number(item.custom_length) || 1) * (Number(item.custom_width) || 1); const total = Math.max(0, Number(item.unit_price || 0) * Number(item.quantity || 0) * multiplier - Number(item.discount_amount || 0)); return <tr key={item.id}><td className="p-4 pl-5"><p className="font-bold text-[#312f2c]">{item.product_name}</p><p className="mt-1 text-xs text-[#312f2c]/50">{[item.sku, item.variation_label, item.custom_length && `L ${item.custom_length}`, item.custom_width && `W ${item.custom_width}`].filter(Boolean).join(' · ')}</p></td><td className="p-4 font-medium text-[#312f2c]/65">{money(item.original_unit_price)}</td><td className="p-4"><input type="number" min="1" disabled={locked} value={item.quantity} onChange={(event) => editLocalItem(item.id, 'quantity', Number(event.target.value || 1))} onBlur={() => saveItem(item)} className="w-20 rounded-lg border border-[#312f2c]/10 bg-white px-2 py-1.5 font-medium text-[#312f2c] outline-none disabled:opacity-60" /></td><td className="p-4"><input type="number" min="0" step="0.01" disabled={locked} value={item.unit_price} onChange={(event) => editLocalItem(item.id, 'unit_price', Number(event.target.value || 0))} onBlur={() => saveItem(item)} className="w-24 rounded-lg border border-[#312f2c]/10 bg-white px-2 py-1.5 font-medium text-[#312f2c] outline-none disabled:opacity-60" /><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#d1a054]">{item.is_manual_price ? 'Manual' : 'Catalog'}</p></td><td className="p-4 font-medium text-[#312f2c]/65">{money(item.discount_amount)}</td><td className="p-4 text-right font-bold text-[#312f2c]">{money(total)}</td><td className="p-4 pr-5 text-right">{!locked && <button onClick={() => removeItem(item)} className="rounded-lg p-2 text-[#312f2c]/45 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}</td></tr>; })}</tbody></table></div><div className="flex justify-end border-t border-[#312f2c]/10 p-5"><div className="w-64 space-y-2 text-sm"><div className="flex justify-between text-[#312f2c]/65"><span>Subtotal</span><span>{money(creating ? previewTotal - Number(shippingTotal || 0) : order?.subtotal)}</span></div><div className="flex justify-between text-[#312f2c]/65"><span>Discount</span><span>-{money(creating ? 0 : order?.discount_total)}</span></div><div className="flex justify-between text-[#312f2c]/65"><span>Shipping</span><span>{money(shippingTotal)}</span></div><div className="flex justify-between border-t border-[#312f2c]/10 pt-2 text-base font-bold text-[#312f2c]"><span>Total</span><span>{money(creating ? previewTotal : order?.total)}</span></div></div></div></section>

      {!creating && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm"><h2 className="font-bold text-[#312f2c]">Order notes</h2><div className="mt-4 flex gap-2"><select value={noteType} onChange={(event) => setNoteType(event.target.value)} className="rounded-lg border border-[#312f2c]/10 bg-white px-2 text-sm font-medium text-[#312f2c]"><option value="internal">Private</option><option value="customer">Customer note</option></select><input value={noteContent} onChange={(event) => setNoteContent(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addNote()} placeholder="Add a note..." className="min-w-0 flex-1 rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm outline-none" /><button onClick={addNote} className="rounded-lg bg-[#312f2c] px-3 text-white"><Send className="h-4 w-4" /></button></div><div className="mt-4 space-y-3">{order?.notes?.length ? order.notes.map((note: any) => <div key={note.id} className={`rounded-xl border p-3 ${note.note_type === 'internal' ? 'border-[#312f2c]/10 bg-[#312f2c]/5' : 'border-[#d1a054]/20 bg-[#d1a054]/10'}`}><div className="flex justify-between gap-3 text-[10px] font-bold uppercase tracking-wide"><span className={note.note_type === 'internal' ? 'text-[#312f2c]/55' : 'text-[#9b7132]'}>{note.note_type === 'internal' ? 'Private note' : 'Customer note'}</span><span className="text-[#312f2c]/40">{new Date(note.created_at).toLocaleString()}</span></div><p className="mt-2 text-sm text-[#312f2c]/75">{note.content}</p></div>) : <p className="py-5 text-center text-sm text-[#312f2c]/40">No notes yet.</p>}</div></section><section className="rounded-2xl border border-white/60 bg-white/45 p-5 shadow-sm"><h2 className="font-bold text-[#312f2c]">Customer & addresses</h2><div className="mt-4 rounded-xl border border-[#312f2c]/10 bg-white/45 p-4"><p className="font-bold text-[#312f2c]">{order?.customer?.username}</p><p className="mt-1 text-sm text-[#312f2c]/65">{order?.customer?.first_name} {order?.customer?.last_name} · {order?.customer?.email}</p><p className="mt-1 text-sm text-[#312f2c]/55">{order?.customer?.phone || 'No phone number'}</p></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><Address title="Billing address" address={order?.billing_address} /><Address title="Shipping address" address={order?.shipping_address} /></div></section></div>}
      {creating && <div className="flex justify-end"><button onClick={createOrder} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#312f2c] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create order</button></div>}

      {addOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#312f2c]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/50 bg-[#f0ede5] shadow-2xl"><div className="flex items-center justify-between border-b border-[#312f2c]/10 bg-white/40 p-5"><h2 className="font-bold text-[#312f2c]">Add product to order</h2><button onClick={resetAdd} className="rounded-lg p-2 text-[#312f2c]/50 hover:bg-white"><X className="h-5 w-5" /></button></div><div className="p-5">{!selectedProduct ? <><div className="flex gap-2"><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && searchProducts()} placeholder="Search product name or SKU" className="min-w-0 flex-1 rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm outline-none" /><button onClick={searchProducts} className="rounded-lg bg-[#d1a054] px-3 text-white">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button></div><div className="mt-3 space-y-2">{productResults.map((product) => <button key={product.id} onClick={() => chooseProduct(product)} className="flex w-full items-center justify-between rounded-xl border border-[#312f2c]/10 bg-white p-3 text-left transition-colors hover:border-[#d1a054]/40"><span><strong className="text-sm text-[#312f2c]">{product.name}</strong><small className="mt-1 block font-mono text-xs text-[#312f2c]/50">{product.sku || 'No SKU'}</small></span><span className="text-xs font-bold text-[#d1a054]">{product.type}</span></button>)}</div></> : <><button onClick={() => setSelectedProduct(null)} className="text-xs font-bold text-[#d1a054] hover:underline">← Change product</button><div className="mt-3 rounded-xl border border-[#312f2c]/10 bg-white p-3"><p className="font-bold text-[#312f2c]">{selectedProduct.name}</p><p className="mt-1 font-mono text-xs text-[#312f2c]/50">{selectedProduct.sku || 'No SKU'}</p></div>{selectedProduct.type === 'variable' && <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Variation<select value={variationId} onChange={(event) => setVariationId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none"><option value="">Select variation</option>{selectedProduct.product_variations?.map((variation: any) => <option key={variation.id} value={variation.id}>{variation.variation_attribute_values?.map((entry: any) => entry.attribute_values?.value).filter(Boolean).join(' / ') || variation.sku} · {money(variation.sale_price || variation.regular_price)}</option>)}</select></label>}<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Quantity<input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none" /></label><label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Manual price <span className="normal-case text-[#312f2c]/40">(optional)</span><input type="number" min="0" step="0.01" value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder="Catalog price" className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none" /></label>{(selectedProduct.measurement_type === 'inch' || selectedProduct.measurement_type === 'plate') && <label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Length<input type="number" min="0.01" step="0.01" value={customLength} onChange={(event) => setCustomLength(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none" /></label>}{selectedProduct.measurement_type === 'plate' && <label className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Width<input type="number" min="0.01" step="0.01" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none" /></label>}</div><p className="mt-3 text-xs text-[#312f2c]/45">A manual price is final and records a $0 discount, per the order-pricing requirement.</p></>}</div><div className="flex justify-end gap-2 border-t border-[#312f2c]/10 bg-white/40 p-5"><button onClick={resetAdd} className="rounded-lg px-4 py-2 text-sm font-bold text-[#312f2c]/60">Cancel</button>{selectedProduct && <button onClick={addProduct} className="rounded-lg bg-[#d1a054] px-4 py-2 text-sm font-bold text-white">Add product</button>}</div></div></div>}
    </div>
  );
}
