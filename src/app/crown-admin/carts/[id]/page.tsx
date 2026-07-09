'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Search, Trash2, Plus, ShoppingCart, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { ADMIN_API as API } from '@/lib/config';

// Simple formatter since we don't have access to the storefront cart lib here
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function AdminCartDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addLength, setAddLength] = useState<number | ''>('');
  const [addWidth, setAddWidth] = useState<number | ''>('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setCart(data.cart);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [id]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setBusyItemId(itemId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity })
      });
      if (!res.ok) throw new Error('Failed to update quantity');
      await fetchCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!window.confirm('Remove item from cart?')) return;
    setBusyItemId(itemId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove item');
      toast.success('Item removed');
      await fetchCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/products?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.type === 'variable' && !selectedVariationId) {
      toast.error('Please select a variation');
      return;
    }
    await addDirectlyToCart(
      selectedProduct.id, 
      selectedVariationId, 
      addQuantity,
      addLength === '' ? undefined : addLength,
      addWidth === '' ? undefined : addWidth
    );
  };

  const addDirectlyToCart = async (
    productId: string, 
    variationId: number | null, 
    quantity: number,
    customLength?: number,
    customWidth?: number
  ) => {
    setIsAdding(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId,
          variationId,
          quantity,
          customLength,
          customWidth
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add item');
      }
      toast.success('Added to cart');
      setIsAddModalOpen(false);
      resetAddModal();
      await fetchCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleProductSelect = async (prod: any) => {
    if (prod.type !== 'variable') {
      // Standalone product: add directly
      await addDirectlyToCart(prod.id, null, 1);
      return;
    }

    // Variable product: fetch variations and ask
    try {
      setIsSearching(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/products/${prod.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch variations');
      const fullProduct = await res.json();
      
      setSelectedProduct(fullProduct);
      setSelectedVariationId(null);
      setAddQuantity(1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const resetAddModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProduct(null);
    setSelectedVariationId(null);
    setAddQuantity(1);
    setAddLength('');
    setAddWidth('');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm font-medium text-[#312f2c]/60 hover:text-[#312f2c] flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Carts
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#312f2c]/10 p-6">
        <div className="flex items-center justify-between mb-8 border-b border-[#312f2c]/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Manage Customer Cart</h1>
            <p className="text-sm text-[#312f2c]/60 mt-1">Add, update, or remove items for this customer.</p>
          </div>
          <Link 
            href={`/crown-admin/customers/${id}`}
            className="px-4 py-2 bg-[#f8f7f5] text-[#312f2c] font-medium text-sm rounded-lg hover:bg-[#ece9e1] transition-colors border border-[#312f2c]/10"
          >
            View Customer Profile
          </Link>
        </div>

        {/* Cart Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#312f2c]/10 pb-2">
            <h4 className="text-sm font-semibold text-[#d1a054] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Active Shopping Cart
            </h4>
            <button 
              type="button" 
              onClick={() => { resetAddModal(); setIsAddModalOpen(true); }}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-[#312f2c] text-[#f0ede5] rounded-md hover:bg-[#312f2c]/85 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#d1a054]" /></div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="bg-white/40 p-6 rounded-xl border border-[#312f2c]/10 text-center">
              <p className="text-[#312f2c]/40 text-sm">Cart is empty.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#312f2c]/10 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f8f7f5] text-[#312f2c]/60 uppercase tracking-wider text-[10px] font-bold border-b border-[#312f2c]/10">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-center">Unit Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#312f2c]/5">
                    {cart.items.map((item: any) => (
                      <tr key={item.id} className={busyItemId === item.id ? 'opacity-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#ece9e1] rounded-md overflow-hidden flex-shrink-0 border border-[#312f2c]/5">
                              {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />}
                            </div>
                            <div>
                              <p className="font-medium text-[#312f2c] text-sm">{item.productName}</p>
                              {item.variationLabel && <p className="text-xs text-[#312f2c]/55 mt-0.5">{item.variationLabel}</p>}
                              {(item.measurementType === 'inch' || item.measurementType === 'plate') && (
                                <p className="text-[10px] uppercase font-bold text-[#d1a054] mt-1 bg-[#d1a054]/10 px-1.5 py-0.5 rounded inline-block">
                                  {item.customLength || 1}&quot; {item.measurementType === 'plate' ? `× ${item.customWidth || 1}"` : 'Length'}
                                </p>
                              )}
                              {item.sku && <p className="text-[10px] font-mono text-[#312f2c]/40 mt-0.5">SKU: {item.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-[#312f2c]">{formatMoney(item.unitPrice)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || busyItemId === item.id} className="w-6 h-6 flex items-center justify-center rounded-full bg-[#ece9e1] text-[#312f2c]/60 hover:text-[#312f2c] disabled:opacity-50">-</button>
                            <span className="font-medium text-[#312f2c] w-6 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={busyItemId === item.id} className="w-6 h-6 flex items-center justify-center rounded-full bg-[#ece9e1] text-[#312f2c]/60 hover:text-[#312f2c] disabled:opacity-50">+</button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.discountAmount > 0 ? (
                            <div>
                              <p className="line-through text-xs text-[#312f2c]/40">{formatMoney(item.lineTotal)}</p>
                              <p className="font-medium text-[#312f2c]">{formatMoney(item.finalLineTotal)}</p>
                              <p className="text-[10px] font-semibold text-[#d1a054]">Saved {formatMoney(item.discountAmount)}</p>
                            </div>
                          ) : (
                            <p className="font-medium text-[#312f2c]">{formatMoney(item.lineTotal)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => removeItem(item.id)} disabled={busyItemId === item.id} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-[#f8f7f5] p-4 border-t border-[#312f2c]/10 flex justify-end">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#312f2c]/60">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span>{formatMoney(cart.subtotal)}</span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-[#d1a054]">
                      <span>Discount {cart.discountTierName ? `(${cart.discountTierName})` : ''}</span>
                      <span>-{formatMoney(cart.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[#312f2c] pt-2 border-t border-[#312f2c]/10 mt-2">
                    <span>Estimated Total</span>
                    <span>{formatMoney(cart.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#312f2c]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ede5] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#312f2c]/10">
            <div className="p-5 border-b border-[#312f2c]/10 flex items-center justify-between bg-white/50">
              <h3 className="font-semibold text-[#312f2c]">Add Product to Cart</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-[#312f2c]/40 hover:bg-[#312f2c]/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto bg-white/30">
              {!selectedProduct ? (
                <>
                  <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Search product by name or SKU..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054]"
                    />
                    <button type="submit" disabled={isSearching || !searchQuery.trim()} className="px-4 py-2 bg-[#d1a054] text-white rounded-lg flex items-center gap-2 hover:bg-[#c09044] disabled:opacity-50 text-sm font-medium">
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </form>

                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map(prod => (
                        <div key={prod.id} 
                             onClick={() => handleProductSelect(prod)}
                             className="p-3 bg-white border border-[#312f2c]/10 rounded-xl flex items-center gap-4 cursor-pointer hover:border-[#d1a054]/40 transition-colors">
                          <div className="w-12 h-12 bg-[#f8f7f5] rounded-lg overflow-hidden border border-[#312f2c]/5 flex-shrink-0">
                            {prod.product_images?.[0]?.url ? (
                              <img src={prod.product_images[0].url} className="w-full h-full object-cover mix-blend-multiply" alt=""/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[#312f2c]/40">No Img</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#312f2c]">{prod.name}</p>
                            <p className="text-xs text-[#312f2c]/50 font-mono mt-0.5">SKU: {prod.sku}</p>
                          </div>
                          {prod.type === 'variable' && (
                            <div className="text-[10px] uppercase font-bold text-[#d1a054] bg-[#d1a054]/10 px-2 py-1 rounded">
                              Variable
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#312f2c]/40 text-sm">
                      {searchQuery ? 'No products found.' : 'Search to find a product to add.'}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-white border border-[#312f2c]/10 rounded-xl relative">
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 text-xs text-[#312f2c]/50 hover:text-[#312f2c] underline">Change</button>
                    <div className="w-16 h-16 bg-[#f8f7f5] rounded-lg overflow-hidden border border-[#312f2c]/5 flex-shrink-0">
                      {selectedProduct.product_images?.[0]?.url && <img src={selectedProduct.product_images[0].url} className="w-full h-full object-cover mix-blend-multiply" alt=""/>}
                    </div>
                    <div>
                      <p className="font-medium text-[#312f2c] pr-8">{selectedProduct.name}</p>
                      <p className="text-xs text-[#312f2c]/50 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
                    </div>
                  </div>

                  {selectedProduct.type === 'variable' && selectedProduct.product_variations && (
                    <div>
                      <label className="block text-xs font-medium text-[#312f2c]/55 uppercase tracking-wide mb-1.5">Select Variation</label>
                      <select 
                        value={selectedVariationId || ''} 
                        onChange={e => setSelectedVariationId(parseInt(e.target.value))}
                        className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none focus:border-[#d1a054]"
                      >
                        <option value="" disabled>Select an option...</option>
                        {selectedProduct.product_variations.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.variation_attribute_values.map((vav: any) => vav.attribute_values.value).join(' / ')} - {v.sku} - {formatMoney(v.sale_price || v.regular_price)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedProduct.measurement_type === 'inch' || selectedProduct.measurement_type === 'plate') && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#312f2c]/55 uppercase tracking-wide mb-1.5">Length (Inches)</label>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="0.1"
                          value={addLength} 
                          onChange={e => setAddLength(parseFloat(e.target.value) || '')}
                          className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none focus:border-[#d1a054]"
                          placeholder="e.g. 10"
                        />
                      </div>
                      {selectedProduct.measurement_type === 'plate' && (
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#312f2c]/55 uppercase tracking-wide mb-1.5">Width (Inches)</label>
                          <input 
                            type="number" 
                            min="0.1" 
                            step="0.1"
                            value={addWidth} 
                            onChange={e => setAddWidth(parseFloat(e.target.value) || '')}
                            className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none focus:border-[#d1a054]"
                            placeholder="e.g. 5"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#312f2c]/55 uppercase tracking-wide mb-1.5">Quantity (Units)</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={addQuantity} 
                      onChange={e => setAddQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-sm text-[#312f2c] focus:outline-none focus:border-[#d1a054]"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-[#312f2c]/10 flex justify-end gap-3 bg-white/50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-sm font-medium text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-[#312f2c]/5 rounded-lg transition-colors">
                Cancel
              </button>
              {selectedProduct && (
                <button 
                  onClick={handleAddToCart} 
                  disabled={isAdding || (selectedProduct.type === 'variable' && !selectedVariationId)}
                  className="px-5 py-2 bg-[#d1a054] text-white text-sm font-medium rounded-lg hover:bg-[#c09044] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
