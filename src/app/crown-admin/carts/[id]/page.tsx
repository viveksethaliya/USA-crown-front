"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus, FiSearch, FiX } from "react-icons/fi";
import styles from "./cart-detail.module.css";
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
  base_price?: number;
  display_regular_price?: number;
  display_sale_price?: number | null;
  discount_percent?: number;
  discounted_unit_price?: number;
  discount_amount?: number;
  line_total?: number;
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
  subtotal?: number;
  total?: number;
  discountAmount?: number;
  discountTierName?: string;
}

export default function AdminCartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});

  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Variation selection step
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productVariations, setProductVariations] = useState<any[]>([]);
  const [isFetchingVariations, setIsFetchingVariations] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/admin/carts/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(data.cart);

      // Sync local quantities map
      if (data.cart?.cart_items) {
        const qtyMap: Record<string, string> = {};
        data.cart.cart_items.forEach((item: any) => {
          qtyMap[item.id] = String(item.quantity);
        });
        setLocalQuantities(qtyMap);
      }
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

  // Step 1: Product selected — fetch variations if any
  const handleProductSelect = async (product: any) => {
    setIsFetchingVariations(true);
    setSelectedProduct(product);
    setSelectedVariationId(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const vars = data.product?.variations || [];
      setProductVariations(vars);
      // If no variations, add directly
      if (vars.length === 0) {
        await doAddToCart(product.id, null);
        closeAddProductModal();
      }
    } catch {
      // If variations fetch fails just add without variation
      await doAddToCart(product.id, null);
      closeAddProductModal();
    } finally {
      setIsFetchingVariations(false);
    }
  };

  // Step 2: Variation chosen — add to cart
  const handleAddWithVariation = async () => {
    if (!selectedProduct) return;
    await doAddToCart(selectedProduct.id, selectedVariationId);
    closeAddProductModal();
  };

  // Core add-to-cart call
  const doAddToCart = async (productId: string | number, variationId: string | null) => {
    setIsAddingProduct(true);
    try {
      const body: any = { product_id: productId, quantity: 1 };
      if (variationId) body.variation_id = variationId;
      const res = await fetch(`/api/admin/carts/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to add product to cart");
      toast.success("Product added to cart");
      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Error adding product to cart");
    } finally {
      setIsAddingProduct(false);
    }
  };

  const closeAddProductModal = () => {
    setShowAddProductModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
    setProductVariations([]);
    setSelectedVariationId(null);
  };

  if (loading) return <div className={styles.loadingState}>Loading cart details...</div>;
  if (!cart) return <div className={styles.emptyState}>Cart not found.</div>;

  const totalItems = cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalValue = cart.cart_items?.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price || 0)), 0) || 0;

  return (
    <div className={styles.detailContainer}>
      <div className={styles.backLinkRow}>
        <Link href="/crown-admin/carts" className={styles.backLink}>
          <FiArrowLeft /> Back to Carts
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>
          Cart Details
        </h1>
        <div>
          <button 
            onClick={() => setShowAddProductModal(true)}
            className={styles.primaryBtn}
          >
            <FiPlus /> Add Item
          </button>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {/* Left Column: Items */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Cart Items ({totalItems})</h2>
          
          {(!cart.cart_items || cart.cart_items.length === 0) ? (
            <p className={styles.emptyCartText}>Cart is empty.</p>
          ) : (
            <div className={styles.itemList}>
              {cart.cart_items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.product_name} className={styles.itemImage} />
                  ) : (
                    <div className={styles.itemImagePlaceholder}>No Img</div>
                  )}
                  
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.product_name}</div>
                    {item.sku && <div className={styles.itemSku}>SKU: {item.sku}</div>}
                    {item.variation_label && <div className={styles.itemVariation}>{item.variation_label}</div>}
                    
                    <div className={styles.itemPrices}>
                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Base Price:</span>
                        <span className={styles.priceValue}>
                          {item.display_sale_price ? (
                            <>
                              <span className={styles.strikePrice}>${Number(item.display_regular_price).toFixed(2)}</span>{" "}
                              <span className={styles.salePrice}>${Number(item.display_sale_price).toFixed(2)}</span>
                            </>
                          ) : (
                            <span>${Number(item.display_regular_price || item.unit_price).toFixed(2)}</span>
                          )}
                        </span>
                      </div>

                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Discounted Price:</span>
                        <span className={styles.priceValue}>
                          {item.discount_percent && item.discount_percent > 0 ? (
                            <span className={styles.discountedPrice}>
                              ${Number(item.discounted_unit_price).toFixed(2)}{" "}
                              <span className={styles.discountBadge}>{item.discount_percent}% off</span>
                            </span>
                          ) : (
                            <span>${Number(item.base_price || item.unit_price).toFixed(2)}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemControlsRow}>
                    <div className={styles.qtySelector}>
                      <button 
                        onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                        className={styles.qtyBtn}
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={localQuantities[item.id] ?? item.quantity}
                        onChange={(e) => {
                          setLocalQuantities(prev => ({
                            ...prev,
                            [item.id]: e.target.value
                          }));
                        }}
                        onBlur={() => {
                          const val = parseInt(localQuantities[item.id], 10);
                          if (!isNaN(val) && val >= 1 && val !== item.quantity) {
                            handleUpdateItemQty(item.id, val);
                          } else {
                            setLocalQuantities(prev => ({
                              ...prev,
                              [item.id]: String(item.quantity)
                            }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(localQuantities[item.id], 10);
                            if (!isNaN(val) && val >= 1 && val !== item.quantity) {
                              handleUpdateItemQty(item.id, val);
                              (e.target as HTMLInputElement).blur();
                            }
                          }
                        }}
                        className={styles.qtyInput}
                      />
                      <button 
                        onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                        className={styles.qtyBtn}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div className={styles.itemTotalPrice}>
                      ${Number(item.line_total || (Number(item.unit_price) * item.quantity)).toFixed(2)}
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className={styles.removeBtn}
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
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Customer Details</h2>
            <div className={styles.customerName}>
              {cart.users?.full_name || 'Unknown'}
            </div>
            {cart.users?.company_name && (
              <div className={styles.customerCompany}>
                {cart.users.company_name}
              </div>
            )}
            <div className={styles.customerEmail}>
              <a href={`mailto:${cart.users?.email}`}>{cart.users?.email}</a>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Cart Summary</h2>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Status:</span>
              <span className={styles.summaryValue} style={{ textTransform: 'capitalize' }}>{cart.status}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal:</span>
              <span className={styles.summaryValue}>${cart.subtotal?.toFixed(2) || '0.00'}</span>
            </div>

            {(cart.discountAmount ?? 0) > 0 && (
              <div className={styles.discountRow}>
                <span className={styles.discountLabel}>Discount {cart.discountTierName ? `(${cart.discountTierName})` : ''}</span>
                <span className={styles.discountValue}>-${cart.discountAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Value</span>
              <span className={styles.totalValue}>${cart.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedProduct ? 'Select Variation' : 'Add Product to Cart'}
              </h2>
              <button onClick={closeAddProductModal} className={styles.modalCloseBtn}>
                <FiX />
              </button>
            </div>

            {/* STEP 1 — Search & pick product */}
            {!selectedProduct && (
              <>
                <p className={styles.modalSubtitle}>Search for a product by name or SKU to add it to the cart.</p>

                <div className={styles.modalSearchBox}>
                  <FiSearch className={styles.modalSearchIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.modalSearchInput}
                    autoFocus
                  />
                </div>

                {isSearching && <div className={styles.modalSearching}>Searching...</div>}
                {isFetchingVariations && <div className={styles.modalSearching}>Loading variations...</div>}

                <div className={styles.modalResultsList}>
                  {searchResults.map(product => (
                    <div key={product.id} className={styles.modalResultItem}>
                      <div className={styles.modalResultProductInfo}>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt={product.name} className={styles.modalResultProductImage} />
                        ) : (
                          <div className={styles.modalResultProductImagePlaceholder} />
                        )}
                        <div>
                          <div className={styles.modalResultProductName}>{product.name}</div>
                          <div className={styles.modalResultProductSku}>SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleProductSelect(product)}
                        disabled={isFetchingVariations || isAddingProduct}
                        className={styles.secondaryBtn}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                  {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className={styles.modalSearching}>No products found.</div>
                  )}
                </div>
              </>
            )}

            {/* STEP 2 — Pick variation */}
            {selectedProduct && productVariations.length > 0 && (
              <>
                <div className={styles.varStepProductInfo}>
                  {selectedProduct.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProduct.image} alt={selectedProduct.name} className={styles.modalResultProductImage} />
                  )}
                  <div>
                    <div className={styles.modalResultProductName}>{selectedProduct.name}</div>
                    <div className={styles.modalResultProductSku}>Choose a variation to add</div>
                  </div>
                </div>

                <div className={styles.varOptionsList}>
                  {productVariations.map((v: any) => {
                    const label = v.attributes?.map((a: any) => `${a.name}: ${a.value}`).join(' / ') ||
                                  (v.sku ? `SKU: ${v.sku}` : `Variation #${v.id}`);
                    const price = v.sale_price ?? v.regular_price;
                    const isSelected = selectedVariationId === String(v.id);
                    return (
                      <div
                        key={v.id}
                        className={`${styles.varOptionRow} ${isSelected ? styles.varOptionRowSelected : ''}`}
                        onClick={() => setSelectedVariationId(String(v.id))}
                      >
                        <div className={styles.varOptionCheck}>
                          <div className={`${styles.varRadio} ${isSelected ? styles.varRadioActive : ''}`} />
                        </div>
                        <div className={styles.varOptionDetails}>
                          <div className={styles.varOptionLabel}>{label}</div>
                          {v.sku && <div className={styles.varOptionSku}>SKU: {v.sku}</div>}
                        </div>
                        <div className={styles.varOptionPrice}>
                          {price ? `$${Number(price).toFixed(2)}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.varStepActions}>
                  <button
                    onClick={() => { setSelectedProduct(null); setProductVariations([]); }}
                    className={styles.secondaryBtn}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleAddWithVariation}
                    disabled={!selectedVariationId || isAddingProduct}
                    className={styles.primaryBtn}
                  >
                    {isAddingProduct ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
