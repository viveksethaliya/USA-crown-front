'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, CheckCircle2, XCircle, Trash2, Loader2, Save, Edit2, ChevronDown, ChevronUp, Search, Target, Zap, CalendarRange, HelpCircle, X, Layers, ShoppingBag, Users, ArrowRight, Lightbulb, Settings, Ticket, Check, Trophy, Ban, Globe, Folder, Package, Info } from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import { apiUrl } from '@/lib/cart';
import toast from 'react-hot-toast';

const RULE_TYPES = [
  { value: 'product_discount', label: 'Product Discount' },
  { value: 'category_discount', label: 'Category Discount' },
  { value: 'quantity_tier', label: 'Quantity Tier' },
  { value: 'cart_discount', label: 'Cart Discount' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y' },
];

const STACKING_MODES = [
  { value: 'stackable', label: 'Stackable', desc: 'Combines with other discounts' },
  { value: 'best_of_group', label: 'Best of Group', desc: 'Only best discount in priority group applies' },
  { value: 'exclusive', label: 'Exclusive', desc: 'Prevents all other discounts' },
];

const ACTION_TYPES = [
  { value: 'percent_off', label: '% Percent Off' },
  { value: 'fixed_amount_off', label: '$ Fixed Amount Off' },
];

const TARGET_SCOPES = [
  { value: 'all', label: 'All Products' },
  { value: 'category', label: 'Specific Category' },
  { value: 'product', label: 'Specific Product(s)' },
];

const EMPTY_RULE = {
  name: '',
  internal_note: '',
  rule_type: 'product_discount',
  trigger_type: 'automatic',
  stacking_mode: 'stackable',
  priority: 100,
  status: 'active',
  customer_group_id: '',
  starts_at: '',
  ends_at: '',
  // Action
  action_type: 'percent_off',
  percent_value: '',
  fixed_value: '',
  applies_to: 'matching_line',
  max_discount_amount: '',
  // Targets
  target_scope: 'all',
  target_category_id: '',
  target_product_ids: [] as number[],
};

function getActionSummary(rule: any) {
  const action = rule.discount_actions?.[0];
  if (!action) return <span className="text-red-500/80 text-xs font-medium">⚠ No action set</span>;
  if (action.action_type === 'percent_off') return <span className="text-emerald-600 font-semibold text-xs">{action.percent_value}% off</span>;
  if (action.action_type === 'fixed_amount_off') return <span className="text-emerald-600 font-semibold text-xs">${action.fixed_value} off</span>;
  return <span className="text-xs text-[#312f2c]/50">{action.action_type}</span>;
}

function getTargetSummary(rule: any) {
  const targets = rule.discount_targets || [];
  if (targets.length === 0) return <span className="text-[#312f2c]/50 text-xs">All Products</span>;
  const firstInclusion = targets.find((t: any) => !t.is_exclusion);
  if (!firstInclusion) return <span className="text-[#312f2c]/50 text-xs">All Products</span>;
  const extra = targets.filter((t: any) => !t.is_exclusion).length - 1;
  return <span className="text-[#312f2c]/70 text-xs capitalize">{firstInclusion.target_type} #{firstInclusion.target_id}{extra > 0 ? ` +${extra} more` : ''}</span>;
}

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
        {/* Modal Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-[#312f2c]/8 px-7 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d1a054]/15 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-[#d1a054]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#312f2c]">How Promotions Work</h2>
              <p className="text-xs text-[#312f2c]/50">A plain-language guide for creating discount rules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#312f2c]/5 text-[#312f2c]/40 hover:text-[#312f2c] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">

          {/* Section: What is a Promotion? */}
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d1a054]" /> What is a Promotion Rule?
            </h3>
            <p className="text-sm text-[#312f2c]/70 leading-relaxed">
              A <strong>Promotion Rule</strong> tells the system: <em>&ldquo;Give X% off to customers who meet Y conditions on Z products.&rdquo;</em>
              Every rule has three parts you must fill in:
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { icon: <Settings className="w-6 h-6" />, title: 'Rule Settings', desc: 'Who gets it, when it runs, and whether it combines with other deals.', color: 'text-gray-500' },
                { icon: <Tag className="w-6 h-6" />, title: 'Discount Action', desc: 'The actual amount — e.g. 10% off or $5 off. This is required.', color: 'text-[#d1a054]' },
                { icon: <Target className="w-6 h-6" />, title: 'Target', desc: 'Which products it applies to — all, a category, or specific items.', color: 'text-rose-500' },
              ].map(item => (
                <div key={item.title} className="bg-[#f0ede5]/60 rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                  <div className="text-xs font-bold text-[#312f2c] mb-1">{item.title}</div>
                  <div className="text-xs text-[#312f2c]/60 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#312f2c]/8" />

          {/* Section: Trigger Types */}
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#d1a054]" /> Automatic vs. Coupon Trigger
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-4 bg-[#d1a054]/8 border border-[#d1a054]/20 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-[#d1a054]/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-[#d1a054]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#312f2c] mb-0.5">Automatic</div>
                  <div className="text-sm text-[#312f2c]/65 leading-relaxed">
                    The discount is applied <strong>without the customer doing anything</strong>. As soon as they qualify (right group, right products in cart), the price drops automatically.
                  </div>
                  <div className="mt-1.5 text-xs text-[#d1a054] font-medium">Example: &ldquo;All Wholesale A members get 10% off sterling silver wire automatically.&rdquo;</div>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#312f2c] mb-0.5">Coupon (requires a code)</div>
                  <div className="text-sm text-[#312f2c]/65 leading-relaxed">
                    The customer must <strong>type a code at checkout</strong> to activate this rule. After creating a coupon-type rule here, go to <strong>Coupon Codes</strong> to generate the actual code.
                  </div>
                  <div className="mt-1.5 text-xs text-purple-600 font-medium">Example: &ldquo;Enter SAVE20 to get 20% off your order.&rdquo;</div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#312f2c]/8" />

          {/* Section: Stacking Modes */}
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d1a054]" /> Stacking Modes — Can Discounts Combine?
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  badge: 'Stackable', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Check className="w-5 h-5 text-emerald-600" />,
                  desc: 'This discount adds on top of other discounts. If a customer qualifies for multiple stackable rules, they get all of them combined.',
                  example: 'Group gets 5% off. Plus a stackable holiday promo adds another 10%. Total = 15% off.'
                },
                {
                  badge: 'Best of Group', color: 'bg-[#d1a054]/15 text-[#c19044] border-[#d1a054]/30', icon: <Trophy className="w-5 h-5 text-[#d1a054]" />,
                  desc: 'If multiple rules exist at the same priority level, only the one that gives the biggest savings is used. Prevents customers from getting too many overlapping deals.',
                  example: 'Two category discounts exist: 8% off chains, 12% off chains for VIP. VIP gets 12%, not both.'
                },
                {
                  badge: 'Exclusive', color: 'bg-red-100 text-red-700 border-red-200', icon: <Ban className="w-5 h-5 text-red-500" />,
                  desc: 'If this rule applies, NO other discount can apply at the same time. Use for special one-time deals where you want full control.',
                  example: 'Clearance sale: 40% off selected items. No other discounts can stack on these items.'
                },
              ].map(item => (
                <div key={item.badge} className="flex gap-4 p-4 border border-[#312f2c]/8 rounded-2xl items-start">
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.color}`}>{item.badge}</span>
                    </div>
                    <p className="text-sm text-[#312f2c]/65 leading-relaxed">{item.desc}</p>
                    <p className="text-xs text-[#312f2c]/45 mt-1 italic">{item.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#312f2c]/8" />

          {/* Section: Priority */}
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#d1a054]" /> Priority Number
            </h3>
            <div className="text-sm text-[#312f2c]/70 leading-relaxed space-y-2">
              <p>The <strong>Priority</strong> number decides the order in which rules are evaluated. <strong>Lower number = runs first.</strong></p>
              <div className="flex items-center gap-2 bg-[#f0ede5] rounded-xl px-4 py-3 text-sm">
                <span className="font-mono font-bold bg-[#312f2c] text-white rounded-md px-2 py-0.5 text-xs">10</span>
                <ArrowRight className="w-3 h-3 text-[#312f2c]/40" />
                <span className="font-mono font-bold bg-[#312f2c] text-white rounded-md px-2 py-0.5 text-xs">50</span>
                <ArrowRight className="w-3 h-3 text-[#312f2c]/40" />
                <span className="font-mono font-bold bg-[#312f2c] text-white rounded-md px-2 py-0.5 text-xs">100</span>
                <span className="text-[#312f2c]/50 text-xs ml-2">(default)</span>
              </div>
              <p className="text-xs text-[#312f2c]/50">If two exclusive rules both match a cart, the one with the lower priority number wins. For stackable rules, priority just controls the evaluation order.</p>
            </div>
          </section>

          <hr className="border-[#312f2c]/8" />

          {/* Section: Targets */}
          <section>
            <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#d1a054]" /> Targets — What the Discount Applies To
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Globe className="w-6 h-6" />, title: 'All Products', desc: 'Every single product in the store gets this discount (for qualifying customers).', color: 'text-indigo-500' },
                { icon: <Folder className="w-6 h-6" />, title: 'Specific Category', desc: 'Only products inside the selected category get the discount. Subcategories are included.', color: 'text-amber-500' },
                { icon: <Package className="w-6 h-6" />, title: 'Specific Products', desc: 'You search for and pick exact products. Only those items are discounted.', color: 'text-teal-500' },
              ].map(item => (
                <div key={item.title} className="bg-[#f0ede5]/60 rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                  <div className="text-xs font-bold text-[#312f2c] mb-1">{item.title}</div>
                  <div className="text-xs text-[#312f2c]/60 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer note */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-4 items-start">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-800 mb-0.5">Group Pricing Rules are separate</div>
              <div className="text-sm text-blue-700/80 leading-relaxed">
                The rules here (Promotions) are for store-wide or campaign discounts. For <strong>per-customer-group pricing</strong>
                (like &ldquo;Wholesale A gets 15% off all gold wire&rdquo;), go to <strong>Group Pricing</strong> in the sidebar instead.
                Both systems work together — group pricing fires first, then promotions are layered on top.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function DiscountsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_RULE });
  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string; sku: string }[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesRes, groupsRes, catsRes] = await Promise.all([
        fetch(`${API}/discounts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/admin/categories'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRules((await rulesRes.json()).data || []);
      setGroups((await groupsRes.json()).groups || []);
      setCategories((await catsRes.json()) || []);
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Product search debounce
  useEffect(() => {
    if (!productSearch || form.target_scope !== 'product') return;
    const t = setTimeout(() => {
      fetch(apiUrl(`/api/admin/products?search=${encodeURIComponent(productSearch)}&limit=15`), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setProducts(d.data || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, form.target_scope, token]);

  const openNewForm = () => {
    setForm({ ...EMPTY_RULE });
    setSelectedProducts([]);
    setEditingRuleId(null);
    setShowForm(true);
  };

  const openEditForm = async (rule: any) => {
    const res = await fetch(`${API}/discounts/${rule.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const { data: full } = await res.json();

    const cond = full.discount_conditions?.find((c: any) => c.condition_type === 'customer_group');
    const action = full.discount_actions?.[0];
    const targets = (full.discount_targets || []).filter((t: any) => !t.is_exclusion);
    const firstTarget = targets[0];

    const targetScope = targets.length === 0 ? 'all' : firstTarget.target_type === 'category' ? 'category' : 'product';

    setForm({
      name: full.name || '',
      internal_note: full.internal_note || '',
      rule_type: full.rule_type || 'product_discount',
      trigger_type: full.trigger_type || 'automatic',
      stacking_mode: full.stacking_mode || 'stackable',
      priority: full.priority || 100,
      status: full.status || 'active',
      customer_group_id: cond ? String(cond.entity_id) : '',
      starts_at: full.starts_at ? full.starts_at.slice(0, 16) : '',
      ends_at: full.ends_at ? full.ends_at.slice(0, 16) : '',
      action_type: action?.action_type || 'percent_off',
      percent_value: action?.percent_value?.toString() || '',
      fixed_value: action?.fixed_value?.toString() || '',
      applies_to: action?.applies_to || 'matching_line',
      max_discount_amount: action?.max_discount_amount?.toString() || '',
      target_scope: targetScope,
      target_category_id: targetScope === 'category' ? String(targets[0]?.target_id || '') : '',
      target_product_ids: targetScope === 'product' ? targets.map((t: any) => t.target_id) : [],
    });
    if (targetScope === 'product') {
      setSelectedProducts(targets.map((t: any) => ({ id: t.target_id, name: `Product #${t.target_id}`, sku: '' })));
    } else {
      setSelectedProducts([]);
    }
    setEditingRuleId(rule.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Rule name is required');
    const actionValue = form.action_type === 'percent_off' ? parseFloat(form.percent_value) : parseFloat(form.fixed_value);
    if (isNaN(actionValue) || actionValue <= 0) return toast.error('A valid discount value (> 0) is required');

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority),
        target_product_ids: selectedProducts.map(p => p.id),
        customer_group_id: form.customer_group_id || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };

      const method = editingRuleId ? 'PUT' : 'POST';
      const url = editingRuleId ? `${API}/discounts/${editingRuleId}` : `${API}/discounts`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingRuleId ? 'Rule updated!' : 'Rule created!');
        setShowForm(false);
        setEditingRuleId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save rule');
      }
    } catch {
      toast.error('Error saving rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this discount rule? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/discounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success('Rule deleted'); fetchData(); }
    } catch { toast.error('Error deleting rule'); }
  };

  const hierarchicalCategories = (cats: any[], parentId: any = null, depth = 0): any[] => {
    let result: any[] = [];
    cats.filter(c => c.parent_id === parentId).forEach(c => {
      result.push({ ...c, depth });
      result = result.concat(hierarchicalCategories(cats, c.id, depth + 1));
    });
    return result;
  };
  const displayCategories = hierarchicalCategories(categories);

  const fv = (key: keyof typeof form, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#312f2c] tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-[#d1a054]" /> Promotions
          </h2>
          <p className="text-[#312f2c]/60 mt-1">Create automatic discounts and coupon-backed rules</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[#312f2c]/60 hover:text-[#312f2c] border border-[#312f2c]/15 hover:border-[#312f2c]/30 hover:bg-white/60 transition-all"
            title="How do promotions work?"
          >
            <HelpCircle className="w-4 h-4" />
            How it works
          </button>
          <button
            onClick={() => showForm ? (setShowForm(false), setEditingRuleId(null)) : openNewForm()}
            className="bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {showForm ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'New Promotion'}
          </button>
        </div>
      </div>

      {/* ========== FORM ========== */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          <h3 className="text-xl font-bold text-[#312f2c]">{editingRuleId ? 'Edit Promotion Rule' : 'Create Promotion Rule'}</h3>

          {/* === Section 1: Rule Header === */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3">Rule Settings</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Rule Name *</label>
                <input required value={form.name} onChange={e => fv('name', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                  placeholder="e.g. 10% off all gold wire for Wholesale A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Status</label>
                <select value={form.status} onChange={e => fv('status', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Type</label>
                <select value={form.rule_type} onChange={e => fv('rule_type', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Trigger</label>
                <select value={form.trigger_type} onChange={e => fv('trigger_type', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  <option value="automatic">Automatic</option>
                  <option value="coupon">Coupon (requires a code)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Priority <span className="font-normal text-[#312f2c]/50">(lower = first)</span></label>
                <input type="number" value={form.priority} onChange={e => fv('priority', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Stacking Mode</label>
                <select value={form.stacking_mode} onChange={e => fv('stacking_mode', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  {STACKING_MODES.map(m => <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Restrict to Customer Group</label>
                <select value={form.customer_group_id} onChange={e => fv('customer_group_id', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  <option value="">All Customers</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" />Starts At</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => fv('starts_at', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5 flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" />Expires At</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => fv('ends_at', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all text-sm" />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Internal Note <span className="font-normal text-[#312f2c]/40">(not shown to customers)</span></label>
                <input value={form.internal_note} onChange={e => fv('internal_note', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                  placeholder="Optional memo for team reference" />
              </div>
            </div>
          </div>

          <hr className="border-white/40" />

          {/* === Section 2: Action (The Actual Discount) === */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#d1a054]" /> Discount Action <span className="text-red-400">*</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#d1a054]/5 border border-[#d1a054]/20 rounded-2xl p-4">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Discount Type</label>
                <select value={form.action_type} onChange={e => fv('action_type', e.target.value)}
                  className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">
                  {form.action_type === 'percent_off' ? 'Discount Percent (%)' : 'Discount Amount ($)'}
                </label>
                {form.action_type === 'percent_off' ? (
                  <input required type="number" min="0.1" max="100" step="0.1" value={form.percent_value}
                    onChange={e => fv('percent_value', e.target.value)}
                    className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                    placeholder="e.g. 15" />
                ) : (
                  <input required type="number" min="0.01" step="0.01" value={form.fixed_value}
                    onChange={e => fv('fixed_value', e.target.value)}
                    className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                    placeholder="e.g. 10.00" />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Max Discount Cap ($) <span className="font-normal text-[#312f2c]/40">optional</span></label>
                <input type="number" min="0" step="0.01" value={form.max_discount_amount}
                  onChange={e => fv('max_discount_amount', e.target.value)}
                  className="w-full bg-white border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all"
                  placeholder="No cap" />
              </div>
            </div>
          </div>

          <hr className="border-white/40" />

          {/* === Section 3: Targets (What Does it Apply To?) === */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Target — What does this apply to?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Apply to</label>
                <select value={form.target_scope} onChange={e => { fv('target_scope', e.target.value); setSelectedProducts([]); setProductSearch(''); }}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  {TARGET_SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {form.target_scope === 'category' && (
                <div>
                  <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Category</label>
                  <select required value={form.target_category_id} onChange={e => fv('target_category_id', e.target.value)}
                    className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                    <option value="">Select a category...</option>
                    {displayCategories.map(c => (
                      <option key={c.id} value={c.id}>{'\u00A0\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '↳ ' : ''}{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.target_scope === 'product' && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Products</label>
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 bg-[#312f2c] text-[#f0ede5] px-2 py-1 rounded-md text-xs font-medium">
                          {p.name}
                          <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(x => x.id !== p.id))} className="hover:text-red-300">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#312f2c]/40" />
                    <input type="text" placeholder="Search and add products..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl outline-none transition-all text-sm" />
                  </div>
                  {productSearch && (
                    <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-[#312f2c]/15 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                      {products.length === 0 ? (
                        <div className="p-3 text-sm text-[#312f2c]/50">No products found</div>
                      ) : products.map(p => {
                        const isSelected = selectedProducts.some(x => x.id === p.id);
                        return (
                          <div key={p.id} onClick={() => { if (!isSelected) { setSelectedProducts(prev => [...prev, p]); setProductSearch(''); } }}
                            className={`p-2.5 text-sm border-b border-[#312f2c]/5 flex justify-between items-center ${isSelected ? 'opacity-40 cursor-default' : 'cursor-pointer hover:bg-[#d1a054]/5'}`}>
                            <span>{p.name} <span className="text-xs text-[#312f2c]/40">({p.sku})</span></span>
                            {isSelected && <span className="text-xs font-bold text-emerald-600">Added</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[#312f2c]/70 hover:bg-white/50 transition-all">Cancel</button>
            <button type="submit" disabled={isSaving} className="bg-[#d1a054] hover:bg-[#c19044] text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-60">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingRuleId ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </form>
      )}

      {/* ========== RULES TABLE ========== */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : rules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#312f2c]/50">
            <Zap className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">No promotions yet</p>
            <p className="text-sm">Click "New Promotion" to create your first discount rule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/50 text-[#312f2c]/60 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Discount Action</th>
                  <th className="p-4">Targets</th>
                  <th className="p-4">Trigger</th>
                  <th className="p-4">Stacking</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 text-sm">
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-white/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-[#312f2c]">{rule.name}</div>
                      {rule.internal_note && <div className="text-xs text-[#312f2c]/40 mt-0.5 truncate max-w-[200px]">{rule.internal_note}</div>}
                    </td>
                    <td className="p-4">{getActionSummary(rule)}</td>
                    <td className="p-4">{getTargetSummary(rule)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${rule.trigger_type === 'automatic' ? 'bg-[#d1a054]/10 text-[#d1a054]' : 'bg-purple-500/10 text-purple-600'}`}>
                        {rule.trigger_type}
                      </span>
                    </td>
                    <td className="p-4 text-[#312f2c]/70 text-xs capitalize">{rule.stacking_mode?.replace(/_/g, ' ')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${rule.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(rule)} className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
