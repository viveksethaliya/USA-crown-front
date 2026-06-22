'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  apiUrl,
  formatMoney,
  getGuestCartId,
  type CartApiResponse,
  type CartSummary
} from '@/lib/cart';
import styles from './cart.module.css';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const loadCart = async () => {

    try {
      const guestId = getGuestCartId();
      const response = await fetch(apiUrl(`/api/cart?guestId=${encodeURIComponent(guestId)}`), {
        credentials: 'include',
      });

      const data = await response.json() as CartApiResponse;
      if (!response.ok) throw new Error(data.error || 'Failed to load cart');

      setCart(data.cart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCart();
  }, []);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setBusyItemId(itemId);

    try {
      const response = await fetch(apiUrl(`/api/cart/items/${itemId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          guestId: getGuestCartId()
        })
      });

      const data = await response.json() as CartApiResponse;
      if (!response.ok) throw new Error(data.error || 'Failed to update quantity');

      setCart(data.cart);
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Cart updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setBusyItemId(itemId);

    try {
      const guestId = getGuestCartId();
      const response = await fetch(apiUrl(`/api/cart/items/${itemId}?guestId=${encodeURIComponent(guestId)}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json() as CartApiResponse;
      if (!response.ok) throw new Error(data.error || 'Failed to remove item');

      setCart(data.cart);
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Item removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setBusyItemId(null);
    }
  };

  const missingMinimum = cart?.subtotal !== null && cart?.subtotal !== undefined
    ? Math.max(0, cart.minimumOrderAmount - cart.subtotal)
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Wholesale order</p>
            <h1 className={styles.title}>Cart</h1>
          </div>
          <Link href="/products" className={styles.secondaryLink}>Continue Shopping</Link>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading cart...</div>
        ) : !cart || cart.items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Your cart is empty</h2>
            <p>Add products from the catalog to start a wholesale order.</p>
            <Link href="/products" className={styles.primaryButton}>Shop Products</Link>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            <section className={styles.tableWrap} aria-label="Cart items">
              <table className={styles.cartTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id} className={!item.available ? styles.unavailableRow : ''}>
                      <td>
                        <div className={styles.itemCell}>
                          <div className={styles.itemImage}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} />
                            ) : (
                              <span>No image</span>
                            )}
                          </div>
                          <div>
                            <Link href={`/products/${item.productId}`} className={styles.itemName}>
                              {item.productName}
                            </Link>
                            {item.variationLabel && (
                              <p className={styles.itemMeta}>{item.variationLabel}</p>
                            )}
                            {item.sku && <p className={styles.itemMeta}>SKU: {item.sku}</p>}
                            {!item.available && (
                              <p className={styles.itemError}>{item.availabilityMessage}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {item.regularPrice !== null && item.unitPrice !== null && item.regularPrice > item.unitPrice ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.85em' }}>
                              {formatMoney(item.regularPrice)}
                            </span>
                            <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                              {formatMoney(item.unitPrice)}
                            </span>
                          </div>
                        ) : (
                          formatMoney(item.unitPrice)
                        )}
                      </td>
                      <td>
                        <div className={styles.quantityControls}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={busyItemId === item.id || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            disabled={busyItemId === item.id}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                            aria-label={`Quantity for ${item.productName}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={busyItemId === item.id}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{formatMoney(item.lineTotal)}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeItem(item.id)}
                          disabled={busyItemId === item.id}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className={styles.summary} aria-label="Cart summary">
              <h2>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Items</span>
                <strong>{cart.itemCount}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotal)}</strong>
              </div>

              {cart.discountAmount !== null && cart.discountAmount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>Discount {cart.discountTierName ? `(${cart.discountTierName})` : ''}</span>
                  <strong>-{formatMoney(cart.discountAmount)}</strong>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <strong>Review</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <strong>Review</strong>
              </div>
              
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Estimate</span>
                <strong>{formatMoney(cart.total)}</strong>
              </div>

              {!cart.authenticated && (
                <div className={styles.noticeBox}>
                  Login to view wholesale pricing and merge this guest cart into your member account.
                </div>
              )}

              {cart.authenticated && cart.belowMinimum && missingMinimum !== null && (
                <div className={styles.noticeBox}>
                  Minimum wholesale order is {formatMoney(cart.minimumOrderAmount)}. Add {formatMoney(missingMinimum)} more.
                </div>
              )}

              {cart.authenticated && !cart.hasPricing && (
                <div className={styles.noticeBox}>
                  One or more items need pricing before checkout.
                </div>
              )}

              {cart.authenticated ? (
                <Link
                  href={cart.canCheckout ? '/checkout' : '#'}
                  className={`${styles.primaryButton} ${!cart.canCheckout ? styles.disabledLink : ''}`}
                  aria-disabled={!cart.canCheckout}
                >
                  Checkout
                </Link>
              ) : (
                <Link href="/login" className={styles.primaryButton}>Login to Checkout</Link>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
