'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiCheck, FiX, FiRefreshCcw, FiPrinter, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { apiUrl } from "@/lib/cart";
import styles from '../../profile/profile.module.css';
import ReturnModal from './ReturnModal';

interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  variation_label: string;
  quantity: number;
  original_unit_price: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  custom_length?: number;
  custom_width?: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  created_at: string;
  billing_address: any;
  shipping_address: any;
  customer_note: string;
  items: OrderItem[];
  admin_notes?: { content: string; created_at: string }[];
  discounts?: { rule_name_snapshot: string; coupon_code: string; discount_amount: number }[];
  returns?: { id: number; return_number: string; status: string; refund_amount: number }[];
  cancellation_requested_at?: string;
}

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    // Check if the URL has ?action=return to auto-open modal
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'return') {
        setShowReturnModal(true);
      }
    }
  }, []);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('storeToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(apiUrl(`/api/store/account/orders/${params.id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        toast.error('Failed to load order details.');
      }
    } catch (err) {
      toast.error('An error occurred while fetching order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id, router]);

  const handleCancel = async () => {
    const reason = window.prompt('Please enter a reason for cancelling this order:');
    if (reason === null) return; 

    try {
      const token = localStorage.getItem('storeToken');
      const res = await fetch(apiUrl(`/api/store/account/orders/${order?.id}/cancel-request`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Cancellation request submitted.');
        fetchOrder();
      } else {
        toast.error(data.error || 'Failed to cancel order.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiClock /> Pending</span>;
      case 'processing': return <span style={{ backgroundColor: '#cce5ff', color: '#004085', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiRefreshCcw /> Processing</span>;
      case 'completed': return <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiCheck /> Completed</span>;
      case 'cancelled': return <span style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiX /> Cancelled</span>;
      default: return <span style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr || (Object.keys(addr).length === 0) || (!addr.address_line1 && !addr.city && !addr.first_name)) {
      return <div style={{ color: '#999', fontStyle: 'italic' }}>No address provided</div>;
    }
    return (
      <div style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 600, color: '#333' }}>{addr.first_name} {addr.last_name}</div>
        {addr.company && <div>{addr.company}</div>}
        <div>{addr.address_line1}</div>
        {addr.address_line2 && <div>{addr.address_line2}</div>}
        <div>{addr.city}, {addr.state} {addr.postal_code}</div>
        <div>{addr.country}</div>
        {addr.phone && <div style={{ marginTop: '0.5rem' }}>Phone: {addr.phone}</div>}
        {addr.email && <div>Email: {addr.email}</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ textAlign: 'center', padding: '4rem', fontWeight: 600 }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Order Not Found</h2>
            <Link href="/orders" className={styles.saveBtn} style={{ textDecoration: 'none' }}>Return to Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.title}>Order #{order.order_number}</h1>
            <p className={styles.subtitle}>
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {order.status === 'completed' && (!order.returns || !order.returns.some(r => ['requested', 'approved', 'received'].includes(r.status))) && (
              <button onClick={() => setShowReturnModal(true)} className={styles.btnSmall} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', color: '#d1a054', border: '1px solid #d1a054' }}>
                <FiRefreshCcw /> Request Return
              </button>
            )}
            {order.status === 'completed' && order.returns && order.returns.some(r => ['requested', 'approved', 'received'].includes(r.status)) && (
              <span className={styles.btnSmall} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', color: '#d1a054', border: '1px solid #d1a054', cursor: 'default' }}>
                Return Requested
              </span>
            )}
            {(order.status === 'pending' || order.status === 'on-hold') && !order.cancellation_requested_at && (
              <button onClick={handleCancel} className={styles.btnSmall} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545' }}>
                <FiX /> Cancel Order
              </button>
            )}
            {(order.status === 'pending' || order.status === 'on-hold') && order.cancellation_requested_at && (
              <span className={styles.btnSmall} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', cursor: 'default' }}>
                Cancellation Requested
              </span>
            )}
            <Link href={`/invoice/${order.id}`} target="_blank" className={styles.btnSmall} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ccc' }}>
              <FiPrinter /> Print Invoice
            </Link>
            <Link href="/orders" className={styles.btnSmall} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#000', color: '#fff', border: 'none' }}>
              <FiArrowLeft /> Back to Orders
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Main Order Info */}
          <div className={styles.form} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '0.5rem' }}>Order Status</h3>
                {getStatusBadge(order.status)}
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '0.5rem' }}>Payment Status</h3>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.payment_status.replace('_', ' ')}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '0.5rem' }}>Payment Method</h3>
                <span style={{ fontWeight: 600 }}>{order.payment_method === 'standard_review' ? 'Standard Wholesale Review' : order.payment_method}</span>
              </div>
            </div>

            {/* Address Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Billing Address</h3>
                {formatAddress(order.billing_address)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Shipping Address</h3>
                {formatAddress(order.shipping_address)}
              </div>
            </div>

            {order.customer_note && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #eee' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#555' }}>Your Order Notes</h3>
                <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{order.customer_note}</p>
              </div>
            )}

            {order.admin_notes && order.admin_notes.length > 0 && (
              <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeeba' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#856404' }}>Messages from Store</h3>
                {order.admin_notes.map((note, idx) => (
                  <div key={idx} style={{ marginBottom: idx < (order.admin_notes?.length || 0) - 1 ? '1rem' : 0 }}>
                    <p style={{ margin: 0, color: '#856404', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    <span style={{ fontSize: '0.75rem', color: '#856404', opacity: 0.8 }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Order Items</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', backgroundColor: '#fbfbfb' }}>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600, textAlign: 'center' }}>Price</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#333' }}>{item.product_name}</div>
                        {item.variation_label && <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>{item.variation_label}</div>}
                        {item.sku && <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.2rem' }}>SKU: {item.sku}</div>}
                        {(item.custom_length || item.custom_width) && (
                          <div style={{ fontSize: '0.8rem', color: '#0066cc', marginTop: '0.3rem', fontWeight: 500 }}>
                            Custom Size: {item.custom_length ? `L: ${item.custom_length}"` : ''} {item.custom_width ? `W: ${item.custom_width}"` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'center', color: '#555' }}>
                        ${parseFloat(item.unit_price.toString()).toFixed(2)}
                        {item.original_unit_price > item.unit_price && (
                          <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.8rem' }}>
                            ${parseFloat(item.original_unit_price.toString()).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>
                        x{item.quantity}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#333' }}>
                        ${parseFloat(item.line_total.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#fbfbfb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#555' }}>
                  <span>Subtotal</span>
                  <span>${parseFloat(order.subtotal.toString()).toFixed(2)}</span>
                </div>
                
                
                {parseFloat(order.discount_total.toString()) > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d1a054' }}>
                      <span>Discounts</span>
                      <span>-${parseFloat(order.discount_total.toString()).toFixed(2)}</span>
                    </div>
                    {order.discounts && order.discounts.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem', paddingLeft: '0.5rem', borderLeft: '2px solid #eee' }}>
                        {order.discounts.map((d, idx) => (
                          <div key={idx}>
                            {d.rule_name_snapshot} {d.coupon_code ? `(${d.coupon_code})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#555' }}>
                  <span>Shipping</span>
                  <span>{parseFloat(order.shipping_total.toString()) === 0 ? '$0.00' : `$${parseFloat(order.shipping_total.toString()).toFixed(2)}`}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                  <span>Tax</span>
                  <span>{parseFloat(order.tax_total.toString()) === 0 ? '$0.00' : `$${parseFloat(order.tax_total.toString()).toFixed(2)}`}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: '#000' }}>
                  <span>Total</span>
                  <span>${parseFloat(order.total.toString()).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Button if Pending */}
            {order.payment_status === 'pending' && order.status !== 'cancelled' && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/orders/${order.id}/pay`} className={styles.saveBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  <FiCreditCard /> Make Payment
                </Link>
              </div>
            )}

            {/* Returns / RMAs */}
            {order.returns && order.returns.length > 0 && (
              <div style={{ marginTop: '3rem', borderTop: '2px dashed #eee', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Returns & Refunds</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {order.returns.map(ret => (
                    <div key={ret.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#333' }}>RMA #{ret.return_number}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem', textTransform: 'capitalize' }}>Status: {ret.status.replace('_', ' ')}</div>
                      </div>
                      {parseFloat(ret.refund_amount.toString()) > 0 && (
                        <div style={{ fontWeight: 600, color: '#721c24' }}>
                          Refunded: ${parseFloat(ret.refund_amount.toString()).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
      {showReturnModal && order && (
        <ReturnModal 
          order={order} 
          onClose={() => {
            setShowReturnModal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('action');
            window.history.replaceState({}, '', url);
          }} 
          onSuccess={() => {
            setShowReturnModal(false);
            fetchOrder();
          }} 
        />
      )}
    </div>
  );
}
