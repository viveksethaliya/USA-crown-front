'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  apiUrl,
  formatMoney,
  getGuestCartId,
  type CartApiResponse,
  type CartSummary
} from '@/lib/cart';
import styles from './checkout.module.css';

interface CheckoutAddress {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
}

interface ProfileResponse {
  user?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address_line?: string;
    city?: string;
    state_province?: string;
    zip_code?: string;
    country?: string;
  };
}

interface CheckoutOrder {
  id: string;
  order_number?: string | null;
  status: string;
  total_amount: number;
}

interface CheckoutResponse {
  success?: boolean;
  order?: CheckoutOrder;
  error?: string;
}

const emptyAddress: CheckoutAddress = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  stateProvince: '',
  zipCode: '',
  country: 'United States'
};

const fromProfile = (profile: ProfileResponse['user']): CheckoutAddress => ({
  firstName: profile?.first_name || '',
  lastName: profile?.last_name || '',
  companyName: profile?.company_name || '',
  email: profile?.email || '',
  phone: profile?.phone || '',
  addressLine: profile?.address_line || '',
  city: profile?.city || '',
  stateProvince: profile?.state_province || '',
  zipCode: profile?.zip_code || '',
  country: profile?.country || 'United States'
});

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [billingAddress, setBillingAddress] = useState<CheckoutAddress>(emptyAddress);
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress>(emptyAddress);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingMethod, setShippingMethod] = useState('standard_review');
  const [orderNotes, setOrderNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<CheckoutOrder | null>(null);

  const loadCheckout = async () => {
    setError('');

    try {
      const guestId = getGuestCartId();
      const cartResponse = await fetch(apiUrl(`/api/cart?guestId=${encodeURIComponent(guestId)}`), {
        credentials: 'include',
      });
      const cartData = await cartResponse.json() as CartApiResponse;

      if (!cartResponse.ok) throw new Error(cartData.error || 'Failed to load cart');

      setCart(cartData.cart);

      if (cartData.cart.authenticated) {
        const profileResponse = await fetch(apiUrl('/api/user/profile'), {
          credentials: 'include',
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json() as ProfileResponse;
          const address = fromProfile(profileData.user);
          setBillingAddress(address);
          setShippingAddress(address);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCheckout();
  }, []);

  const updateBilling = (field: keyof CheckoutAddress, value: string) => {
    setBillingAddress((current) => ({ ...current, [field]: value }));
    if (sameAsBilling) {
      setShippingAddress((current) => ({ ...current, [field]: value }));
    }
  };

  const updateShipping = (field: keyof CheckoutAddress, value: string) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setPlacingOrder(true);

    try {
      const response = await fetch(apiUrl('/api/checkout'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingAddress,
          shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
          shippingMethod,
          orderNotes,
          termsAccepted
        })
      });

      const data = await response.json() as CheckoutResponse;
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrder(data.order);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const addressFields: { key: keyof CheckoutAddress; label: string; type?: string; required?: boolean }[] = [
    { key: 'firstName', label: 'First name', required: true },
    { key: 'lastName', label: 'Last name', required: true },
    { key: 'companyName', label: 'Company' },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'addressLine', label: 'Address', required: true },
    { key: 'city', label: 'City', required: true },
    { key: 'stateProvince', label: 'State / Province', required: true },
    { key: 'zipCode', label: 'Zip code', required: true },
    { key: 'country', label: 'Country', required: true }
  ];

  if (order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.confirmation}>
            <p className={styles.eyebrow}>Order received</p>
            <h1>Thank you</h1>
            <p>
              Your wholesale order {order.order_number || order.id} is pending review.
              Crown Findings will confirm final shipping, tax, and payment details.
            </p>
            <div className={styles.confirmationTotal}>
              <span>Current subtotal</span>
              <strong>{formatMoney(order.total_amount)}</strong>
            </div>
            <Link href="/products" className={styles.primaryButton}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Wholesale order</p>
            <h1 className={styles.title}>Checkout</h1>
          </div>
          <Link href="/cart" className={styles.secondaryLink}>Back to Cart</Link>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {loading ? (
          <div className={styles.emptyState}>Loading checkout...</div>
        ) : !cart?.authenticated ? (
          <div className={styles.emptyState}>
            <h2>Login required</h2>
            <p>Your cart will merge into your member account after login.</p>
            <Link href="/login" className={styles.primaryButton}>Login to Continue</Link>
          </div>
        ) : cart.items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Your cart is empty</h2>
            <Link href="/products" className={styles.primaryButton}>Shop Products</Link>
          </div>
        ) : !cart.canCheckout ? (
          <div className={styles.emptyState}>
            <h2>Cart needs attention</h2>
            <p>Review minimum order rules and item availability before checkout.</p>
            <Link href="/cart" className={styles.primaryButton}>Review Cart</Link>
          </div>
        ) : (
          <form className={styles.checkoutGrid} onSubmit={submitCheckout}>
            <div className={styles.formSections}>
              <section className={styles.section}>
                <h2>Billing Address</h2>
                <div className={styles.fieldGrid}>
                  {addressFields.map((field) => (
                    <label key={field.key} className={styles.field}>
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      <input
                        type={field.type || 'text'}
                        value={billingAddress[field.key]}
                        required={field.required}
                        onChange={(event) => updateBilling(field.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Shipping Address</h2>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(event) => {
                        setSameAsBilling(event.target.checked);
                        if (event.target.checked) setShippingAddress(billingAddress);
                      }}
                    />
                    Same as billing
                  </label>
                </div>

                {!sameAsBilling && (
                  <div className={styles.fieldGrid}>
                    {addressFields.map((field) => (
                      <label key={field.key} className={styles.field}>
                        <span>{field.label}{field.required ? ' *' : ''}</span>
                        <input
                          type={field.type || 'text'}
                          value={shippingAddress[field.key]}
                          required={field.required}
                          onChange={(event) => updateShipping(field.key, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <h2>Shipping and Notes</h2>
                <label className={styles.field}>
                  <span>Shipping method</span>
                  <select value={shippingMethod} onChange={(event) => setShippingMethod(event.target.value)}>
                    <option value="standard_review">Standard wholesale shipping, reviewed by staff</option>
                    <option value="customer_pickup">Customer pickup, reviewed by staff</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Order notes</span>
                  <textarea
                    value={orderNotes}
                    onChange={(event) => setOrderNotes(event.target.value)}
                    rows={4}
                  />
                </label>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    required
                  />
                  <span>
                    I accept the <Link href="/terms" target="_blank">terms and conditions</Link>.
                  </span>
                </label>
              </section>
            </div>

            <aside className={styles.summary}>
              <h2>Order Summary</h2>
              {cart.items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <span>{item.quantity} x {item.productName}</span>
                  <strong>{formatMoney(item.lineTotal)}</strong>
                </div>
              ))}
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotal)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <strong>Review</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <strong>Review</strong>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={placingOrder}>
                {placingOrder ? 'Placing Order...' : 'Place Pending Order'}
              </button>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
