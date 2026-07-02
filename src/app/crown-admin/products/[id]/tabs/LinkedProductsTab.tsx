'use client';

import { useState } from 'react';
import { Search, Loader2, Link as LinkIcon, Trash2, Package } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

export default function LinkedProductsTab({ productId, productRelations, setProductRelations }: { productId: string, productRelations: any[], setProductRelations: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [relationType, setRelationType] = useState('upsell'); // 'upsell' or 'cross_sell'
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API}/products?search=${encodeURIComponent(search)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Don't include the current product in search results
        setSearchResults(data.data.filter((p: any) => p.id !== parseInt(productId)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
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
          // Prevent duplicates
          if (prev.some(r => r.related_product_id === relatedId && r.relation_type === relationType)) return prev;
          return [...prev, newRel];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinking(null);
    }
  };

  const handleRemoveLink = async (relatedId: string, type: string) => {
    if (!confirm('Remove this product link?')) return;
    try {
      await fetch(`${API}/products/${productId}/relations/${relatedId}/${type}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setProductRelations(prev => prev.filter(r => !(r.related_product_id === relatedId && r.relation_type === type)));
    } catch (e) {
      console.error(e);
    }
  };

  const upsells = productRelations.filter(r => r.relation_type === 'upsell');
  const crossSells = productRelations.filter(r => r.relation_type === 'cross_sell');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Current Links */}
        <div className="space-y-6">
          {/* Upsells */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Upsells</h3>
            <p className="text-xs text-gray-500 mb-4">Products you recommend instead of the currently viewed product (e.g. higher quality or more expensive).</p>
            
            {upsells.length === 0 ? (
              <p className="text-sm text-gray-600 italic py-2">No upsells linked.</p>
            ) : (
              <div className="space-y-2">
                {upsells.map(r => (
                  <div key={`${r.related_product_id}-upsell`} className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{r.products?.name || `Product ID: ${r.related_product_id}`}</p>
                      {r.products?.sku && <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {r.products.sku}</p>}
                    </div>
                    <button 
                      onClick={() => handleRemoveLink(r.related_product_id, 'upsell')}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-sells */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Cross-sells</h3>
            <p className="text-xs text-gray-500 mb-4">Products you promote in the cart, based on the current product (e.g. matching earrings for a necklace).</p>
            
            {crossSells.length === 0 ? (
              <p className="text-sm text-gray-600 italic py-2">No cross-sells linked.</p>
            ) : (
              <div className="space-y-2">
                {crossSells.map(r => (
                  <div key={`${r.related_product_id}-cross_sell`} className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{r.products?.name || `Product ID: ${r.related_product_id}`}</p>
                      {r.products?.sku && <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {r.products.sku}</p>}
                    </div>
                    <button 
                      onClick={() => handleRemoveLink(r.related_product_id, 'cross_sell')}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & Add */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit sticky top-6">
          <h3 className="text-sm font-semibold text-white mb-4">Link a Product</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Relation Type</label>
              <select 
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="upsell">Upsell</option>
                <option value="cross_sell">Cross-sell</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Search Products</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name or SKU..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !search.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Results</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {searchResults.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0 text-gray-600">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.sku || 'No SKU'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkProduct(p.id)}
                        disabled={isLinking === p.id}
                        className="ml-3 p-2 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-400 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title={`Add as ${relationType}`}
                      >
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
