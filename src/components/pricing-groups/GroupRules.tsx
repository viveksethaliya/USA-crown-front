'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Copy, PauseCircle, Trash2, AlertCircle, PlayCircle, HelpCircle } from 'lucide-react';
import RuleEditor from './RuleEditor';
import HelpDrawer from './HelpDrawer';

export default function GroupRules({ group }: { group: any }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [group.id]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ruleId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const currentRule = rules.find(r => r.id === ruleId);
      if (!currentRule) return;

      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...currentRule, status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Rule marked as ${newStatus}`);
      fetchRules();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this rule? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete rule');
      
      toast.success('Rule deleted successfully');
      fetchRules();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isRuleEffective = (rule: any) => {
    if (rule.status !== 'active') return false;
    const now = new Date();
    if (rule.starts_at && new Date(rule.starts_at) > now) return false;
    if (rule.ends_at && new Date(rule.ends_at) < now) return false;
    return true;
  };

  const getRuleSummary = (rule: any) => {
    const action = rule.discount_actions?.[0];
    const target = rule.discount_targets?.[0];
    const cond = rule.discount_conditions?.[0];
    
    let summary = 'No discount defined';
    
    if (action) {
      const tiers = action.discount_tiers || action.tiers;
      if (tiers && Array.isArray(tiers) && tiers.length > 0) {
        const hasPercent = tiers.some((t: any) => t.percent_value > 0);
        const hasFixed = tiers.some((t: any) => t.fixed_value > 0);
        
        if (hasPercent && !hasFixed) {
          const vals = tiers.map((t: any) => t.percent_value || 0);
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          summary = min === max ? `Get ${min}% off, based on quantity` : `${min}–${max}% off, based on quantity`;
        } else if (hasFixed && !hasPercent) {
          const vals = tiers.map((t: any) => t.fixed_value || 0);
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          summary = min === max ? `Get $${min} off per item, based on quantity` : `$${min}–$${max} off per item, based on quantity`;
        } else {
          summary = `Tiered discount based on quantity`;
        }
      } else if (action.fixed_value != null && action.fixed_value > 0) {
        summary = `Get $${action.fixed_value} off`;
      } else {
        summary = `Get ${action.percent_value || 0}% off`;
      }
    }
    
    if (target) {
      if (target.target_name) {
        summary += ` on ${target.target_name}`;
      } else {
        summary += ` on ${target.target_type} #${target.target_id}`;
      }
    } else if (rule.source_kind === 'group_pricing' && rule.specificity_rank === 0) {
      summary += ` across the entire catalog`;
    }
    
    if (cond && cond.condition_type === 'quantity_min') {
      summary += ` (Min Qty: ${cond.value_number})`;
    } else if (rule.requires_min_cart_qty) {
      summary += ` (Min Cart Qty: ${rule.requires_min_cart_qty})`;
    } else if (rule.metadata?.legacy_measurement?.min) {
      summary += ` (Min Meas: ${rule.metadata.legacy_measurement.min})`;
    }
    
    if (rule.trigger_type === 'coupon') {
      summary += ` when using coupon`;
    }
    
    return summary;
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-8 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-[#312f2c]">Discount Rules</h3>
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-1.5 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#312f2c]/50 text-sm mt-1 max-w-2xl">
            Configure custom pricing, percentage discounts, volume tiers, and specific promotions for this group.
          </p>
        </div>
        <button 
          onClick={() => { setEditingRule(null); setIsEditorOpen(true); }}
          className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-[#312f2c]/50 py-12">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#312f2c]/10 rounded-lg bg-[#312f2c]/5 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-[#312f2c]/40 mb-3" />
            <h4 className="text-lg font-medium text-[#312f2c]">No Discount Rules</h4>
            <p className="text-[#312f2c]/50 mt-1 mb-4 text-sm max-w-sm">
              You haven't defined any discount rules for this group yet.
            </p>
            <button 
              onClick={() => { setEditingRule(null); setIsEditorOpen(true); }}
              className="text-[#d1a054] font-medium hover:text-[#312f2c]"
            >
              + Create your first rule
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rules.map(rule => {
              const isEffective = isRuleEffective(rule);
              
              return (
                <div key={rule.id} className={`border rounded-lg p-5 flex items-start justify-between ${isEffective ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#312f2c]/10 bg-white'}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-[#312f2c] text-lg">{rule.name}</h4>
                      {isEffective && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Effective Now
                        </span>
                      )}
                      {rule.status === 'paused' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          Paused
                        </span>
                      )}
                      {rule.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#312f2c]/10 text-[#312f2c]/60">
                          Archived
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[#312f2c]/80 font-medium text-sm mt-2 mb-1">
                      {getRuleSummary(rule)}
                    </div>
                    
                    <div className="text-xs text-[#312f2c]/50 flex items-center gap-3 mt-3">
                      <span>Trigger: <strong className="text-[#312f2c]/80">{rule.trigger_type}</strong></span>
                      {rule.campaign_id && (
                        <>
                          <span>•</span>
                          <span>Campaign: <strong className="text-[#d1a054]">{rule.promotion_campaigns?.name || `ID: ${rule.campaign_id}`}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingRule(rule); setIsEditorOpen(true); }}
                      className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {rule.status === 'active' ? (
                      <button 
                        onClick={() => handleUpdateStatus(rule.id, 'paused')}
                        className="p-2 text-[#312f2c]/50 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Pause"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(rule.id, 'active')}
                        className="p-2 text-[#312f2c]/50 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Activate"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-[#312f2c]/50 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isEditorOpen && (
        <RuleEditor 
          group={group}
          initialRule={editingRule}
          onClose={() => { setIsEditorOpen(false); setEditingRule(null); }}
          onSaved={() => {
            setIsEditorOpen(false);
            setEditingRule(null);
            fetchRules();
          }}
        />
      )}

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Discount Rules Help">
        <p>The <strong>Discount Rules</strong> tab is the core pricing engine for this group. It unifies what used to be Base Pricing and Promotions into one powerful system.</p>
        
        <h3>How Rules Are Evaluated</h3>
        <p>When a customer in this group adds an item to their cart, the system looks at all Active rules and finds the best eligible discount for each item.</p>

        <h3>Rule Components</h3>
        <ul>
          <li><strong>Actions:</strong> What happens when the rule matches? (e.g. 10% Off, Fixed Price of $50, $10 Off per Unit, Tiered Pricing based on Quantity).</li>
          <li><strong>Targets:</strong> What items does this apply to? You can target the entire catalog, or restrict it by adding <em>Inclusions</em> (e.g. Category = Widgets) and <em>Exclusions</em> (e.g. Product = Golden Widget).</li>
          <li><strong>Conditions:</strong> What must be true for the rule to trigger? (e.g. Minimum Line Quantity = 50, Minimum Cart Subtotal = $1000, New Customer only).</li>
        </ul>
      </HelpDrawer>
    </div>
  );
}
