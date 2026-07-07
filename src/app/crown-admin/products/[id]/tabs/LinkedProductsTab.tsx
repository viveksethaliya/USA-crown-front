'use client';

import { useState } from 'react';
import { Search, Loader2, Link as LinkIcon, Trash2, Package } from 'lucide-react';

import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

export default function LinkedProductsTab({ productId, productRelations, setProductRelations }: { productId: string, productRelations: any[], setProductRelations: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [relationType, setRelationType] = useState('upsell');
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API}/products?search=${encodeURIComponent(search)}&limit=10`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data.filter((p: any) => p.id !== parseInt(productId)));
      }
    } catch (e) { console.error(e); }
    finally { setIsSearching(false); }
  };

  const handleLinkProduct = async (relatedId: string) => {
    setIsLinking(relatedId);
    try {
      const res = await fetch(`${API}/products/${productId}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ related_product_id: relatedId, relation_type: relationType })
      });
      if (res.ok) {
        const newRel = await res.json();
        setProductRelations(prev => {
          if (prev.some(r => r.related_product_id === relatedId && r.relation_type === relationType)) return prev;
          return [...prev, newRel];
        });
        toast.success('Product linked successfully');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to link product');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    }
    finally { setIsLinking(null); }
  };

  const handleRemoveLink = async (relatedId: string, type: string) => {
    if (!confirm('Remove this product link?')) return;
    try {
      await fetch(`${API}/products/${productId}/relations/${relatedId}/${type}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      setProductRelations(prev => prev.filter(r => !(r.related_product_id === relatedId && r.relation_type === type)));
    } catch (e) { console.error(e); }
  };

  const upsells = productRelations.filter(r => r.relation_type === 'upsell');
  const crossSells = productRelations.filter(r => r.relation_type === 'cross_sell');
  const panelCls = "bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl p-5";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Current Links */}
        <div className="space-y-6">
          {/* Upsells */}
          <div className={panelCls}>
            <h3 className="text-sm font-semibold text-[#312f2c] mb-1">Upsells</h3>
            <p className="text-xs text-[#312f2c]/45 mb-4">Products you recommend instead of the currently viewed product (e.g. higher quality or more expensive).</p>
            {upsells.length === 0 ? (
              <p className="text-sm text-[#312f2c]/35 italic py-2">No upsells linked.</p>
            ) : (
              <div className="space-y-2">
                {upsells.map(r => (
                  <div key={`${r.related_product_id}-upsell`} className="flex items-center justify-between p-3 bg-white/60 border border-[#312f2c]/10 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#312f2c] truncate">{r.products?.name || `Product ID: ${r.related_product_id}`}</p>
                      {r.products?.sku && <p className="text-xs text-[#312f2c]/40 font-mono mt-0.5">SKU: {r.products.sku}</p>}
                    </div>
                    <button onClick={() => handleRemoveLink(r.related_product_id, 'upsell')}
                      className="p-1.5 text-[#312f2c]/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-sells */}
          <div className={panelCls}>
            <h3 className="text-sm font-semibold text-[#312f2c] mb-1">Cross-sells</h3>
            <p className="text-xs text-[#312f2c]/45 mb-4">Products you promote in the cart, based on the current product (e.g. matching earrings for a necklace).</p>
            {crossSells.length === 0 ? (
              <p className="text-sm text-[#312f2c]/35 italic py-2">No cross-sells linked.</p>
            ) : (
              <div className="space-y-2">
                {crossSells.map(r => (
                  <div key={`${r.related_product_id}-cross_sell`} className="flex items-center justify-between p-3 bg-white/60 border border-[#312f2c]/10 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#312f2c] truncate">{r.products?.name || `Product ID: ${r.related_product_id}`}</p>
                      {r.products?.sku && <p className="text-xs text-[#312f2c]/40 font-mono mt-0.5">SKU: {r.products.sku}</p>}
                    </div>
                    <button onClick={() => handleRemoveLink(r.related_product_id, 'cross_sell')}
                      className="p-1.5 text-[#312f2c]/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & Add */}
        <div className={`${panelCls} h-fit sticky top-6`}>
          <h3 className="text-sm font-semibold text-[#312f2c] mb-4">Link a Product</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#312f2c]/55 mb-1">Relation Type</label>
              <select value={relationType} onChange={(e) => setRelationType(e.target.value)}
                className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none">
                <option value="upsell">Upsell</option>
                <option value="cross_sell">Cross-sell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#312f2c]/55 mb-1">Search Products</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#312f2c]/35 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name or SKU..."
                    className="w-full bg-white border border-[#312f2c]/12 rounded-lg pl-9 pr-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none placeholder:text-[#312f2c]/35" />
                </div>
                <button onClick={handleSearch} disabled={isSearching || !search.trim()}
                  className="px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 border-t border-[#312f2c]/8 pt-4">
                <p className="text-xs font-medium text-[#312f2c]/40 mb-2 uppercase tracking-wider">Results</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {searchResults.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/60 border border-[#312f2c]/10 rounded-lg">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#312f2c]/6 border border-[#312f2c]/10 flex items-center justify-center flex-shrink-0 text-[#312f2c]/40">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#312f2c] truncate">{p.name}</p>
                          <p className="text-xs text-[#312f2c]/40 font-mono">{p.sku || 'No SKU'}</p>
                        </div>
                      </div>
                      <button onClick={() => handleLinkProduct(p.id)} disabled={isLinking === p.id}
                        className="ml-3 p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/15 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title={`Add as ${relationType}`}>
                        {isLinking === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
