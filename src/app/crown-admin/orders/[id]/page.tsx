"use client";

import { useState, useEffect, use } from "react";

import Link from "next/link";
import styles from "../orders.module.css";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;


  interface OrderItem {
    id: number;
    image_url: string | null;
    product_name: string;
    sku: string;
    variation_label: string | null;
    unit_price: string | number;
    quantity: number;
    line_total: string | number;
  }
  interface OrderAddress {
    firstName: string;
    lastName: string;
    companyName: string | null;
    addressLine: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
    phone: string;
  }
  interface OrderLog {
    id: number;
    is_customer_note: boolean;
    admin_id: string | null;
    admin_name: string | null;
    created_at: string;
    note: string;
  }
  interface Refund {
    amount: string | number;
  }
  interface Order {
    status: string;
    order_number: string;
    created_at: string;
    customer_email: string;
    shipping_method: string;
    subtotal_amount: string | number;
    shipping_amount: string | number;
    tax_amount: string | number;
    total_amount: string | number;
    payment_link_url: string | null;
    payment_status: string;
    billing_address?: OrderAddress;
    shipping_address?: OrderAddress;
    items?: OrderItem[];
    refunds?: Refund[];
    activity_logs?: OrderLog[];
  }
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Status state
  const [status, setStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Note state
  const [noteContent, setNoteContent] = useState("");
  const [isCustomerNote, setIsCustomerNote] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      setOrder(data.order);
      setStatus(data.order.status);
    } catch (err) {
      console.error(err);
      alert("Error fetching order detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || status === order.status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteContent, is_customer_note: isCustomerNote })
      });
      if (!res.ok) throw new Error("Failed to add note");
      setNoteContent("");
      setIsCustomerNote(false);
      await fetchOrder();
    } catch (err) {
      console.error(err);
      alert("Error adding note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || isNaN(Number(refundAmount)) || Number(refundAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: refundAmount, reason: refundReason })
      });
      if (!res.ok) throw new Error("Failed to process refund");
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      alert("Error processing refund");
    } finally {
      setIsRefunding(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading order...</div>;
  if (!order) return <div className={styles.container}>Order not found.</div>;

  const totalRefunded = order.refunds?.reduce((sum: number, r) => sum + Number(r.amount), 0) || 0;

  return (
    <div className={styles.container}>
      <Link href="/crown-admin/orders" className={styles.actionLink} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        &larr; Back to Orders
      </Link>

      <div className={styles.header}>
        <div>
          <h1>Order #{order.order_number}</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Placed on {new Date(order.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })}
          </p>
        </div>
        
        <div className={styles.statusUpdate}>
          <select 
            className={styles.statusSelect}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <button 
            className={styles.btn} 
            onClick={handleStatusUpdate}
            disabled={status === order.status || isUpdatingStatus}
          >
            Update
          </button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        {/* Left Column: Order Details */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Addresses</h2>
            </div>
            <div className={styles.addressGrid}>
              <div className={styles.addressBlock}>
                <h3>Billing</h3>
                <p><strong>{order.billing_address?.firstName} {order.billing_address?.lastName}</strong></p>
                {order.billing_address?.companyName && <p>{order.billing_address.companyName}</p>}
                <p>{order.billing_address?.addressLine}</p>
                <p>{order.billing_address?.city}, {order.billing_address?.stateProvince} {order.billing_address?.zipCode}</p>
                <p>{order.billing_address?.country}</p>
                <br/>
                <p>Email: <a href={`mailto:${order.customer_email}`} className={styles.actionLink}>{order.customer_email}</a></p>
                <p>Phone: {order.billing_address?.phone}</p>
              </div>
              <div className={styles.addressBlock}>
                <h3>Shipping</h3>
                <p><strong>{order.shipping_address?.firstName} {order.shipping_address?.lastName}</strong></p>
                {order.shipping_address?.companyName && <p>{order.shipping_address.companyName}</p>}
                <p>{order.shipping_address?.addressLine}</p>
                <p>{order.shipping_address?.city}, {order.shipping_address?.stateProvince} {order.shipping_address?.zipCode}</p>
                <p>{order.shipping_address?.country}</p>
                <br/>
                <p>Method: <strong>{order.shipping_method}</strong></p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Line Items</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items?.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url || '/placeholder.png'} alt={item.product_name} className={styles.itemImage} />
                  <div className={styles.itemInfo} style={{ flex: 1 }}>
                    <h4>{item.product_name}</h4>
                    <p>SKU: {item.sku}</p>
                    {item.variation_label && <p>Variation: {item.variation_label}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0 }}>${Number(item.unit_price).toFixed(2)} x {item.quantity}</p>
                    <strong style={{ display: 'block', marginTop: '0.25rem' }}>${Number(item.line_total).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

            <table className={styles.totals}>
              <tbody>
                <tr>
                  <th>Items Subtotal:</th>
                  <td>${Number(order.subtotal_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Shipping:</th>
                  <td>${Number(order.shipping_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Tax:</th>
                  <td>${Number(order.tax_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <th className={styles.grandTotal}>Order Total:</th>
                  <td className={styles.grandTotal}>${Number(order.total_amount).toFixed(2)}</td>
                </tr>
                {totalRefunded > 0 && (
                  <tr>
                    <th style={{ color: '#ef4444' }}>Refunded:</th>
                    <td style={{ color: '#ef4444' }}>-${totalRefunded.toFixed(2)}</td>
                  </tr>
                )}
                {totalRefunded > 0 && (
                  <tr>
                    <th className={styles.grandTotal}>Net Total:</th>
                    <td className={styles.grandTotal}>${(Number(order.total_amount) - totalRefunded).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
              {order.payment_link_url && order.payment_status === 'pending' && (
                <button 
                  className={styles.btnSecondary} 
                  onClick={() => {
                    alert(`Dummy: Payment link sent to ${order.customer_email}\nLink: ${order.payment_link_url}`);
                  }}
                >
                  Send Payment Link
                </button>
              )}
              <button className={styles.btnDanger} onClick={() => setShowRefundModal(true)}>
                Refund
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Order Timeline & Notes</h2>
            </div>
            
            <div className={styles.timeline}>
              {order.activity_logs?.map((log) => {
                let logClass = styles.system;
                if (log.is_customer_note) logClass = styles.customer;
                else if (log.admin_id) logClass = styles.admin;

                return (
                  <div key={log.id} className={`${styles.timelineItem} ${logClass}`}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineAuthor}>
                        {log.admin_name || 'System'} {log.is_customer_note ? '(Note to customer)' : ''}
                      </span>
                      <span>{new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}</span>
                    </div>
                    <p className={styles.timelineNote}>{log.note}</p>
                  </div>
                );
              })}
              {order.activity_logs?.length === 0 && (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No activity logs yet.</p>
              )}
            </div>

            <div className={styles.addNote}>
              <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Add Note</h3>
              <textarea 
                placeholder="Type a note..." 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className={styles.noteActions}>
                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={isCustomerNote} 
                    onChange={(e) => setIsCustomerNote(e.target.checked)}
                  />
                  Note to customer
                </label>
                <button 
                  className={styles.btnOutline} 
                  onClick={handleAddNote}
                  disabled={isAddingNote || !noteContent.trim()}
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px'
          }}>
            <h2 style={{ marginTop: 0 }}>Issue Refund</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
              Note: This only records the refund in the database. You must still issue the refund via your payment provider (e.g., Stripe/PayPal).
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Amount ($)</label>
              <input 
                type="number" 
                step="0.01" 
                max={Number(order.total_amount) - totalRefunded}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
              <small style={{ color: '#64748b' }}>
                Max available: ${(Number(order.total_amount) - totalRefunded).toFixed(2)}
              </small>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Reason (Optional)</label>
              <input 
                type="text" 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className={styles.btnOutline} onClick={() => setShowRefundModal(false)}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleRefund} disabled={isRefunding}>Process Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
