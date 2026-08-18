'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  apiUrl,
  formatMoney,
  cartFetch,
  type CartApiResponse,
  type CartSummary
} from '@/lib/cart';
import { toast } from 'react-hot-toast';
import styles from './checkout.module.css';

interface CheckoutAddress {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface SavedAddress {
  id: number;
  type: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  fax: string | null;
  is_default: boolean;
}

interface ProfileResponse {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
}

interface CheckoutOrder {
  id: string;
  order_number?: string | null;
  status: string;
  total_amount?: number;
  total?: number;
}

interface CheckoutResponse {
  success?: boolean;
  order?: CheckoutOrder;
  error?: string;
}

interface SelectOption { label: string; value: string; }

interface CheckoutField {
  id: number;
  label: string;
  field_key: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'email' | 'tel';
  placeholder: string | null;
  options: SelectOption[];
  is_required: boolean;
}

const emptyAddress: CheckoutAddress = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States'
};

const fromProfile = (profile: ProfileResponse): CheckoutAddress => ({
  firstName: profile?.first_name || '',
  lastName: profile?.last_name || '',
  companyName: '',
  email: profile?.email || '',
  phone: profile?.mobile || '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States'
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
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  interface ShippingMethod {
    id: string;
    name: string;
    cost: number;
  }
  const [error, setError] = useState<string | null>(null);
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [checkoutFields, setCheckoutFields] = useState<CheckoutField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const loadCheckout = async () => {
    setError('');

    try {
      const cartResponse = await cartFetch('/api/store/cart');
      const cartData = await cartResponse.json() as CartApiResponse;

      if (!cartResponse.ok) throw new Error(cartData.error || 'Failed to load cart');

      const shippingResponse = await cartFetch('/api/store/checkout/shipping-methods');
      if (shippingResponse.ok) {
        const smData = await shippingResponse.json();
        const methods = smData.shippingMethods || [];
        if (methods.length > 0) {
          setAvailableShippingMethods(methods);
          setShippingMethod(methods[0].id);
        }
      }

      setCart(cartData.cart);

      if (cartData.cart?.id) {
        const profileResponse = await cartFetch('/api/store/account/profile');
        const addressesResponse = await cartFetch('/api/store/account/addresses');
        const fieldsResponse = await cartFetch('/api/store/checkout/fields');

        if (profileResponse.ok) {
          const profileData = await profileResponse.json() as ProfileResponse;
          const address = fromProfile(profileData);
          setBillingAddress(address);
          setShippingAddress(address);
        }

        if (addressesResponse.ok) {
          const addressesData = await addressesResponse.json();
          if (Array.isArray(addressesData)) {
            setSavedAddresses(addressesData);
          }
        }
        
        if (fieldsResponse.ok) {
          const fieldsData = await fieldsResponse.json();
          if (Array.isArray(fieldsData)) {
            setCheckoutFields(fieldsData);
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load checkout');
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
    setPlacingOrder(true);

    try {
      const response = await cartFetch('/api/store/checkout', {
        method: 'POST',
        body: JSON.stringify({
          billingAddress,
          shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
          shippingMethod,
          orderNotes,
          termsAccepted,
          customFields: customFieldValues
        })
      });

      const data = await response.json() as CheckoutResponse;
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrder(data.order);
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
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
    { key: 'address_line1', label: 'Address Line 1', required: true },
    { key: 'address_line2', label: 'Address Line 2' },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State / Province', required: true },
    { key: 'postal_code', label: 'Zip / Postal Code', required: true },
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
              <span>Current order total</span>
              <strong>{formatMoney(order.total ?? order.total_amount)}</strong>
              <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', textAlign: 'center' }}>
                Note: Shipping and tax are pending and subject to staff review.
              </p>
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

        {loading ? (
          <div className={styles.emptyState}>Loading checkout...</div>
        ) : !cart ? (
          <div className={styles.emptyState}>
            <h2>Login required</h2>
            <p>You must be logged in to access checkout.</p>
            <Link href="/login" className={styles.primaryButton}>Login to Continue</Link>
          </div>
        ) : cart.items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Your cart is empty</h2>
            <Link href="/products" className={styles.primaryButton}>Shop Products</Link>
          </div>
        ) : (
          <form className={styles.checkoutGrid} onSubmit={submitCheckout}>
            <div className={styles.formSections}>
              {!cart.canCheckout && (
                <div style={{ padding: '16px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Cart needs attention</h3>
                  <p style={{ margin: 0, fontSize: '0.9em' }}>Review minimum order rules and item availability before checkout. <Link href="/cart" style={{ textDecoration: 'underline' }}>Return to Cart</Link></p>
                </div>
              )}
              <section className={styles.section}>
                <h2>Billing Address</h2>
                {savedAddresses.length > 0 && (
                  <div className={styles.savedAddressSelector}>
                    <p>Choose a saved address:</p>
                    <select
                      className={styles.savedAddressSelect}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const addr = savedAddresses.find(a => a.id.toString() === selectedId);
                        if (addr) {
                          setBillingAddress(prev => ({
                            ...prev,
                            address_line1: addr.address_line1 || '',
                            address_line2: addr.address_line2 || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            postal_code: addr.postal_code || '',
                            country: addr.country || '',
                            phone: addr.phone || '',
                            fax: addr.fax || ''
                          }));
                          // If sameAsBilling is checked, shipping updates automatically via useEffect or similar? 
                          // Actually, shipping is updated on form submit if sameAsBilling is true.
                        }
                      }}
                    >
                      <option value="">-- Select a saved address --</option>
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.postal_code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={styles.fieldGrid}>
                    {addressFields.map((field) => (
                      <label key={field.key} className={styles.field}>
                        <span>
                          {field.label}
                          {field.required && <span className={styles.requiredAsterisk}>*</span>}
                        </span>
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

                {!sameAsBilling && savedAddresses.length > 0 && (
                  <div className={styles.savedAddressSelector}>
                    <p>Or choose a saved address:</p>
                    <select
                      className={styles.savedAddressSelect}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const addr = savedAddresses.find(a => a.id.toString() === selectedId);
                        if (addr) {
                          setShippingAddress(prev => ({
                            ...prev,
                            address_line1: addr.address_line1 || '',
                            address_line2: addr.address_line2 || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            postal_code: addr.postal_code || '',
                            country: addr.country || 'United States',
                            phone: addr.phone || prev.phone || ''
                          }));
                        }
                      }}
                    >
                      <option value="">-- Select a saved address --</option>
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.postal_code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!sameAsBilling && (
                  <div className={styles.fieldGrid}>
                    {addressFields.map((field) => (
                      <label key={field.key} className={styles.field}>
                        <span>
                          {field.label}
                          {field.required && <span className={styles.requiredAsterisk}>*</span>}
                        </span>
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
                    {availableShippingMethods.length > 0 ? (
                      availableShippingMethods.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.cost > 0 ? `(${formatMoney(m.cost)})` : '(Calculated later)'}</option>
                      ))
                    ) : (
                      <>
                        <option value="standard_review">Standard wholesale shipping, reviewed by staff</option>
                        <option value="customer_pickup">Customer pickup, reviewed by staff</option>
                      </>
                    )}
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

              {checkoutFields.length > 0 && (
                <section className={styles.section}>
                  <h2>Additional Information</h2>
                  <div className={styles.fieldGrid}>
                    {checkoutFields.map((field) => (
                      <div key={field.id} className={styles.field}>
                        <span className="font-bold">
                          {field.label}
                          {field.is_required && <span className={styles.requiredAsterisk}>*</span>}
                        </span>
                        {field.field_type === 'textarea' ? (
                          <textarea
                            required={field.is_required}
                            placeholder={field.placeholder || ''}
                            value={customFieldValues[field.field_key] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                            rows={3}
                          />
                        ) : field.field_type === 'select' ? (
                          <select
                            required={field.is_required}
                            value={customFieldValues[field.field_key] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                          >
                            <option value="">-- Select an option --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : field.field_type === 'checkbox' ? (
                          <div className={styles.segmentedToggle} role="radiogroup" aria-label={field.label}>
                            <button
                              type="button"
                              className={`${styles.segmentButton} ${customFieldValues[field.field_key] === true ? styles.segmentActive : ''}`}
                              onClick={() => setCustomFieldValues(prev => ({ ...prev, [field.field_key]: true }))}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className={`${styles.segmentButton} ${customFieldValues[field.field_key] === false ? styles.segmentActive : ''}`}
                              onClick={() => setCustomFieldValues(prev => ({ ...prev, [field.field_key]: false }))}
                            >
                              No
                            </button>
                            {field.is_required && customFieldValues[field.field_key] === undefined && (
                              <input type="checkbox" required className={styles.hiddenCheckbox} tabIndex={-1} aria-hidden="true" />
                            )}
                          </div>
                        ) : (
                          <input
                            type={field.field_type}
                            required={field.is_required}
                            placeholder={field.placeholder || ''}
                            value={customFieldValues[field.field_key] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className={styles.summary}>
              <h2>Order Summary</h2>
              {cart.items.map((item) => (
                <div key={item.id} className={styles.summaryItem} style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.quantity} x {item.productName}</span>
                    {item.regularPrice !== null && item.unitPrice !== null && item.regularPrice > item.unitPrice && (
                      <span style={{ fontSize: '0.85em', color: '#888', marginTop: '2px' }}>
                        <span style={{ textDecoration: 'line-through' }}>{formatMoney(item.regularPrice)}</span>
                        {' '}<span style={{ color: 'var(--color-gold)' }}>{formatMoney(item.unitPrice)}</span> each
                      </span>
                    )}
                  </div>
                  <strong>{formatMoney(item.finalLineTotal)}</strong>
                </div>
              ))}
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotal)}</strong>
              </div>

              {cart.pricingSource && cart.pricingSource !== 'base' && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>
                    Best available B2B price:
                    <br/>
                    <span style={{ fontSize: '0.85em', color: '#001f3f' }}>
                      {cart.pricingSource === 'price_list' ? 'Contract pricing' : cart.pricingSourceName || 'Discount applied'}
                    </span>
                  </span>
                  <strong>-{formatMoney(cart.discountAmount)}</strong>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <strong>Review</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <strong>{cart.taxAmount !== undefined ? formatMoney(cart.taxAmount) : 'Review'}</strong>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Estimate</span>
                <strong>{formatMoney(cart.total)}</strong>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={placingOrder || !cart.canCheckout}>
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
