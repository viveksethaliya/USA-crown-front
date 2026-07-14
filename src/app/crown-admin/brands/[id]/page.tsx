'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, Search, Plus, Trash2, FolderPlus, FolderMinus } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

export default function CollectionProductsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const buildHierarchyName = (cat: any, allCats: any[]) => {
    let name = cat.name;
    let current = cat;
    while (current.parent_id) {
      const parent = allCats.find((c: any) => c.id === current.parent_id);
      if (parent) {
        name = `${parent.name} > ${name}`;
        current = parent;
      } else {
        break;
      }
    }
    return name;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch assigned products
      const prodRes = await fetch(`${API}/brands/${id}/products`, { headers });
      if (prodRes.ok) setProducts(await prodRes.json());

      // Fetch categories for the bulk assign dropdown
      const catRes = await fetch(`${API}/categories`, { headers });
      if (catRes.ok) {
        const rawCats = await catRes.json();
        const formattedCats = rawCats.map((c: any) => ({
          ...c,
          hierarchyName: buildHierarchyName(c, rawCats)
        })).sort((a: any, b: any) => a.hierarchyName.localeCompare(b.hierarchyName));
        setCategories(formattedCats);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search individual products
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API}/products?search=${encodeURIComponent(searchQuery)}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAssignIndividual = async (productId: string, productName: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/brands/${id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      
      if (res.ok) {
        toast.success(`Assigned ${productName}`);
        setSearchQuery('');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to assign product');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveIndividual = async (productId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from this collection?`)) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/brands/${id}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success(`Removed ${productName}`);
        fetchData();
      } else {
        toast.error('Failed to remove product');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Remove ${selectedProducts.length} selected products from this collection?`)) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/brands/${id}/products/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productIds: selectedProducts })
      });
      
      if (res.ok) {
        toast.success(`Removed ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchData();
      } else {
        toast.error('Failed to remove products');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategoryAssign = async (action: 'add' | 'remove') => {
    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }

    if (action === 'remove' && !confirm('Are you sure you want to remove all products from this category?')) return;
    if (action === 'add' && !confirm('Assign all products in this category to the collection?')) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = action === 'add' ? `${API}/brands/${id}/category` : `${API}/brands/${id}/category/${selectedCategory}`;
      const method = action === 'add' ? 'POST' : 'DELETE';
      const body = action === 'add' ? JSON.stringify({ categoryId: selectedCategory }) : undefined;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body
      });
      
      if (res.ok) {
        const json = await res.json();
        toast.success(json.message);
        fetchData();
      } else {
        toast.error(`Failed to ${action} category products`);
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
        <p className="text-[#312f2c]/50">Loading collection data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/crown-admin/brands"
            className="p-2 bg-white hover:bg-[#312f2c]/5 rounded-lg border border-[#312f2c]/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#312f2c]/60" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-[#312f2c]">Manage Collection Products</h2>
            <p className="text-[#312f2c]/55 text-sm mt-1">Assign or remove products for this collection</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Assignment Controls */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Individual Search & Assign */}
          <div className="bg-white border border-[#312f2c]/10 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#312f2c] uppercase tracking-wide mb-4">Assign Individual Product</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#312f2c]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-[#f8f7f5] border border-[#312f2c]/10 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#d1a054]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#312f2c]/30 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-2 border border-[#312f2c]/10 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto bg-white shadow-lg relative z-10">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-sm text-[#312f2c]/50">No products found</div>
                ) : (
                  <div className="divide-y divide-[#312f2c]/5">
                    {searchResults.map(product => {
                      const isAssigned = products.some(p => p.id === product.id);
                      return (
                        <div key={product.id} className="p-3 flex items-center justify-between hover:bg-[#f8f7f5] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-[#312f2c]">{product.name}</p>
                            <p className="text-xs text-[#312f2c]/50 font-mono mt-0.5">{product.sku}</p>
                          </div>
                          <button
                            onClick={() => handleAssignIndividual(product.id, product.name)}
                            disabled={isAssigned || isProcessing}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAssigned 
                                ? 'bg-[#312f2c]/5 text-[#312f2c]/30 cursor-not-allowed'
                                : 'bg-[#d1a054]/10 text-[#d1a054] hover:bg-[#d1a054]/20'
                            }`}
                            title={isAssigned ? "Already assigned" : "Add to collection"}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Category Assign */}
          <div className="bg-white border border-[#312f2c]/10 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#312f2c] uppercase tracking-wide mb-4">Bulk Category Action</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#f8f7f5] border border-[#312f2c]/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#d1a054] mb-4"
            >
              <option value="">-- Select a Category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.hierarchyName}</option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCategoryAssign('add')}
                disabled={!selectedCategory || isProcessing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#d1a054]/10 text-[#d1a054] hover:bg-[#d1a054]/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <FolderPlus className="w-4 h-4" />
                Add All
              </button>
              <button
                onClick={() => handleCategoryAssign('remove')}
                disabled={!selectedCategory || isProcessing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <FolderMinus className="w-4 h-4" />
                Remove All
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Assigned Products Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-[#312f2c]/10 bg-[#f8f7f5] flex justify-between items-center">
              <h3 className="font-medium text-[#312f2c]">Assigned Products</h3>
              <div className="flex items-center gap-4">
                {selectedProducts.length > 0 && (
                  <button
                    onClick={handleBulkRemove}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Selected ({selectedProducts.length})
                  </button>
                )}
                <span className="px-2.5 py-1 bg-[#312f2c]/5 text-[#312f2c]/60 rounded-lg text-xs font-semibold">
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-[#312f2c]/40 text-center">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p>No products assigned to this collection yet.</p>
                  <p className="text-sm mt-1">Use the panel on the left to add products.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white sticky top-0 border-b border-[#312f2c]/10 z-10">
                    <tr className="text-xs uppercase tracking-wider text-[#312f2c]/40">
                      <th className="p-4 w-12">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedProducts.length === products.length}
                          onChange={(e) => setSelectedProducts(e.target.checked ? products.map(p => p.id) : [])}
                          className="rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054]"
                        />
                      </th>
                      <th className="p-4 font-medium">Product</th>
                      <th className="p-4 font-medium hidden sm:table-cell">SKU</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#312f2c]/5">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-[#f8f7f5] transition-colors group">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedProducts(prev => [...prev, product.id]);
                              else setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }}
                            className="rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054]"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.image_url?.[0]?.url ? (
                              <img src={product.image_url[0].url} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-[#312f2c]/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#312f2c]/5 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-[#312f2c]/20" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-[#312f2c]">{product.name}</p>
                              <p className="text-xs text-[#312f2c]/50 sm:hidden font-mono mt-0.5">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-[#312f2c]/50 font-mono text-sm">
                          {product.sku || '-'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRemoveIndividual(product.id, product.name)}
                            disabled={isProcessing}
                            className="p-2 text-[#312f2c]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove from collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
