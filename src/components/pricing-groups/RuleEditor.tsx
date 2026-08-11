'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Search, Check } from 'lucide-react';

function DynamicTargetSelect({ 
  type, 
  value, 
  onChange 
}: { 
  type: string, 
  value: string, 
  onChange: (val: string) => void 
}) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');

  // Initial load to resolve existing ID to name
  useEffect(() => {
    if (!value || type === 'all' || type === 'measurement' || type === 'attribute_value') return;
    
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await adminFetch(`/api/admin/pricing-groups/target-options?type=${type}&id=${value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.option) setSelectedName(data.option.name);
        }
      } catch (e) {
        console.error("Failed to load initial option name", e);
      }
    };
    fetchInitial();
  }, [value, type]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch options list
  useEffect(() => {
    if (type === 'all' || type === 'measurement' || type === 'attribute_value') return;
    
    // For large collections, only search if we have a term (or just open the dropdown and see the first 50)
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await adminFetch(`/api/admin/pricing-groups/target-options?type=${type}${debouncedTerm ? `&q=${encodeURIComponent(debouncedTerm)}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOptions(data.options || []);
        }
      } catch (e) {
        console.error("Failed to load options", e);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen || type === 'category' || type === 'brand' || type === 'tag') {
       fetchOptions();
    }
  }, [type, debouncedTerm, isOpen]);

  const isLarge = type === 'product' || type === 'variation';

  if (!isLarge) {
    return (
      <select 
        value={value} 
        onChange={e => {
           onChange(e.target.value);
           const opt = options.find(o => String(o.id) === e.target.value);
           if (opt) setSelectedName(opt.name);
        }} 
        className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 bg-white"
        required
      >
        <option value="" disabled>Select {type}...</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }

  // Searchable dropdown for Products and Variations
  return (
    <div className="relative">
      <div 
        className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 bg-white flex justify-between items-center cursor-text"
        onClick={() => setIsOpen(true)}
      >
        <span className={value ? "text-[#312f2c]" : "text-gray-400"}>
          {value ? (selectedName || `ID: ${value}`) : `Search ${type}...`}
        </span>
        <Search className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#312f2c]/20 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#312f2c]/10 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              autoFocus
              type="text" 
              className="w-full outline-none text-sm" 
              placeholder={`Type to search ${type}s...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">Loading...</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No results found.</div>
            ) : (
              options.map(o => (
                <div 
                  key={o.id}
                  className={`p-2 px-3 text-sm cursor-pointer hover:bg-amber-50 flex justify-between items-center ${String(value) === String(o.id) ? 'bg-amber-50 text-amber-700' : ''}`}
                  onClick={() => {
                    onChange(String(o.id));
                    setSelectedName(o.name);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span className="truncate pr-4">{o.name}</span>
                  {String(value) === String(o.id) && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Invisible backdrop to close dropdown */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

export default function RuleEditor({ group, ruleType, initialRule, onClose, onSaved }: { 
  group: any, 
  ruleType: 'group_pricing' | 'promotion', 
  initialRule: any, 
  onClose: () => void,
  onSaved: () => void
}) {
  const isEditing = !!initialRule;
  
  // Flatten initial rule into form state
  const action = initialRule?.discount_actions?.[0];
  const target = initialRule?.discount_targets?.[0];
  const condition = initialRule?.discount_conditions?.[0];
  
  // Infer preset from action/rule
  let initialPreset = ruleType === 'group_pricing' ? 'base_percent' : 'promo_percent';
  if (action?.action_type === 'fixed_price') initialPreset = 'fixed_price';
  if (action?.action_type === 'fixed_amount_off') initialPreset = 'promo_amount';
  if (action?.action_type === 'tier_price') initialPreset = 'quantity_tier';
  if (initialRule?.requires_min_cart_subtotal) initialPreset = 'spend_threshold';

  const [formData, setFormData] = useState({
    preset: initialPreset,
    name: initialRule?.name || '',
    trigger_type: initialRule?.trigger_type || 'automatic',
    status: initialRule?.status || 'draft',
    starts_at: initialRule?.starts_at ? initialRule.starts_at.substring(0, 16) : '',
    ends_at: initialRule?.ends_at ? initialRule.ends_at.substring(0, 16) : '',
    priority: initialRule?.priority || 10,
    stacking_mode: initialRule?.stacking_mode || (ruleType === 'promotion' ? 'stackable' : 'best_of_group'),
    requires_min_cart_qty: initialRule?.requires_min_cart_qty || '',
    requires_min_cart_subtotal: initialRule?.requires_min_cart_subtotal || '',
    max_total_uses: initialRule?.max_total_uses || '',
    max_uses_per_user: initialRule?.max_uses_per_user || '',
    campaign_id: initialRule?.campaign_id || '',
    
    // Action
    discount_value: action?.percent_value || action?.fixed_value || '',
    max_discount_amount: action?.max_discount_amount || '',
    
    // Target
    target_type: target?.target_type || 'all',
    target_id: target?.target_id || '',
    is_exclusion: target?.is_exclusion || false,
    
    // Condition
    condition_type: condition?.condition_type || 'none',
    condition_value: condition?.value_number || condition?.value_text || '',
    
    // Measurement specific
    meas_type: initialRule?.metadata?.legacy_measurement?.type || 'inch',
    meas_min: initialRule?.metadata?.legacy_measurement?.min || '',
    meas_max: initialRule?.metadata?.legacy_measurement?.max || '',
  });

  const [tiers, setTiers] = useState<any[]>(action?.action_type === 'tier_price' && action.tiers ? action.tiers : [{ min_quantity: 1, max_quantity: '', percent_value: '' }]);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [campRes, attrRes] = await Promise.all([
          adminFetch(`/api/admin/pricing-groups/${group.id}/campaigns`, { headers }),
          adminFetch(`/api/admin/attributes`, { headers })
        ]);

        if (campRes.ok) {
          const campData = await campRes.json();
          setCampaigns(campData.campaigns || []);
        }
        
        if (attrRes.ok) {
          const attrData = await attrRes.json();
          setAttributes(Array.isArray(attrData) ? attrData : []);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, [group.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const val = type === 'checkbox' ? target.checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleTierChange = (index: number, field: string, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  const addTier = () => setTiers([...tiers, { min_quantity: '', max_quantity: '', percent_value: '' }]);
  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Rule name is required');
    
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        source_kind: ruleType,
        trigger_type: formData.trigger_type,
        status: formData.status,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        priority: parseInt(formData.priority.toString()) || 10,
        stacking_mode: formData.stacking_mode,
        requires_min_cart_qty: formData.requires_min_cart_qty ? parseInt(formData.requires_min_cart_qty.toString()) : null,
        requires_min_cart_subtotal: formData.requires_min_cart_subtotal ? parseFloat(formData.requires_min_cart_subtotal.toString()) : null,
        max_total_uses: formData.max_total_uses ? parseInt(formData.max_total_uses.toString()) : null,
        max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user.toString()) : null,
        campaign_id: formData.campaign_id ? parseInt(formData.campaign_id.toString()) : null,
        actions: [],
        targets: [],
        conditions: []
      };

      // Action Resolution based on preset
      let actionObj: any = {};
      if (formData.preset === 'base_percent' || formData.preset === 'promo_percent' || formData.preset === 'spend_threshold') {
        actionObj = { action_type: 'percent_off', percent_value: parseFloat(formData.discount_value.toString()) };
      } else if (formData.preset === 'fixed_price') {
        actionObj = { action_type: 'fixed_price', fixed_value: parseFloat(formData.discount_value.toString()) };
      } else if (formData.preset === 'promo_amount') {
        actionObj = { action_type: 'fixed_amount_off', fixed_value: parseFloat(formData.discount_value.toString()) };
      } else if (formData.preset === 'quantity_tier') {
        actionObj = { action_type: 'tier_price', tiers: tiers.map(t => ({
          min_quantity: parseInt(t.min_quantity),
          max_quantity: t.max_quantity ? parseInt(t.max_quantity) : null,
          percent_value: parseFloat(t.percent_value)
        }))};
      }
      
      if (formData.max_discount_amount) {
         actionObj.max_discount_amount = parseFloat(formData.max_discount_amount.toString());
      }
      payload.actions.push(actionObj);

      // Rank mapping for group pricing
      if (ruleType === 'group_pricing') {
        if (formData.target_type === 'variation') payload.specificity_rank = 4;
        else if (formData.target_type === 'product') payload.specificity_rank = 3;
        else if (formData.target_type === 'measurement') payload.specificity_rank = 2;
        else if (formData.target_type === 'category' || formData.target_type === 'brand' || formData.target_type === 'tag' || formData.target_type === 'attribute_value') payload.specificity_rank = 1;
        else payload.specificity_rank = 0; // global
      }

      if (formData.target_type === 'measurement') {
        payload.metadata = {
          legacy_measurement: {
            type: formData.meas_type,
            min: formData.meas_min ? parseFloat(formData.meas_min.toString()) : null,
            max: formData.meas_max ? parseFloat(formData.meas_max.toString()) : null
          }
        };
      } else if (formData.target_type !== 'all') {
        payload.targets.push({
          target_type: formData.target_type,
          target_id: formData.target_id,
          is_exclusion: formData.is_exclusion
        });
      }

      if (formData.condition_type !== 'none') {
        payload.conditions.push({
          condition_type: formData.condition_type,
          value_number: formData.condition_value ? parseFloat(formData.condition_value.toString()) : null
        });
      }

      const token = localStorage.getItem('adminToken');
      const endpoint = isEditing 
        ? `/api/admin/pricing-groups/${group.id}/rules/${initialRule.id}`
        : `/api/admin/pricing-groups/${group.id}/rules`;
        
      const res = await adminFetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save rule');
      
      toast.success(isEditing ? 'Rule updated' : 'Rule created');
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#312f2c]/50 flex justify-end z-[100] transition-opacity">
      <div className="bg-white shadow-2xl w-full max-w-4xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#312f2c]/10 bg-[#312f2c]/5 shrink-0">
          <h3 className="text-xl font-bold text-[#312f2c]">
            {isEditing ? 'Edit Rule' : `Create ${ruleType === 'group_pricing' ? 'Base Rule' : 'Promotion'}`}
          </h3>
          <button onClick={onClose} className="text-[#312f2c]/40 hover:text-[#312f2c]/60 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="ruleForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Rule Type / Preset Selection */}
            <div>
              <label className="block text-sm font-medium text-[#312f2c]/80 mb-2">Rule Preset</label>
              <div className="grid grid-cols-3 gap-3">
                {ruleType === 'group_pricing' ? (
                  <>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'base_percent' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="base_percent" checked={formData.preset === 'base_percent'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Percentage Discount</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Scale off base price</div>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'fixed_price' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="fixed_price" checked={formData.preset === 'fixed_price'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Fixed Contract Price</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Exact unit price override</div>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'quantity_tier' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="quantity_tier" checked={formData.preset === 'quantity_tier'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Quantity Tiers</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Volume-based discounts</div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'promo_percent' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="promo_percent" checked={formData.preset === 'promo_percent'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Percentage Off</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Extra discount %</div>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'promo_amount' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="promo_amount" checked={formData.preset === 'promo_amount'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Amount Off</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Fixed $ discount per item</div>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${formData.preset === 'spend_threshold' ? 'border-[#d1a054] bg-[#d1a054]/10 ring-1 ring-[#d1a054]' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'}`}>
                      <input type="radio" name="preset" value="spend_threshold" checked={formData.preset === 'spend_threshold'} onChange={handleChange} className="sr-only" />
                      <div className="font-semibold text-[#312f2c] text-sm">Spend Threshold</div>
                      <div className="text-xs text-[#312f2c]/50 mt-1">Unlock with cart total</div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 bg-[#312f2c]/5 p-4 rounded-lg border border-[#312f2c]/5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Rule Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="e.g. 10% Off Base Products" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Trigger</label>
                <select name="trigger_type" value={formData.trigger_type} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                  <option value="automatic">Automatic (applied seamlessly)</option>
                  <option value="coupon">Coupon (requires cart code)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Discount Configuration */}
            <div>
              <h4 className="font-semibold text-[#312f2c] mb-4 border-b pb-2">Discount Value</h4>
              
              {formData.preset === 'quantity_tier' ? (
                <div className="space-y-3">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex items-end gap-3 bg-[#312f2c]/5 p-3 rounded-lg border border-[#312f2c]/10">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#312f2c]/60 mb-1">Min Qty</label>
                        <input type="number" min="1" value={tier.min_quantity} onChange={e => handleTierChange(index, 'min_quantity', e.target.value)} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#312f2c]/60 mb-1">Max Qty</label>
                        <input type="number" min="1" value={tier.max_quantity} onChange={e => handleTierChange(index, 'max_quantity', e.target.value)} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 text-sm" placeholder="Infinity" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#312f2c]/60 mb-1">% Off</label>
                        <input type="number" step="0.01" value={tier.percent_value} onChange={e => handleTierChange(index, 'percent_value', e.target.value)} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <button type="button" onClick={() => removeTier(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addTier} className="text-sm text-[#d1a054] font-medium hover:text-[#312f2c] flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Tier
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">
                      {formData.preset.includes('percent') || formData.preset === 'spend_threshold' ? 'Percentage Off (%)' : 'Amount ($)'}
                    </label>
                    <input required type="number" step="0.01" min="0.01" name="discount_value" value={formData.discount_value} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" />
                  </div>
                  {(formData.preset.includes('percent') || formData.preset === 'spend_threshold') && (
                    <div>
                      <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Max Discount Cap ($)</label>
                      <input type="number" step="0.01" min="0" name="max_discount_amount" value={formData.max_discount_amount} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="No limit" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Targeting */}
            <div>
              <h4 className="font-semibold text-[#312f2c] mb-4 border-b pb-2">Targeting & Conditions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Apply To</label>
                  <select name="target_type" value={formData.target_type} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                    <option value="all">Entire Catalog</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                    <option value="variation">Specific Variation</option>
                    <option value="tag">Specific Tag</option>
                    <option value="brand">Specific Brand</option>
                    <option value="attribute_value">Attribute Value</option>
                    {ruleType === 'group_pricing' && <option value="measurement">Custom Measurement</option>}
                  </select>
                </div>

                {formData.target_type !== 'all' && formData.target_type !== 'measurement' && formData.target_type !== 'attribute_value' && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[#312f2c]/80 mb-1 capitalize">Select {formData.target_type}</label>
                      <DynamicTargetSelect
                        type={formData.target_type}
                        value={formData.target_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, target_id: val }))}
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-2 ml-2">
                      <input type="checkbox" id="is_exclusion" name="is_exclusion" checked={formData.is_exclusion} onChange={handleChange} className="rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054]/40 w-4 h-4" />
                      <label htmlFor="is_exclusion" className="text-sm text-[#312f2c]/80">Exclude</label>
                    </div>
                  </div>
                )}

                {formData.target_type === 'attribute_value' && (
                  <div className="flex gap-2 items-end col-span-2">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Attribute</label>
                        <select 
                          className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2"
                          onChange={(e) => {
                            // Find the attribute to set the default target_id to its first value to prevent invalid states
                            const attr = attributes.find(a => String(a.id) === e.target.value);
                            if (attr && attr.attribute_values && attr.attribute_values.length > 0) {
                                setFormData(prev => ({...prev, target_id: String(attr.attribute_values[0].id)}));
                            } else {
                                setFormData(prev => ({...prev, target_id: ''}));
                            }
                          }}
                          value={
                            attributes.find(a => 
                              a.attribute_values?.some((v: any) => String(v.id) === String(formData.target_id))
                            )?.id || ""
                          }
                        >
                          <option value="" disabled>Select Attribute...</option>
                          {attributes.map(attr => (
                            <option key={attr.id} value={attr.id}>{attr.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Value</label>
                        <select 
                          required
                          name="target_id"
                          value={formData.target_id}
                          onChange={handleChange}
                          className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2"
                        >
                          <option value="" disabled>Select Value...</option>
                          {(() => {
                            const selectedAttr = attributes.find(a => 
                              a.attribute_values?.some((v: any) => String(v.id) === String(formData.target_id))
                            );
                            if (!selectedAttr) return null;
                            return selectedAttr.attribute_values.map((v: any) => (
                              <option key={v.id} value={v.id}>{v.value}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2 ml-4">
                      <input type="checkbox" id="is_exclusion_attr" name="is_exclusion" checked={formData.is_exclusion} onChange={handleChange} className="rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054]/40 w-4 h-4" />
                      <label htmlFor="is_exclusion_attr" className="text-sm text-[#312f2c]/80">Exclude</label>
                    </div>
                  </div>
                )}

                {formData.target_type === 'measurement' && (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-700 font-semibold mb-3 uppercase tracking-wide">Custom Measurement Settings</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Dimension Type</label>
                        <select name="meas_type" value={formData.meas_type} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2 bg-white">
                          <option value="inch">By the Inch (Wire / Linear)</option>
                          <option value="plate">By Area (Height × Width — Plates)</option>
                        </select>
                        <p className="text-xs text-[#312f2c]/40 mt-1">
                          {formData.meas_type === 'inch'
                            ? 'Price × Qty × Length (inches). e.g. channel wire, round wire.'
                            : 'Price × Qty × Height × Width (inches). e.g. sheet metal plates.'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">
                          Min {formData.meas_type === 'inch' ? 'Length (in)' : 'Area (in²)'} <span className="text-[#312f2c]/40">(optional)</span>
                        </label>
                        <input
                          type="number" min="0" step="0.01"
                          name="meas_min" value={formData.meas_min}
                          onChange={handleChange}
                          placeholder={formData.meas_type === 'inch' ? 'e.g. 6' : 'e.g. 10'}
                          className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">
                          Max {formData.meas_type === 'inch' ? 'Length (in)' : 'Area (in²)'} <span className="text-[#312f2c]/40">(optional)</span>
                        </label>
                        <input
                          type="number" min="0" step="0.01"
                          name="meas_max" value={formData.meas_max}
                          onChange={handleChange}
                          placeholder={formData.meas_type === 'inch' ? 'e.g. 36' : 'e.g. 100'}
                          className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-3">
                      💡 Leave min/max blank to apply to <strong>all</strong> lengths. Set a range to apply only within that bracket (e.g. 0–12 in for small orders).
                    </p>
                  </div>
                )}

                {/* Additional Conditions */}
                {formData.preset === 'spend_threshold' && (
                  <div>
                    <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Min Cart Subtotal ($)</label>
                    <input required type="number" min="0" step="0.01" name="requires_min_cart_subtotal" value={formData.requires_min_cart_subtotal} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="e.g. 500" />
                  </div>
                )}

                {formData.preset !== 'quantity_tier' && (
                  <div>
                    <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Min Line Quantity</label>
                    <input type="number" min="1" name="requires_min_cart_qty" value={formData.requires_min_cart_qty} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="e.g. 5" />
                  </div>
                )}

                <div>
                   <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Account Eligibility</label>
                   <select name="condition_type" value={formData.condition_type} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                     <option value="none">All Members</option>
                     <option value="first_purchase">First Purchase Only</option>
                     <option value="repeat_customer">Repeat Customers Only</option>
                     <option value="ltv_min">Minimum Lifetime Spend</option>
                   </select>
                </div>
                
                {formData.condition_type === 'ltv_min' && (
                  <div>
                    <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Min Spend ($)</label>
                    <input required type="number" min="0" name="condition_value" value={formData.condition_value} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="e.g. 10000" />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced & Campaign */}
            <div>
              <h4 className="font-semibold text-[#312f2c] mb-4 border-b pb-2">Availability & Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Starts At</label>
                  <input type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Ends At</label>
                  <input type="datetime-local" name="ends_at" value={formData.ends_at} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" />
                </div>
                
                {ruleType === 'promotion' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Priority (1-100)</label>
                      <input type="number" min="1" max="100" name="priority" value={formData.priority} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Stacking Mode</label>
                      <select name="stacking_mode" value={formData.stacking_mode} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                        <option value="stackable">Stackable</option>
                        <option value="best_of_group">Best of Group</option>
                        <option value="exclusive">Exclusive (stops evaluation)</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Max Total Uses</label>
                  <input type="number" min="1" name="max_total_uses" value={formData.max_total_uses} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Max Uses Per User</label>
                  <input type="number" min="1" name="max_uses_per_user" value={formData.max_uses_per_user} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2" placeholder="Unlimited" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#312f2c]/80 mb-1">Attach to Campaign (Optional)</label>
                  <select name="campaign_id" value={formData.campaign_id} onChange={handleChange} className="w-full border border-[#312f2c]/20 rounded-lg px-3 py-2">
                    <option value="">-- None --</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </form>
        </div>

        <div className="border-t border-[#312f2c]/10 px-6 py-4 flex justify-end gap-3 bg-[#312f2c]/5 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[#312f2c]/60 hover:bg-[#312f2c]/15 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" form="ruleForm" disabled={saving} className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
