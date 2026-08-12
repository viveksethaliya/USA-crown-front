'use client';
import React, { useState } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Play, ShoppingCart, Tag, CheckCircle2, ChevronRight, Calculator, HelpCircle } from 'lucide-react';
import HelpDrawer from './HelpDrawer';

export default function GroupPreview({ group }: { group: any }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [itemsStr, setItemsStr] = useState('[{"productId": 101, "quantity": 1, "basePrice": 100, "categoryIds": ["1"]}]');
  const [couponsStr, setCouponsStr] = useState('[]');
  const [userCtxStr, setUserCtxStr] = useState('{"orderCount": 0, "ltv": 0}');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    try {
      setLoading(true);
      const items = JSON.parse(itemsStr);
      const coupons = JSON.parse(couponsStr);
      const userContext = JSON.parse(userCtxStr);

      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/preview`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, coupons, userContext })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      
      setResult(data.trace);
      toast.success('Calculation complete');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#312f2c]">Calculation Preview</h2>
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-1.5 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#312f2c]/50 text-sm mt-1">
            Simulate the exact pricing resolution engine against a mock cart.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-[#312f2c] mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Mock Cart Items (JSON)
            </h3>
            <textarea 
              value={itemsStr}
              onChange={e => setItemsStr(e.target.value)}
              className="w-full h-32 border border-[#312f2c]/20 rounded-lg p-3 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-[#312f2c] mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Coupons (JSON array)
              </h3>
              <textarea 
                value={couponsStr}
                onChange={e => setCouponsStr(e.target.value)}
                className="w-full h-24 border border-[#312f2c]/20 rounded-lg p-3 font-mono text-xs"
              />
            </div>
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-[#312f2c] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> User Context (JSON)
              </h3>
              <textarea 
                value={userCtxStr}
                onChange={e => setUserCtxStr(e.target.value)}
                className="w-full h-24 border border-[#312f2c]/20 rounded-lg p-3 font-mono text-xs"
              />
            </div>
          </div>

          <button 
            onClick={handlePreview}
            disabled={loading}
            className="w-full bg-[#312f2c] hover:bg-[#312f2c]/85 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Evaluating...' : 'Run Live Evaluator'}
          </button>
        </div>

        <div className="bg-[#312f2c] rounded-xl p-5 text-emerald-500 font-mono text-sm overflow-y-auto max-h-[600px] shadow-inner">
          <div className="flex items-center gap-2 text-[#f0ede5]/40 mb-4 pb-2 border-b border-white/10">
            <Calculator className="w-4 h-4" />
            <span>Trace Output</span>
          </div>
          
          {!result ? (
            <div className="text-[#f0ede5]/60 italic">Waiting for execution...</div>
          ) : (
            <div className="space-y-4">
              <div className="text-[#f0ede5]/70">
                <div className="text-white font-bold">Group: {result.group_name}</div>
                <div>Total Discount: <span className="text-[#d1a054]">${result.total_discount}</span></div>
              </div>

              <div>
                <div className="text-white font-bold mb-2">Item Trace:</div>
                {result.items_evaluated.map((item: any, idx: number) => (
                  <div key={idx} className="ml-4 mb-3 border-l-2 border-white/10 pl-3">
                    <div className="text-[#f0ede5]/60">Product {item.productId} (Qty: {item.quantity})</div>
                    <div>Base Line Total: <span className="text-[#f0ede5]/50">${item.initialLineTotal}</span></div>
                    
                    {item.groupRuleApplied ? (
                      <div className="text-emerald-400 flex items-center gap-1 mt-1">
                        <ChevronRight className="w-3 h-3" /> Group Rule: {item.groupRuleApplied.name}
                      </div>
                    ) : (
                      <div className="text-[#f0ede5]/40 italic mt-1">No specific group rule applied (fallback to default)</div>
                    )}

                    {item.appliedPromotions?.length > 0 && (
                      <div className="mt-1">
                        {item.appliedPromotions.map((p: any, i: number) => (
                          <div key={i} className="text-[#d1a054] flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> Promo: {p.name} (-${p.amount})
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-1 font-bold">
                      Final Total: <span className="text-emerald-500">${item.finalLineTotal}</span> 
                      <span className="text-[#f0ede5]/50 font-normal ml-2">(Saved ${item.discountAmount})</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {result.applied_discounts?.length > 0 && (
                <div>
                  <div className="text-white font-bold mb-2">Applied Discounts Rollup:</div>
                  {result.applied_discounts.map((d: any, idx: number) => (
                    <div key={idx} className="ml-4 text-[#f0ede5]/70 flex items-center gap-2">
                      <span className="text-[#f0ede5]/40">[{d.type}]</span> 
                      <span>{d.rule_name}</span>
                      {d.coupon_code && <span className="bg-white/10 text-xs px-2 py-0.5 rounded text-white/60">{d.coupon_code}</span>}
                      <span className="text-[#d1a054] ml-auto">-${d.discount_amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Preview Tab Help">
        <p>The <strong>Preview</strong> tab is a powerful simulator. It allows you to test exactly how the pricing engine will evaluate a shopping cart for a member of this Pricing Group without having to log in as a customer.</p>
        
        <h3>Inputs</h3>
        <ul>
          <li><strong>Mock Cart Items:</strong> Provide an array of items representing the cart. Each item needs a &quot;productId&quot;, &quot;quantity&quot;, &quot;basePrice&quot;, and optionally tags, categories, or attributes for targeting matching.</li>
          <li><strong>Coupons:</strong> Provide an array of string coupon codes to test if coupon-triggered rules activate successfully.</li>
          <li><strong>User Context:</strong> Pass in customer variables like &quot;orderCount&quot; or &quot;ltv&quot; (Lifetime Value) to test rules that depend on customer history (e.g., &quot;First Purchase&quot; conditions).</li>
        </ul>

        <h3>Understanding the Trace</h3>
        <p>When you click &quot;Run Live Evaluator&quot;, the system runs the exact same code the storefront uses. The right pane will output a line-by-line trace showing exactly which rules were considered, which were rejected, and the final calculated discounts.</p>
      </HelpDrawer>
    </div>
  );
}
