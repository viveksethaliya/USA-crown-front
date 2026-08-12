'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Save, X, HelpCircle } from 'lucide-react';
import HelpDrawer from './HelpDrawer';

export default function GroupAccess({ group }: { group: any }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [restrictedProducts, setRestrictedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVisibility();
  }, [group.id]);

  const fetchVisibility = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/visibility`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestrictedProducts(data.restricted_products || []);
      }
    } catch (err) {
      toast.error('Failed to load restricted products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Admin product search
      const res = await adminFetch(`/api/admin/products?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data || []);
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addProduct = (product: any) => {
    if (restrictedProducts.some(p => p.id === product.id)) {
      toast.error('Product already in access list');
      return;
    }
    setRestrictedProducts(prev => [...prev, { id: product.id, name: product.name, sku: product.sku }]);
  };

  const removeProduct = (productId: number) => {
    setRestrictedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const saveVisibility = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const productIds = restrictedProducts.map(p => p.id);
      
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/visibility`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ product_ids: productIds })
      });
      
      if (!res.ok) throw new Error('Failed to update visibility');
      
      toast.success('Product access updated successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-8 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-[#312f2c]">Product Access Control</h3>
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-1.5 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#312f2c]/50 text-sm mt-1 max-w-2xl">
            Control which products are visible to this group. 
            <strong> Note: This does not affect pricing or discounts.</strong> If the list is empty, 
            members can view all default public products. If products are added here, members will 
            ONLY see these specific products when logged in.
          </p>
        </div>
        <button 
          onClick={saveVisibility}
          disabled={saving}
          className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Access List'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-[400px]">
        {/* Left Side: Search & Add */}
        <div className="border border-[#312f2c]/10 rounded-lg p-4 bg-[#312f2c]/5 flex flex-col">
          <h4 className="font-semibold text-[#312f2c]/80 mb-3">Find Products</h4>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-[#312f2c]/40 w-4 h-4" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full pl-9 pr-3 py-2 border border-[#312f2c]/20 rounded-lg focus:ring-2 focus:ring-[#d1a054]/40 text-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={searching || !searchQuery.trim()}
              className="bg-[#312f2c]/15 hover:bg-[#312f2c]/20 text-[#312f2c]/80 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              Search
            </button>
          </form>

          <div className="flex-1 overflow-y-auto bg-white border border-[#312f2c]/10 rounded-lg">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-[#312f2c]/50 text-sm">
                Search for products to add them to the access list.
              </div>
            ) : (
              <ul className="divide-y divide-[#312f2c]/5">
                {searchResults.map(product => (
                  <li key={product.id} className="p-3 flex justify-between items-center hover:bg-[#312f2c]/5">
                    <div>
                      <div className="font-medium text-[#312f2c] text-sm">{product.name}</div>
                      <div className="text-xs text-[#312f2c]/50">SKU: {product.sku || 'N/A'}</div>
                    </div>
                    <button
                      onClick={() => addProduct(product)}
                      className="text-[#d1a054] hover:text-[#312f2c] text-sm font-medium px-2 py-1 rounded hover:bg-[#d1a054]/10 transition-colors"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Side: Restricted List */}
        <div className="border border-[#312f2c]/10 rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-[#312f2c]/80">Access List ({restrictedProducts.length})</h4>
            {restrictedProducts.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Clear all access rules? This will restore default visibility.')) {
                    setRestrictedProducts([]);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto border border-[#312f2c]/5 rounded-lg bg-[#312f2c]/5">
            {loading ? (
              <div className="p-4 text-center text-[#312f2c]/50 text-sm">Loading...</div>
            ) : restrictedProducts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="text-[#312f2c]/40 mb-2 font-medium">No Restrictions</div>
                <div className="text-[#312f2c]/50 text-sm max-w-xs">
                  This group can currently view all public catalog items.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[#312f2c]/10 bg-white border-y border-[#312f2c]/10">
                {restrictedProducts.map(product => (
                  <li key={product.id} className="p-3 flex justify-between items-center group hover:bg-[#312f2c]/5">
                    <div>
                      <div className="font-medium text-[#312f2c] text-sm">{product.name}</div>
                      <div className="text-xs text-[#312f2c]/50">SKU: {product.sku || 'N/A'}</div>
                    </div>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-[#312f2c]/40 hover:text-red-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Product Access Tab Help">
        <p>The <strong>Product Access Control</strong> tab allows you to restrict the catalog visibility for customers in this Pricing Group.</p>
        
        <h3>How It Works</h3>
        <ul>
          <li><strong>Default Visibility:</strong> By default, if the Access List is empty, customers in this group will see all standard public products on the storefront.</li>
          <li><strong>Restricted Visibility:</strong> The moment you add even one product to the Access List, the system switches to an <em>&quot;Allowlist&quot;</em> mode for this group. Customers will ONLY see the products explicitly listed here. Every other product in the catalog becomes hidden from them.</li>
          <li><strong>Use Case:</strong> This is highly useful for B2B portal implementations where a specific distributor or vendor is only permitted to buy a specific subset of customized products.</li>
          <li><strong>Note on Pricing:</strong> This tab ONLY controls visibility. It does not apply discounts. To apply discounts to these specific products, you must create rules in the <em>Discount Rules</em> tab.</li>
        </ul>
      </HelpDrawer>
    </div>
  );
}
