import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Trash2, Plus, Search, Tag, Ruler, Edit2, Check, X, ChevronDown, ChevronUp, CalendarRange, HelpCircle, Lightbulb, Users, ArrowRight, Activity, Layers, BarChart2 } from 'lucide-react';
import { apiUrl } from '@/lib/cart';

interface DiscountRule {
  id: number;
  scope: 'global' | 'category' | 'product' | 'measurement';
  category_id: number | null;
  product_id: number | null;
  variation_id: number | null;
  min_qty: number;
  max_qty: number | null;
  measurement_type: 'inch' | 'plate' | null;
  discount_pct: number;
  starts_at: string | null;
  expires_at: string | null;
  categories?: { id: number; name: string };
  products?: { id: number; name: string; sku: string };
  product_variations?: { id: number; sku: string; variation_attribute_values: { attribute_values: { value: string } }[] };
}

interface TierGroup {
  key: string;
  scope: string;
  label: string;
  sublabel?: string;
  tiers: DiscountRule[];
}

export default function DiscountRulesPanel({ groupId, token }: { groupId: string; token: string }) {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ discount_pct: '', min_qty: '', expires_at: '' });
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Add-tier quick-mode: prefill product/category from an existing group
  const [addTierFor, setAddTierFor] = useState<TierGroup | null>(null);

  const [form, setForm] = useState({
    scope: 'global',
    category_id: '',
    measurement_type: 'inch',
    min_qty: '1',
    max_qty: '',
    discount_pct: '',
    expires_at: '',
    variation_id: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string; sku: string }[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<{ id: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; sku: string }[]>([]);
  const [productVariations, setProductVariations] = useState<{ id: number; label: string }[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${groupId}/discount-rules`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  useEffect(() => {
    fetch(apiUrl('/api/admin/categories'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCategories(data || []))
      .catch(console.error);
  }, [token]);

  // Product search
  useEffect(() => {
    if (form.scope !== 'product' && form.scope !== 'measurement') return;
    const delay = setTimeout(() => {
      fetch(apiUrl(`/api/admin/products?search=${encodeURIComponent(searchProduct)}&limit=20`), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setProducts(data.data || []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(delay);
  }, [form.scope, searchProduct, token]);

  // Fetch variations when a single product is selected in product scope
  useEffect(() => {
    if (form.scope === 'product' && selectedProducts.length === 1) {
      fetch(apiUrl(`/api/admin/products/${selectedProducts[0].id}`), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const variations = data.data?.product_variations || data.variations || [];
          setProductVariations(variations.map((v: any) => ({
            id: v.id,
            label: v.variation_attribute_values?.map((vav: any) => vav.attribute_values?.value).join(' / ') || v.sku
          })));
        })
        .catch(() => setProductVariations([]));
    } else {
      setProductVariations([]);
      setForm(f => ({ ...f, variation_id: '' }));
    }
  }, [selectedProducts, form.scope, token]);

  const getCategoryDepth = useCallback((categoryId: number) => {
    let depth = 0;
    let current = categories.find(c => c.id === categoryId);
    while (current && current.parent_id) {
      depth++;
      current = categories.find(c => c.id === current!.parent_id);
    }
    return depth;
  }, [categories]);

  const hierarchicalCategories = useCallback((cats: any[], parentId: any = null, depth = 0): any[] => {
    let result: any[] = [];
    cats.filter(c => c.parent_id === parentId).forEach(c => {
      result.push({ ...c, depth });
      result = result.concat(hierarchicalCategories(cats, c.id, depth + 1));
    });
    return result;
  }, []);

  const displayCategories = hierarchicalCategories(categories);

  // Group rules into tier groups for display
  const tierGroups = useCallback((): TierGroup[] => {
    const map = new Map<string, DiscountRule[]>();
    for (const r of rules) {
      let key = '';
      if (r.scope === 'global') key = 'global';
      else if (r.scope === 'category') key = `category_${r.category_id}`;
      else if (r.scope === 'product') key = r.variation_id ? `variation_${r.product_id}_${r.variation_id}` : `product_${r.product_id}`;
      else if (r.scope === 'measurement') key = `measurement_${r.product_id}_${r.measurement_type}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const groups: TierGroup[] = [];
    for (const [key, tiers] of map.entries()) {
      const first = tiers[0];
      let label = 'All Products';
      let sublabel = '';
      if (first.scope === 'category') { label = first.categories?.name || `Category #${first.category_id}`; sublabel = 'Category'; }
      else if (first.scope === 'product') {
        label = first.products?.name || `Product #${first.product_id}`;
        sublabel = first.variation_id ? (first.product_variations ? (first.product_variations.variation_attribute_values?.map((v: any) => v.attribute_values?.value).join(' / ') || `Variation #${first.variation_id}`) : `Variation #${first.variation_id}`) : first.products?.sku || '';
      }
      else if (first.scope === 'measurement') { label = `${first.measurement_type === 'inch' ? 'Wire/Chain (inches)' : 'Plate (sq.inches)'}`; sublabel = first.products?.name || `Product #${first.product_id}`; }
      groups.push({ key, scope: first.scope, label, sublabel, tiers: tiers.sort((a, b) => a.min_qty - b.min_qty) });
    }
    return groups;
  }, [rules]);

  const groups = tierGroups();

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.scope === 'product' && selectedProducts.length === 0) { alert('Please select at least one product.'); return; }
    if (form.scope === 'measurement' && selectedProducts.length === 0) { alert('Please select a product.'); return; }
    if (form.scope === 'measurement' && (!form.min_qty || !form.max_qty)) { alert('Please enter both Min and Max measurement values.'); return; }
    if (form.scope === 'measurement' && parseFloat(form.min_qty) >= parseFloat(form.max_qty)) { alert('Max value must be greater than Min value.'); return; }

    setAdding(true);
    try {
      const body: any = {
        scope: form.scope,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        product_ids: selectedProducts.map(p => p.id),
        variation_id: (form.scope === 'product' && form.variation_id) ? parseInt(form.variation_id) : null,
        measurement_type: form.scope === 'measurement' ? form.measurement_type : null,
        min_qty: parseFloat(form.min_qty),
        max_qty: form.scope === 'measurement' ? parseFloat(form.max_qty) : null,
        discount_pct: parseFloat(form.discount_pct),
        expires_at: form.expires_at || null,
      };

      // If adding tier for an existing group, prefill product/category
      if (addTierFor) {
        const first = addTierFor.tiers[0];
        if (first.scope === 'product') { body.product_ids = [first.product_id]; body.variation_id = first.variation_id || null; }
        if (first.scope === 'category') { body.category_id = first.category_id; }
        if (first.scope === 'measurement') { body.product_ids = [first.product_id]; body.measurement_type = first.measurement_type; }
        body.scope = first.scope;
      }

      const res = await fetch(apiUrl(`/api/admin/groups/${groupId}/discount-rules`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setForm({ scope: 'global', category_id: '', measurement_type: 'inch', min_qty: '1', max_qty: '', discount_pct: '', expires_at: '', variation_id: '' });
      setSelectedProducts([]);
      setSearchProduct('');
      setAddTierFor(null);
      fetchRules();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setEditValues({
      discount_pct: String(rule.discount_pct),
      min_qty: String(rule.min_qty),
      expires_at: rule.expires_at ? rule.expires_at.slice(0, 16) : '',
    });
  };

  const handleSaveEdit = async (rule: DiscountRule) => {
    setSavingEditId(rule.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${groupId}/discount-rules/${rule.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          discount_pct: parseFloat(editValues.discount_pct),
          min_qty: parseFloat(editValues.min_qty),
          expires_at: editValues.expires_at || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setEditingId(null);
      fetchRules();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Delete this rule?')) return;
    setDeletingId(ruleId);
    try {
      await fetch(apiUrl(`/api/admin/groups/${groupId}/discount-rules/${ruleId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRules();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#d1a054]" /></div>;

  const scopeColors: Record<string, string> = {
    global: 'bg-[#312f2c]/10 text-[#312f2c] border-[#312f2c]/20',
    category: 'bg-[#d1a054]/15 text-[#d1a054] border-[#d1a054]/25',
    product: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    measurement: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const isMeasurementScope = addTierFor ? addTierFor.scope === 'measurement' : form.scope === 'measurement';
  const isProductScope = addTierFor ? addTierFor.scope === 'product' : form.scope === 'product';
  const currentScope = addTierFor ? addTierFor.tiers[0].scope : form.scope;

// ============================================================
// Help Modal
// ============================================================
function HelpModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-[#312f2c]/8 px-7 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d1a054]/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#d1a054]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#312f2c]">How Group Pricing Works</h2>
              <p className="text-xs text-[#312f2c]/50">A guide to priority, measurements, and tiers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#312f2c]/5 text-[#312f2c]/40 hover:text-[#312f2c] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#d1a054]" /> The Priority Ladder
            </h3>
            <p className="text-sm text-[#312f2c]/70 leading-relaxed mb-3">
              When a customer adds an item to their cart, the system checks these rules in a specific order. The <strong>most specific rule always wins</strong>.
            </p>
            <div className="bg-[#f0ede5]/60 rounded-2xl p-4 space-y-2 text-sm text-[#312f2c]/70">
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">1</span> <span><strong>Variation</strong> — Specific variation (e.g. 20g Gold Wire). Most specific.</span></div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">2</span> <span><strong>Product</strong> — All variations of a single product.</span></div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-[#d1a054]/15 text-[#c19044] flex items-center justify-center font-bold">3</span> <span><strong>Category</strong> — Any product inside a category.</span></div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">4</span> <span><strong>Measurement</strong> — Based on total inches or sq.inches.</span></div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-[#312f2c]/10 text-[#312f2c] flex items-center justify-center font-bold">5</span> <span><strong>Global</strong> — Any product in the store.</span></div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold">6</span> <span><strong>Base Group %</strong> — The flat discount set on the Customer Groups page.</span></div>
            </div>
            <p className="text-xs text-[#312f2c]/50 mt-3 italic">Example: If a product is in a Category with 10% off, but also has a Product rule for 15% off, the customer gets 15%.</p>
          </section>

          <hr className="border-[#312f2c]/8" />

          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d1a054]" /> Quantity Tiers (Ladders)
            </h3>
            <p className="text-sm text-[#312f2c]/70 leading-relaxed">
              You can create multiple breakpoints for the same product to reward bulk buying. Click the <strong>Add Tier</strong> button on any existing rule to add a higher threshold.
            </p>
            <div className="mt-3 flex gap-4 p-4 border border-[#312f2c]/8 rounded-2xl items-start">
              <div className="mt-0.5"><BarChart2 className="w-6 h-6 text-emerald-500" /></div>
              <div>
                <p className="text-sm font-bold text-[#312f2c] mb-1">How it works</p>
                <ul className="text-sm text-[#312f2c]/65 list-disc list-inside space-y-1">
                  <li>Buy 1 to 11 units → 5% off (Min Qty: 1)</li>
                  <li>Buy 12 to 47 units → 10% off (Min Qty: 12)</li>
                  <li>Buy 48+ units → 15% off (Min Qty: 48)</li>
                </ul>
                <p className="text-xs text-[#312f2c]/45 mt-2">The system automatically sorts these and applies the highest tier the cart qualifies for.</p>
              </div>
            </div>
          </section>

          <hr className="border-[#312f2c]/8" />

          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#d1a054]" /> Measurement Pricing (Wire & Plate)
            </h3>
            <p className="text-sm text-[#312f2c]/70 leading-relaxed">
              Standard products use simple Quantity (e.g. 5 units). But Wire and Plate products use <strong>total measurements</strong>.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div className="text-sm font-bold text-blue-800 mb-1">Inch (Wire / Chain)</div>
                <div className="text-xs text-blue-700/80 leading-snug mb-2">Total = Quantity × Chosen Length</div>
                <div className="text-[11px] text-blue-700/60 font-mono bg-white/50 p-2 rounded">Buy 5 pieces of 10" wire<br/>= 50 total inches.</div>
                <p className="text-xs text-blue-800 mt-2 font-medium">Set your Min/Max rule values in total inches.</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <div className="text-sm font-bold text-purple-800 mb-1">Plate (Sheet Metal)</div>
                <div className="text-xs text-purple-700/80 leading-snug mb-2">Total = Qty × Length × Width</div>
                <div className="text-[11px] text-purple-700/60 font-mono bg-white/50 p-2 rounded">Buy 2 pieces of 5x5 plate<br/>= 50 total sq. inches.</div>
                <p className="text-xs text-purple-800 mt-2 font-medium">Set your Min/Max rule values in sq. inches.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

  return (
    <div className="space-y-6">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* ====== ADD FORM ====== */}
      <div className="bg-white p-5 rounded-xl border border-[#312f2c]/10 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[#312f2c] flex items-center gap-2">
            {addTierFor ? `Add Tier to: ${addTierFor.label}` : 'Add Discount Rule'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#312f2c]/50 hover:text-[#312f2c] border border-[#312f2c]/10 hover:bg-[#312f2c]/5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
            {addTierFor && (
              <button type="button" onClick={() => setAddTierFor(null)} className="text-sm text-[#312f2c]/50 hover:text-[#312f2c] flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancel tier
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-[#312f2c]/60 mb-4">
          {addTierFor
            ? `Adding a new quantity breakpoint for the same ${addTierFor.scope}. Rules are automatically sorted by min quantity.`
            : 'Define discounts by product, category, or measurement. More specific rules take priority.'}
        </p>

        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

            {/* Scope selector — hidden when in add-tier mode */}
            {!addTierFor && (
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Scope</label>
                <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value, max_qty: '', variation_id: '' })}
                  className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
                  <option value="global">Global (All Products)</option>
                  <option value="category">Specific Category</option>
                  <option value="product">Specific Product(s)</option>
                  <option value="measurement">Measurement (Inch / Plate)</option>
                </select>
              </div>
            )}

            {/* Target column */}
            <div className={`col-span-12 ${addTierFor ? 'md:col-span-6' : 'md:col-span-5'}`}>
              {currentScope === 'global' && !addTierFor && (
                <div className="h-[38px] flex items-center text-sm text-[#312f2c]/50 bg-gray-50 rounded-lg px-3 border border-transparent mt-6">
                  Applies to all products
                </div>
              )}

              {currentScope === 'category' && !addTierFor && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Category</label>
                  <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
                    <option value="">Select a category...</option>
                    {displayCategories.map(c => (
                      <option key={c.id} value={c.id}>{'\u00A0\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '↳ ' : ''}{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(currentScope === 'product' || currentScope === 'measurement') && !addTierFor && (
                <div className="relative">
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Products</label>
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedProducts.map(sp => (
                        <div key={sp.id} className="flex items-center gap-1.5 bg-[#312f2c] text-[#f0ede5] px-2 py-1 rounded-md text-xs font-medium">
                          {sp.name}
                          <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(p => p.id !== sp.id))} className="hover:text-red-300">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
                    <input type="text" placeholder="Search and add products..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" />
                  </div>
                  {searchProduct && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#312f2c]/20 rounded-lg max-h-48 overflow-y-auto z-10 shadow-xl">
                      {products.length === 0 ? <div className="p-3 text-sm text-[#312f2c]/50">No products found</div>
                        : products.map(p => {
                          const isSelected = selectedProducts.some(sp => sp.id === p.id);
                          return (
                            <div key={p.id} onClick={() => { if (!isSelected) { setSelectedProducts(prev => [...prev, p]); setSearchProduct(''); } }}
                              className={`p-2.5 text-sm border-b border-[#312f2c]/5 flex justify-between items-center ${isSelected ? 'opacity-50 cursor-default bg-gray-50' : 'cursor-pointer hover:bg-[#312f2c]/5'}`}>
                              <span>{p.name} <span className="text-xs text-[#312f2c]/50">({p.sku})</span></span>
                              {isSelected && <span className="text-xs font-bold text-emerald-600">Added</span>}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Measurement type */}
              {currentScope === 'measurement' && !addTierFor && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Measurement Type</label>
                  <select value={form.measurement_type} onChange={e => setForm({ ...form, measurement_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
                    <option value="inch">Inch (Wire / Chain — total inches ordered)</option>
                    <option value="plate">Plate (total sq. inches ordered)</option>
                  </select>
                </div>
              )}

              {/* Variation picker (only if single product selected in product scope) */}
              {isProductScope && !addTierFor && selectedProducts.length === 1 && productVariations.length > 0 && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">
                    Specific Variation <span className="font-normal normal-case text-[#312f2c]/40">(optional — leave blank for all variations)</span>
                  </label>
                  <select value={form.variation_id} onChange={e => setForm({ ...form, variation_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
                    <option value="">All variations</option>
                    {productVariations.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
              )}

              {/* Add tier mode: show summary of what we're adding a tier to */}
              {addTierFor && (
                <div className="py-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${scopeColors[addTierFor.scope]}`}>
                    <span className="text-xs uppercase tracking-wider font-bold">{addTierFor.scope}</span>
                    <span>{addTierFor.label}</span>
                    {addTierFor.sublabel && <span className="opacity-60 text-xs">{addTierFor.sublabel}</span>}
                  </div>
                  <p className="text-xs text-[#312f2c]/50 mt-1">Setting new min qty threshold and discount %</p>
                </div>
              )}
            </div>

            {/* Qty columns */}
            {isMeasurementScope && !addTierFor ? (
              <>
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5"><Ruler className="w-3 h-3 inline mr-1" />Min</label>
                  <input required type="number" min="0" step="0.01" value={form.min_qty} onChange={e => setForm({ ...form, min_qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" placeholder="e.g. 120" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5"><Ruler className="w-3 h-3 inline mr-1" />Max</label>
                  <input required type="number" min="1" step="0.01" value={form.max_qty} onChange={e => setForm({ ...form, max_qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" placeholder="e.g. 299" />
                </div>
              </>
            ) : (
              <div className={`col-span-6 ${addTierFor ? 'md:col-span-3' : 'md:col-span-2'}`}>
                <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">
                  {currentScope === 'measurement' ? 'Min' : 'Min Qty'}
                </label>
                <input required type="number" min="1" value={form.min_qty} onChange={e => setForm({ ...form, min_qty: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" />
              </div>
            )}

            <div className={`col-span-6 ${addTierFor ? 'md:col-span-3' : 'md:col-span-2'}`}>
              <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Discount %</label>
              <input required type="number" min="0.1" max="100" step="0.1" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" />
            </div>
          </div>

          {/* Optional expiry */}
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5 flex items-center gap-1">
                <CalendarRange className="w-3 h-3" /> Expires At <span className="font-normal normal-case text-[#312f2c]/40">(optional)</span>
              </label>
              <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm bg-white" />
            </div>
            <button type="submit"
              disabled={adding || (currentScope === 'category' && !form.category_id && !addTierFor) || ((currentScope === 'product' || currentScope === 'measurement') && selectedProducts.length === 0 && !addTierFor)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#312f2c] text-[#f0ede5] hover:bg-[#312f2c]/90 rounded-lg font-medium transition-colors disabled:opacity-70 text-sm">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {addTierFor ? 'Add Tier' : 'Add Rule'}
            </button>
          </div>

          {isMeasurementScope && !addTierFor && (
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <strong>How it works:</strong> For <strong>inch</strong> products, total = qty × chosen length. For <strong>plate</strong> products, total = qty × length × width. Discount applies when total falls within Min–Max range.
            </p>
          )}
        </form>
      </div>

      {/* ====== RULES TABLE (TIER-GROUPED) ====== */}
      {groups.length === 0 ? (
        <div className="bg-white border border-[#312f2c]/10 rounded-xl p-12 text-center text-[#312f2c]/40">
          <Tag className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>No discount rules defined yet</p>
          <p className="text-xs mt-1">Use the form above to create your first rule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const isExpanded = expandedGroups.has(group.key) || group.tiers.length > 1;
            const showExpander = group.tiers.length > 1;
            return (
              <div key={group.key} className="bg-white border border-[#312f2c]/10 rounded-xl overflow-hidden">
                {/* Group header row */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-[#312f2c]/3 border-b border-[#312f2c]/8">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border capitalize tracking-wider flex-shrink-0 ${scopeColors[group.scope]}`}>
                    {group.scope}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[#312f2c] text-sm">{group.label}</span>
                    {group.sublabel && <span className="ml-2 text-xs text-[#312f2c]/50">{group.sublabel}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#312f2c]/50">{group.tiers.length} tier{group.tiers.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => { setAddTierFor(group); setForm(f => ({ ...f, min_qty: String((group.tiers[group.tiers.length - 1]?.min_qty || 1) + 1), discount_pct: '' })); }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#d1a054]/10 hover:bg-[#d1a054]/20 text-[#d1a054] border border-[#d1a054]/30 rounded-lg text-xs font-semibold transition-colors"
                      title="Add a higher-quantity tier">
                      <Plus className="w-3 h-3" /> Add Tier
                    </button>
                    {showExpander && (
                      <button onClick={() => toggleGroup(group.key)} className="p-1 text-[#312f2c]/40 hover:text-[#312f2c] rounded">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tiers */}
                <table className="w-full text-left text-sm text-[#312f2c]/60">
                  <thead className="bg-[#312f2c]/3 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/8">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">{group.scope === 'measurement' ? 'Range' : 'Min Qty'}</th>
                      {group.scope === 'measurement' && <th className="px-5 py-2.5 font-medium">Max</th>}
                      <th className="px-5 py-2.5 font-medium">Discount</th>
                      <th className="px-5 py-2.5 font-medium">Expires</th>
                      <th className="px-5 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#312f2c]/6">
                    {group.tiers.map((rule, i) => {
                      const isEditing = editingId === rule.id;
                      return (
                        <tr key={rule.id} className={`hover:bg-[#312f2c]/2 transition-colors ${!isExpanded && i > 0 ? 'hidden' : ''}`}>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <input type="number" min="1" step="0.01" value={editValues.min_qty}
                                onChange={e => setEditValues(v => ({ ...v, min_qty: e.target.value }))}
                                className="w-24 px-2 py-1 rounded border border-[#d1a054] text-sm outline-none" />
                            ) : (
                              <span className="font-semibold text-[#312f2c]">
                                {group.scope === 'measurement' ? `${rule.min_qty}` : `${rule.min_qty}+ units`}
                              </span>
                            )}
                          </td>
                          {group.scope === 'measurement' && (
                            <td className="px-5 py-3 font-semibold text-[#312f2c]">{rule.max_qty}</td>
                          )}
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <input type="number" min="0.1" max="100" step="0.1" value={editValues.discount_pct}
                                onChange={e => setEditValues(v => ({ ...v, discount_pct: e.target.value }))}
                                className="w-20 px-2 py-1 rounded border border-[#d1a054] text-sm outline-none" />
                            ) : (
                              <span className="font-bold text-[#059669]">{rule.discount_pct}%</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs">
                            {isEditing ? (
                              <input type="datetime-local" value={editValues.expires_at}
                                onChange={e => setEditValues(v => ({ ...v, expires_at: e.target.value }))}
                                className="px-2 py-1 rounded border border-[#d1a054] text-xs outline-none" />
                            ) : (
                              rule.expires_at
                                ? <span className="text-orange-600">{new Date(rule.expires_at).toLocaleDateString()}</span>
                                : <span className="text-[#312f2c]/30">No expiry</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSaveEdit(rule)} disabled={savingEditId === rule.id}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save">
                                    {savingEditId === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 text-[#312f2c]/40 hover:text-[#312f2c] rounded-lg transition-colors" title="Cancel">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleStartEdit(rule)} className="p-1.5 text-[#312f2c]/40 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Edit">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleDelete(rule.id)} disabled={deletingId === rule.id}
                                className="p-1.5 text-[#312f2c]/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                {deletingId === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
