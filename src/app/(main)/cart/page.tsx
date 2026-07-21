'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  formatMoney,
  cartFetch,
  type CartApiResponse,
  type CartSummary
} from '@/lib/cart';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Trash2, ArrowRight, Loader2, Search } from 'lucide-react';

export default function CartPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadCart = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('storeToken') : null;
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    try {
      const response = await cartFetch('/api/store/cart');
      const data = await response.json() as CartApiResponse;
      if (!response.ok) throw new Error(data.error || 'Failed to load cart');

      if (data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setBusyItemId(itemId);

    try {
      const response = await cartFetch(`/api/store/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update quantity');
      }

      await loadCart();
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setBusyItemId(itemId);

    try {
      const response = await cartFetch(`/api/store/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove item');
      }

      await loadCart();
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Item removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-lg mx-auto text-center px-4">
        <div className="w-20 h-20 bg-[#f8f9fa] flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-[#333333]/40" />
        </div>
        <h1 className="text-3xl font-semibold text-[#001f3f] mb-4">Login Required</h1>
        <p className="text-[#666666] mb-8">
          You must be logged in with an approved wholesale account to view pricing and access your cart.
        </p>
        <Link href="/login" className="px-8 py-3 bg-[#001f3f] text-white font-medium hover:bg-[#00152b] transition-colors rounded-none">
          Login to Continue
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-lg mx-auto text-center px-4">
        <div className="w-24 h-24 bg-[#f8f9fa] flex items-center justify-center mb-6 border border-[#e0e0e0]">
          <ShoppingCart className="w-12 h-12 text-[#333333]/30" />
        </div>
        <h1 className="text-3xl font-semibold text-[#001f3f] mb-4">Your cart is empty</h1>
        <p className="text-[#666666] mb-8">
          Looks like you haven't added any items to your order yet. Browse our catalog to find what you need.
        </p>
        <Link href="/products" className="flex items-center gap-2 px-8 py-3 bg-[#fa9531] text-[#001f3f] font-bold hover:bg-[#e0852b] hover:text-[#001f3f] transition-colors rounded-[4px]">
          <Search className="w-4 h-4" />
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-[#001f3f] uppercase tracking-wider">Shopping Cart</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Cart Items Table */}
        <div className="flex-1 w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-sm font-medium text-[#666666] uppercase tracking-wider">
                <th className="py-4 font-semibold font-normal">Product</th>
                <th className="py-4 font-semibold font-normal text-center">Price</th>
                <th className="py-4 font-semibold font-normal text-center">Quantity</th>
                <th className="py-4 font-semibold font-normal text-right">Total</th>
                <th className="py-4"></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#e0e0e0] ${busyItemId === item.id ? 'opacity-50' : ''}`}
                >
                  {/* 1. Product Photo, Name, Variation, SKU */}
                  <td className="py-6 align-top">
                    <div className="flex items-start gap-5 pr-4">
                      <div className="w-24 h-24 bg-white flex-shrink-0 border border-[#e0e0e0]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="object-cover w-full h-full mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#666666] text-xs text-center p-1">No Image</div>
                        )}
                      </div>
                      <div className="pt-1 flex flex-col">
                        <Link href={`/products/${item.productId}`} className="text-base font-semibold text-[#001f3f] hover:text-[#d4af37] transition-colors line-clamp-2 uppercase">
                          {item.productName}
                        </Link>
                        {item.variationLabel && (
                          <div className="text-sm text-[#666666] mt-1">{item.variationLabel}</div>
                        )}
                        {item.sku && (
                          <div className="text-sm text-[#666666] mt-2 font-mono">SKU: {item.sku}</div>
                        )}
                        {(item as any).measurementType === 'inch' && (item as any).customLength && (
                          <div className="text-sm text-[#d4af37] mt-1 font-medium">📏 Length: {(item as any).customLength}"</div>
                        )}
                        {(item as any).measurementType === 'plate' && (item as any).customLength && (item as any).customWidth && (
                          <div className="text-sm text-[#d4af37] mt-1 font-medium">📐 Dimensions: {(item as any).customLength}" × {(item as any).customWidth}"</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Product Price / Sale Price */}
                  <td className="py-6 align-top pt-7 px-4 text-center">
                    {item.regularPrice > item.unitPrice ? (
                      <div className="flex flex-col items-center">
                        <span className="line-through text-[#666666] text-sm">{formatMoney(item.regularPrice)}</span>
                        <span className="text-[#d4af37] font-semibold">{formatMoney(item.unitPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-[#333333] font-semibold">{formatMoney(item.unitPrice)}</span>
                    )}
                  </td>

                  {/* 3. Quantity */}
                  <td className="py-6 align-top pt-6 px-4">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center border border-[#e0e0e0] bg-white w-min rounded-none">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={busyItemId === item.id || item.quantity <= 1}
                          className="px-4 py-2 text-[#333333] hover:bg-[#f8f9fa] disabled:opacity-50 transition-colors border-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          disabled={busyItemId === item.id}
                          className="w-12 text-center text-sm font-medium text-[#333333] focus:outline-none appearance-none bg-transparent border-none p-0"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={busyItemId === item.id}
                          className="px-4 py-2 text-[#333333] hover:bg-[#f8f9fa] disabled:opacity-50 transition-colors border-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* 4. Final Price after discount applied */}
                  <td className="py-6 align-top pt-7 pl-4 text-right">
                    {item.discountAmount && item.discountAmount > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-[#666666] text-sm">{formatMoney(item.lineTotal)}</span>
                        <span className="text-[#333333] font-semibold">{formatMoney(item.finalLineTotal)}</span>
                        <span className="text-xs text-[#d4af37] mt-2 font-medium">
                          Discount: -{formatMoney(item.discountAmount)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#333333] font-semibold">{formatMoney(item.lineTotal)}</span>
                    )}
                  </td>

                  {/* 5. Remove Option */}
                  <td className="py-6 align-top pt-6 pr-2 text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={busyItemId === item.id}
                      className="text-[#666666] hover:text-red-600 transition-colors p-2 bg-transparent border-none"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary (Right side) */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-[#f8f9fa] border border-[#e0e0e0] p-6 lg:p-8 sticky top-32 rounded-none">
            <h2 className="text-xl font-semibold text-[#001f3f] uppercase tracking-wider mb-6">Order Summary</h2>

            <div className="space-y-4 text-sm text-[#333333] border-b border-[#e0e0e0] pb-6 mb-6">
              <div className="flex justify-between items-center">
                <span>Items ({cart.itemCount})</span>
                <span className="font-medium">{formatMoney(cart.subtotal)}</span>
              </div>

              {cart.discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#d4af37]">
                  <span>Total Saved</span>
                  <span className="font-medium">-{formatMoney(cart.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#666666]">
                <span>Shipping</span>
                <span className="italic">Calculated later</span>
              </div>
              <div className="flex justify-between items-center text-[#666666]">
                <span>Tax</span>
                <span className="italic">Calculated later</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-base text-[#333333] font-semibold uppercase">Estimated Total</span>
              <span className="text-2xl font-semibold text-[#001f3f]">{formatMoney(cart.total)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#fa9531] text-[#001f3f] font-bold uppercase tracking-wider hover:bg-[#e0852b] hover:text-[#001f3f] transition-colors group rounded-[4px]"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
