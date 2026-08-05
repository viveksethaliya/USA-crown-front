'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, CheckCircle2, XCircle, Trash2, Loader2, Save, Edit2, Search, Target, Zap, CalendarRange, HelpCircle, X, Layers, ShoppingBag, ArrowRight, Lightbulb, Settings, Ticket, Check, Trophy, Ban, Globe, Folder, Package, Info, AlertOctagon, Filter } from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';
import { apiUrl } from '@/lib/api';
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

const CONDITION_TYPES = [
  { value: 'user_role', label: 'User Role', type: 'text' },
  { value: 'customer_group', label: 'Customer Group', type: 'entity' },
  { value: 'specific_user', label: 'Specific User ID', type: 'entity' },
  { value: 'account_status', label: 'Account Status', type: 'text' },
  { value: 'guest_only', label: 'Guest Only', type: 'boolean' },
  { value: 'product', label: 'Product ID', type: 'entity' },
  { value: 'category', label: 'Category', type: 'entity' },
  { value: 'tag', label: 'Tag ID', type: 'entity' },
  { value: 'brand', label: 'Brand ID', type: 'entity' },
  { value: 'attribute_value', label: 'Attribute Value ID', type: 'entity' },
  { value: 'variation', label: 'Variation ID', type: 'entity' },
  { value: 'quantity_min', label: 'Line Quantity Min', type: 'number' },
  { value: 'cart_subtotal_min', label: 'Cart Subtotal Min ($)', type: 'number' },
  { value: 'cart_subtotal_max', label: 'Cart Subtotal Max ($)', type: 'number' },
  { value: 'total_qty_min', label: 'Cart Total Qty Min', type: 'number' },
  { value: 'first_purchase', label: 'First Purchase', type: 'boolean' },
  { value: 'repeat_customer', label: 'Repeat Customer', type: 'boolean' },
  { value: 'ltv_min', label: 'Lifetime Value Min ($)', type: 'number' },
  { value: 'purchased_before', label: 'Purchased Before (Product ID)', type: 'entity' },
  { value: 'shipping_country', label: 'Shipping Country Code', type: 'text' },
  { value: 'billing_country', label: 'Billing Country Code', type: 'text' },
  { value: 'payment_method', label: 'Payment Method', type: 'text' },
  { value: 'shipping_method', label: 'Shipping Method', type: 'text' },
  { value: 'date_range', label: 'Date Range', type: 'text' }, // simplified text for now
  { value: 'day_of_week', label: 'Day of Week (1-7)', type: 'number' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In (comma list)' },
  { value: 'not_in', label: 'Not In (comma list)' },
];

const EMPTY_RULE = {
  name: '',
  internal_note: '',
  rule_type: 'product_discount',
  trigger_type: 'automatic',
  stacking_mode: 'stackable',
  priority: 100,
  status: 'active',
  campaign_id: '',
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
  // Attribute Exclusions
  exclusion_attribute_value_ids: [] as number[],
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
  const inclusions = targets.filter((t: any) => !t.is_exclusion);
  const exclusions = targets.filter((t: any) => t.is_exclusion);
  if (inclusions.length === 0) return (
    <span className="text-[#312f2c]/50 text-xs">
      All Products{exclusions.length > 0 ? <span className="ml-1 text-orange-500">({exclusions.length} excl.)</span> : ''}
    </span>
  );
  const firstInclusion = inclusions[0];
  const extra = inclusions.length - 1;
  return (
    <span className="text-[#312f2c]/70 text-xs capitalize">
      {firstInclusion.target_type} #{firstInclusion.target_id}{extra > 0 ? ` +${extra} more` : ''}
      {exclusions.length > 0 && <span className="ml-1 text-orange-500">({exclusions.length} excl.)</span>}
    </span>
  );
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
            </p>
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
                </div>
              </div>
            </div>
          </section>
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
  const [attributes, setAttributes] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [form, setForm] = useState({ ...EMPTY_RULE });
  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string; sku: string }[]>([]);
  
  // Array of dynamic conditions
  const [conditions, setConditions] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchJson = async (url: string) => {
        try {
          const res = await adminFetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) { console.error(`Failed to fetch ${url}`); return null; }
          return await res.json();
        } catch (e) {
          console.error(`Fetch error for ${url}`, e);
          return null;
        }
      };

      const [rulesData, groupsData, catsData, attrsData, campaignsData] = await Promise.all([
        fetchJson(`${API}/discounts`),
        fetchJson(`${API}/groups`),
        fetchJson(apiUrl('/api/admin/categories')),
        fetchJson(apiUrl('/api/admin/attributes')),
        fetchJson(`${API}/campaigns`),
      ]);

      if (!rulesData) toast.error('Failed to load discounts');
      
      setRules(rulesData?.data || []);
      setGroups(groupsData?.groups || []);
      setCategories(catsData || []);
      setAttributes(attrsData || []);
      setCampaigns(campaignsData?.data || []);
    } catch {
      toast.error('An unexpected error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Product search debounce
  useEffect(() => {
    if (!productSearch || form.target_scope !== 'product') return;
    const t = setTimeout(() => {
      adminFetch(apiUrl(`/api/admin/products?search=${encodeURIComponent(productSearch)}&limit=15`), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setProducts(d.data || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, form.target_scope, token]);

  const openNewForm = () => {
    setForm({ ...EMPTY_RULE });
    setSelectedProducts([]);
    setConditions([]);
    setEditingRuleId(null);
    setShowForm(true);
  };

  const openEditForm = async (rule: any) => {
    const res = await adminFetch(`${API}/discounts/${rule.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const { data: full } = await res.json();

    const action = full.discount_actions?.[0];
    const inclusions = (full.discount_targets || []).filter((t: any) => !t.is_exclusion);
    const exclusions = (full.discount_targets || []).filter((t: any) => t.is_exclusion && t.target_type === 'attribute_value');
    const firstTarget = inclusions[0];

    const targetScope = inclusions.length === 0 ? 'all' : firstTarget.target_type === 'category' ? 'category' : 'product';

    setForm({
      name: full.name || '',
      internal_note: full.internal_note || '',
      rule_type: full.rule_type || 'product_discount',
      trigger_type: full.trigger_type || 'automatic',
      stacking_mode: full.stacking_mode || 'stackable',
      priority: full.priority || 100,
      status: full.status || 'active',
      campaign_id: full.campaign_id ? String(full.campaign_id) : '',
      starts_at: full.starts_at ? full.starts_at.slice(0, 16) : '',
      ends_at: full.ends_at ? full.ends_at.slice(0, 16) : '',
      action_type: action?.action_type || 'percent_off',
      percent_value: action?.percent_value?.toString() || '',
      fixed_value: action?.fixed_value?.toString() || '',
      applies_to: action?.applies_to || 'matching_line',
      max_discount_amount: action?.max_discount_amount?.toString() || '',
      target_scope: targetScope,
      target_category_id: targetScope === 'category' ? String(inclusions[0]?.target_id || '') : '',
      target_product_ids: targetScope === 'product' ? inclusions.map((t: any) => t.target_id) : [],
      exclusion_attribute_value_ids: exclusions.map((t: any) => t.target_id),
    });

    if (targetScope === 'product') {
      const productIds = inclusions.map((t: any) => t.target_id);
      
      // Initially set with placeholders
      setSelectedProducts(productIds.map((id: number) => ({ id, name: `Loading...`, sku: '' })));
      
      // Fetch actual names
      if (productIds.length > 0) {
        Promise.all(productIds.map((id: number) => 
          adminFetch(apiUrl(`/api/admin/products/${id}`), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        )).then(results => {
          setSelectedProducts(results.map((p: any, idx: number) => ({
            id: productIds[idx],
            name: p.name || `Product #${productIds[idx]}`,
            sku: p.sku || ''
          })));
        }).catch(err => console.error("Failed to fetch product names", err));
      }
    } else {
      setSelectedProducts([]);
    }

    // Map existing conditions to local state
    if (full.discount_conditions && full.discount_conditions.length > 0) {
      const mapped = full.discount_conditions.map((c: any) => ({
        id: Math.random(),
        condition_group: c.condition_group,
        logic_operator: c.logic_operator,
        condition_type: c.condition_type,
        operator: c.operator,
        entity_id: c.entity_id ? String(c.entity_id) : '',
        value_text: c.value_text || '',
        value_number: c.value_number !== null ? String(c.value_number) : '',
      }));
      setConditions(mapped);
    } else {
      setConditions([]);
    }

    setEditingRuleId(rule.id);
    setShowForm(true);
  };

  const recalculateGroups = (conds: any[]) => {
    let currentGroup = 1;
    return conds.map((c, i) => {
      if (i > 0 && c.logic_operator === 'OR') currentGroup++;
      return { ...c, condition_group: currentGroup };
    });
  };

  const handleAddCondition = () => {
    const next = [
      ...conditions,
      { id: Math.random(), condition_group: 1, logic_operator: 'AND', condition_type: 'cart_subtotal_min', operator: 'greater_than', entity_id: '', value_text: '', value_number: '' }
    ];
    setConditions(recalculateGroups(next));
  };

  const handleUpdateCondition = (idx: number, key: string, val: any) => {
    const next = [...conditions];
    next[idx] = { ...next[idx], [key]: val };
    
    // Auto-clean up values when changing type
    if (key === 'condition_type') {
      next[idx].entity_id = '';
      next[idx].value_text = '';
      next[idx].value_number = '';
      const ctDef = CONDITION_TYPES.find(ct => ct.value === val);
      if (ctDef?.type === 'boolean') {
        next[idx].operator = 'equals';
      }
    }
    
    setConditions(recalculateGroups(next));
  };

  const handleRemoveCondition = (idx: number) => {
    const next = conditions.filter((_, i) => i !== idx);
    setConditions(recalculateGroups(next));
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
        campaign_id: form.campaign_id || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        // Drop the temporary local ID from conditions
        conditions: conditions.map(({ id, ...rest }) => rest)
      };

      const method = editingRuleId ? 'PUT' : 'POST';
      const url = editingRuleId ? `${API}/discounts/${editingRuleId}` : `${API}/discounts`;
      const res = await adminFetch(url, {
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
      const res = await adminFetch(`${API}/discounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3 flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> Rule Settings
            </p>
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
                <label className="block text-sm font-semibold text-[#312f2c] mb-1.5">Attach to Campaign</label>
                <select value={form.campaign_id} onChange={e => fv('campaign_id', e.target.value)}
                  className="w-full bg-white/70 border border-white/50 focus:border-[#d1a054] rounded-xl px-4 py-2.5 outline-none transition-all">
                  <option value="">None (Standalone Rule)</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          {/* === Section 1.5: Eligibility Conditions === */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-indigo-500" /> Eligibility Conditions
              </p>
              <button type="button" onClick={handleAddCondition} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Condition
              </button>
            </div>
            
            {conditions.length === 0 ? (
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 text-center text-sm text-indigo-700/70">
                This rule currently applies to everyone. Click "Add Condition" to restrict who gets it (e.g. Cart Subtotal {'>'} $500).
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((cond, index) => {
                  const typeDef = CONDITION_TYPES.find(c => c.value === cond.condition_type);
                  return (
                    <div key={cond.id} className="flex flex-col sm:flex-row gap-3 bg-white/80 border border-indigo-100 rounded-2xl p-3 items-center shadow-sm">
                      
                      {/* Logic Operator (show after first item) */}
                      {index > 0 ? (
                        <div className="sm:w-24">
                          <select value={cond.logic_operator} onChange={e => handleUpdateCondition(index, 'logic_operator', e.target.value)}
                            className="w-full bg-indigo-50 text-indigo-700 font-bold border-0 focus:ring-2 focus:ring-indigo-300 rounded-lg px-2 py-2 outline-none text-xs text-center cursor-pointer">
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      ) : (
                        <div className="sm:w-24 text-center text-xs font-bold text-[#312f2c]/30 uppercase tracking-widest">
                          When
                        </div>
                      )}

                      {/* Condition Type */}
                      <div className="flex-1 min-w-0 w-full">
                        <select value={cond.condition_type} onChange={e => handleUpdateCondition(index, 'condition_type', e.target.value)}
                          className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm font-semibold text-[#312f2c]">
                          {CONDITION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                        </select>
                      </div>

                      {/* Operator */}
                      <div className="sm:w-36 w-full">
                        <select value={cond.operator} onChange={e => handleUpdateCondition(index, 'operator', e.target.value)}
                          className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm">
                          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                      </div>

                      {/* Value Input */}
                      <div className="flex-1 min-w-0 w-full">
                        {typeDef?.type === 'entity' && cond.condition_type === 'customer_group' ? (
                          <select value={cond.entity_id} onChange={e => handleUpdateCondition(index, 'entity_id', e.target.value)}
                            className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm">
                            <option value="">Select group...</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        ) : typeDef?.type === 'entity' && cond.condition_type === 'category' ? (
                          <select value={cond.entity_id} onChange={e => handleUpdateCondition(index, 'entity_id', e.target.value)}
                            className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm">
                            <option value="">Select category...</option>
                            {displayCategories.map(c => (
                              <option key={c.id} value={c.id}>{'\u00A0\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '↳ ' : ''}{c.name}</option>
                            ))}
                          </select>
                        ) : typeDef?.type === 'entity' ? (
                          <input type="number" placeholder="Enter ID..." value={cond.entity_id} onChange={e => handleUpdateCondition(index, 'entity_id', e.target.value)}
                            className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm" />
                        ) : typeDef?.type === 'number' ? (
                          <input type="number" step="0.01" placeholder="Enter number..." value={cond.value_number} onChange={e => handleUpdateCondition(index, 'value_number', e.target.value)}
                            className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm" />
                        ) : typeDef?.type === 'boolean' ? (
                          <div className="flex items-center h-full px-2 text-xs text-[#312f2c]/40 italic">
                            (No value needed)
                          </div>
                        ) : (
                          <input type="text" placeholder="Enter text..." value={cond.value_text} onChange={e => handleUpdateCondition(index, 'value_text', e.target.value)}
                            className="w-full bg-white border border-[#312f2c]/15 focus:border-indigo-400 rounded-xl px-3 py-2 outline-none text-sm" />
                        )}
                      </div>

                      {/* Remove Button */}
                      <button type="button" onClick={() => handleRemoveCondition(index)} className="p-2 text-[#312f2c]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-white/40" />

          {/* === Section 2: Action (The Actual Discount) === */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#d1a054]" /> Discount Action <span className="text-red-400">*</span>
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
              <Target className="w-4 h-4 text-rose-500" /> Target — What does this apply to?
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

          <hr className="border-white/40" />

          {/* === Section 4: Attribute-Based Exclusions === */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#312f2c]/40 mb-1 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-orange-500" /> Attribute Exclusions <span className="font-normal text-[#312f2c]/30 normal-case text-[11px]">(optional)</span>
            </p>
            <p className="text-xs text-[#312f2c]/50 mb-4">
              Products with any of the checked attribute values will be <strong>excluded</strong> from this discount.
            </p>
            {attributes.length === 0 ? (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm text-orange-700">
                No attributes found. Add attributes first from the <strong>Attributes</strong> section.
              </div>
            ) : (
              <div className="space-y-4">
                {attributes.map((attr: any) => (
                  <div key={attr.id} className="bg-white/50 border border-white/50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-[#312f2c] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                      {attr.name}
                    </p>
                    {attr.attribute_values && attr.attribute_values.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {attr.attribute_values.map((av: any) => {
                          const isExcluded = form.exclusion_attribute_value_ids.includes(av.id);
                          return (
                            <label
                              key={av.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-sm font-medium transition-all select-none ${
                                isExcluded
                                  ? 'bg-orange-500/10 border-orange-400/40 text-orange-700'
                                  : 'bg-white/60 border-[#312f2c]/15 text-[#312f2c]/65 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={(e) => {
                                  const ids = form.exclusion_attribute_value_ids;
                                  if (e.target.checked) {
                                    fv('exclusion_attribute_value_ids', [...ids, av.id]);
                                  } else {
                                    fv('exclusion_attribute_value_ids', ids.filter((x: number) => x !== av.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 accent-orange-500"
                              />
                              {av.color_hex && (
                                <span className="w-3.5 h-3.5 rounded-full border border-white/60 flex-shrink-0" style={{ backgroundColor: av.color_hex }}></span>
                              )}
                              {av.value}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#312f2c]/40 italic">No values for this attribute.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {form.exclusion_attribute_value_ids.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 font-medium">
                <AlertOctagon className="w-3.5 h-3.5" />
                {form.exclusion_attribute_value_ids.length} attribute value(s) will be excluded.
                <button type="button" onClick={() => fv('exclusion_attribute_value_ids', [])} className="underline hover:no-underline ml-1">Clear all</button>
              </div>
            )}
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
                      {rule.discount_conditions && rule.discount_conditions.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                          <Filter className="w-3 h-3" /> {rule.discount_conditions.length} conditions
                        </div>
                      )}
                    </td>
                    <td className="p-4">{getActionSummary(rule)}</td>
                    <td className="p-4">{getTargetSummary(rule)}</td>
                    <td className="p-4">
                      {rule.trigger_type === 'coupon' ? (
                        <span className="flex items-center gap-1.5 text-purple-600 font-semibold text-xs"><Ticket className="w-3.5 h-3.5" /> Coupon</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[#312f2c]/60 font-semibold text-xs"><Zap className="w-3.5 h-3.5" /> Auto</span>
                      )}
                    </td>
                    <td className="p-4">
                      {rule.stacking_mode === 'exclusive' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">Exclusive</span>}
                      {rule.stacking_mode === 'stackable' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Stackable</span>}
                      {rule.stacking_mode === 'best_of_group' && <span className="px-2 py-0.5 bg-[#d1a054]/20 text-[#c19044] rounded text-xs font-bold">Best of Group</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(rule)} className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
