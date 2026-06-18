"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus, FiSearch, FiX } from "react-icons/fi";
import styles from "../../admin.module.css";
import { toast } from "react-hot-toast";

interface CartItem {
  id: string;
  product_id: string;
  variation_id?: string;
  sku: string;
  product_name: string;
  variation_label: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: string | number;
}

interface Cart {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  users: {
    email: string;
    full_name: string;
    company_name?: string;
  } | null;
  cart_items: CartItem[];
}

export default function AdminCartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/admin/carts/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(data.cart);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching cart details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle Item Quantity Update
  const handleUpdateItemQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const res = await fetch(`/api/admin/carts/${id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty })
      });
      if (!res.ok) throw new Error("Failed to update item");
      toast.success("Item quantity updated");
      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Error updating item quantity");
    }
  };

  // Handle Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from the cart?")) return;
    try {
      const res = await fetch(`/api/admin/carts/${id}/items/${itemId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove item");
      toast.success("Item removed");
      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Error removing item");
    }
  };

  // Handle Add Product Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search/smart?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data.products || []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Add Product to Cart
  const handleAddProduct = async (product: any) => {
    setIsAddingProduct(true);
    try {
      const res = await fetch(`/api/admin/carts/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      });
      if (!res.ok) throw new Error("Failed to add product to cart");
      toast.success("Product added to cart");
      setShowAddProductModal(false);
      setSearchQuery("");
      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Error adding product to cart");
    } finally {
      setIsAddingProduct(false);
    }
  };

  if (loading) return <div className={styles.loadingState}>Loading cart details...</div>;
  if (!cart) return <div className={styles.emptyState}>Cart not found.</div>;

  const totalItems = cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalValue = cart.cart_items?.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price || 0)), 0) || 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/crown-admin/carts" style={{ color: '#0056b3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiArrowLeft /> Back to Carts
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>
          Cart Details
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowAddProductModal(true)}
            className={styles.primaryBtn}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiPlus /> Add Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Items */}
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Cart Items ({totalItems})</h2>
          
          {(!cart.cart_items || cart.cart_items.length === 0) ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Cart is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.cart_items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.product_name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, backgroundColor: '#f4f6f8', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' }}>No Img</div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
                    {item.sku && <div style={{ fontSize: '0.85rem', color: '#666' }}>SKU: {item.sku}</div>}
                    {item.variation_label && <div style={{ fontSize: '0.85rem', color: '#0056b3' }}>{item.variation_label}</div>}
                    <div style={{ marginTop: '0.25rem', fontWeight: 'bold', color: '#333' }}>
                      ${Number(item.unit_price).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                      <button 
                        onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                        style={{ padding: '0.5rem', background: '#f8f9fa', border: 'none', cursor: 'pointer', borderRight: '1px solid #ddd' }}
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus />
                      </button>
                      <div style={{ padding: '0.5rem 1rem', background: '#fff', minWidth: '40px', textAlign: 'center' }}>
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                        style={{ padding: '0.5rem', background: '#f8f9fa', border: 'none', cursor: 'pointer', borderLeft: '1px solid #ddd' }}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>
                      ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '0.5rem' }}
                      title="Remove Item"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Customer Info & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Customer Details</h2>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{cart.users?.full_name || 'Unknown'}</strong>
            </div>
            {cart.users?.company_name && (
              <div style={{ marginBottom: '0.5rem', color: '#666' }}>
                {cart.users.company_name}
              </div>
            )}
            <div style={{ color: '#0056b3' }}>
              <a href={`mailto:${cart.users?.email}`}>{cart.users?.email}</a>
            </div>
          </div>

          <div className={styles.card}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Cart Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#666' }}>Status:</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{cart.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#666' }}>Subtotal:</span>
              <strong>${cart.subtotal?.toFixed(2) || '0.00'}</strong>
            </div>

            {cart.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#dc3545' }}>
                <span>Discount {cart.discountTierName ? `(${cart.discountTierName})` : ''}</span>
                <strong>-${cart.discountAmount.toFixed(2)}</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total Value</span>
              <span>${cart.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Add Product to Cart</h2>
              <button onClick={() => { setShowAddProductModal(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#666' }}>
                <FiX />
              </button>
            </div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Search for a product by name or SKU to add it to the cart.</p>
            
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#888' }} size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '1rem' }}
                autoFocus
              />
            </div>

            {isSearching && <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>Searching...</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map(product => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, backgroundColor: '#f4f6f8', borderRadius: 4 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>SKU: {product.sku || 'N/A'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(product)}
                    disabled={isAddingProduct}
                    className={styles.secondaryBtn}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Add
                  </button>
                </div>
              ))}
              {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>No products found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
