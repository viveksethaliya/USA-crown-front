import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Plus, Search, Tag } from 'lucide-react';
import { apiUrl } from '@/lib/cart';

interface DiscountRule {
  id: number;
  scope: 'global' | 'category' | 'product';
  category_id: number | null;
  product_id: number | null;
  min_qty: number;
  discount_pct: number;
  categories?: { id: number; name: string };
  products?: { id: number; name: string; sku: string };
}

export default function DiscountRulesPanel({ groupId, token }: { groupId: string; token: string }) {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    scope: 'global',
    category_id: '',
    min_qty: '1',
    discount_pct: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string; sku: string }[]>([]);

  // Pickers for categories and products
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; sku: string }[]>([]);
  const [searchProduct, setSearchProduct] = useState('');

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

  const getCategoryDepth = useCallback((categoryId: number) => {
    let depth = 0;
    let current = categories.find(c => c.id === categoryId);
    while (current && current.parent_id) {
      depth++;
      current = categories.find(c => c.id === current.parent_id);
    }
    return depth;
  }, [categories]);

  const hierarchicalCategories = useCallback((cats: any[], parentId: any = null, depth: number = 0): any[] => {
    let result: any[] = [];
    const children = cats.filter(c => c.parent_id === parentId);
    for (const child of children) {
      result.push({ ...child, depth });
      result = result.concat(hierarchicalCategories(cats, child.id, depth + 1));
    }
    return result;
  }, []);

  const displayCategories = hierarchicalCategories(categories);

  useEffect(() => {
    if (form.scope === 'product') {
      const delay = setTimeout(() => {
        fetch(apiUrl(`/api/admin/products?search=${encodeURIComponent(searchProduct)}&limit=20`), { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => setProducts(data.data || []))
          .catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [form.scope, searchProduct, token]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.scope === 'product' && selectedProducts.length === 0) {
      alert("Please select at least one product.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/groups/${groupId}/discount-rules`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          scope: form.scope,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          product_ids: selectedProducts.map(p => p.id),
          min_qty: parseInt(form.min_qty),
          discount_pct: parseFloat(form.discount_pct)
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setForm({ scope: 'global', category_id: '', min_qty: '1', discount_pct: '' });
      setSelectedProducts([]);
      setSearchProduct('');
      fetchRules();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdding(false);
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

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#d1a054]" /></div>;
  }

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'global': return 'bg-[#312f2c]/10 text-[#312f2c] border-[#312f2c]/20';
      case 'category': return 'bg-[#d1a054]/15 text-[#d1a054] border-[#d1a054]/25';
      case 'product': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-white p-5 rounded-xl border border-[#312f2c]/10 shadow-sm">
        <h3 className="text-lg font-bold text-[#312f2c] mb-1">Add Advanced Rule</h3>
        <p className="text-sm text-[#312f2c]/60 mb-4">Define minimum quantity thresholds for specific products or categories. Most specific rules take priority.</p>
        
        <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-3">
            <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Scope</label>
            <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} 
              className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
              <option value="global">Global (All Products)</option>
              <option value="category">Specific Category</option>
              <option value="product">Specific Product(s)</option>
            </select>
          </div>

          <div className="col-span-12 md:col-span-5">
            {form.scope === 'global' && (
              <div className="h-[38px] flex items-center text-sm text-[#312f2c]/50 bg-gray-50 rounded-lg px-3 border border-transparent">
                Applies to all products
              </div>
            )}
            
            {form.scope === 'category' && (
              <div>
                <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Category</label>
                <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] bg-white text-sm">
                  <option value="">Select a category...</option>
                  {displayCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {'\u00A0\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '↳ ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.scope === 'product' && (
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
                    {products.length === 0 ? <div className="p-3 text-sm text-[#312f2c]/50">No products found</div> : products.map(p => {
                      const isSelected = selectedProducts.some(sp => sp.id === p.id);
                      return (
                        <div key={p.id} onClick={() => {
                          if (!isSelected) {
                            setSelectedProducts(prev => [...prev, p]);
                            setSearchProduct('');
                          }
                        }} className={`p-2.5 text-sm border-b border-[#312f2c]/5 flex justify-between items-center ${isSelected ? 'opacity-50 cursor-default bg-gray-50' : 'cursor-pointer hover:bg-[#312f2c]/5'}`}>
                          <span>{p.name} <span className="text-xs text-[#312f2c]/50">({p.sku})</span></span>
                          {isSelected && <span className="text-xs font-bold text-emerald-600">Added</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="col-span-6 md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Min Qty</label>
            <input required type="number" min="1" value={form.min_qty} onChange={e => setForm({ ...form, min_qty: e.target.value })} 
              className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" />
          </div>

          <div className="col-span-6 md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-[#312f2c]/70 mb-1.5">Discount %</label>
            <input required type="number" min="0.1" max="100" step="0.1" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: e.target.value })} 
              className="w-full px-3 py-2 rounded-lg border border-[#312f2c]/20 focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] text-sm" />
          </div>

          <div className="col-span-12 mt-2">
            <button type="submit" disabled={adding || (form.scope === 'category' && !form.category_id) || (form.scope === 'product' && selectedProducts.length === 0)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#312f2c] text-[#f0ede5] hover:bg-[#312f2c]/90 rounded-lg font-medium transition-colors disabled:opacity-70 text-sm">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Rule
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-[#312f2c]/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-[#312f2c]/60">
          <thead className="bg-[#312f2c]/5 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/10">
            <tr>
              <th className="px-6 py-4 font-medium">Scope</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium">Min Quantity</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#312f2c]/8">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#312f2c]/40">
                  <Tag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No advanced rules defined</p>
                </td>
              </tr>
            ) : rules.map(rule => (
              <tr key={rule.id} className="hover:bg-[#312f2c]/4 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border capitalize tracking-wider ${getScopeBadge(rule.scope)}`}>
                    {rule.scope}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-[#312f2c]">
                  {rule.scope === 'global' && 'All Products'}
                  {rule.scope === 'category' && (
                    <div className="flex items-center gap-2">
                      <span>{rule.categories?.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-[#312f2c]/10 text-[#312f2c]/50 bg-[#312f2c]/5 tracking-wider">
                        {rule.category_id && getCategoryDepth(rule.category_id) > 0 ? 'Subcategory' : 'Top Level'}
                      </span>
                    </div>
                  )}
                  {rule.scope === 'product' && (
                    <span>{rule.products?.name} <span className="text-xs font-normal text-[#312f2c]/50">({rule.products?.sku})</span></span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-[#312f2c]">{rule.min_qty}</span> units
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-[#059669]">{rule.discount_pct}%</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(rule.id)} disabled={deletingId === rule.id}
                    className="p-1.5 text-[#312f2c]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    {deletingId === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
