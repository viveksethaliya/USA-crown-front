"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import styles from "../orders.module.css";
import { toast } from "react-hot-toast";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  interface OrderItem {
    id: string; // Changed to string (uuid) based on schema
    product_id?: string;
    variation_id?: string;
    image_url: string | null;
    product_name: string;
    sku: string;
    variation_label: string | null;
    unit_price: string | number;
    regular_price?: string | number | null;
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
    id: string;
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
    customer_name: string;
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

  // === NEW: Edit Mode State ===
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Order>>({});
  const [isSaving, setIsSaving] = useState(false);

  // === NEW: Add Product Modal State ===
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      setOrder(data.order);
      setStatus(data.order.status);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching order detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle Edit Toggle
  const toggleEditMode = () => {
    if (!isEditing && order) {
      // Initialize edit data with current order values
      setEditData({
        customer_email: order.customer_email || '',
        customer_name: order.customer_name || '',
        shipping_method: order.shipping_method || '',
        billing_address: order.billing_address || { firstName:'', lastName:'', addressLine:'', city:'', stateProvince:'', zipCode:'', country:'', phone:'', companyName:'' },
        shipping_address: order.shipping_address || { firstName:'', lastName:'', addressLine:'', city:'', stateProvince:'', zipCode:'', country:'', phone:'', companyName:'' },
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle Save Edits (Address/Details)
  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      });
      if (!res.ok) throw new Error("Failed to update order");
      setIsEditing(false);
      toast.success("Order details updated");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error saving edits");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Item Quantity Update
  const handleUpdateItemQty = async (itemId: string, newQty: number, unitPrice: number | string) => {
    if (newQty < 1) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty, unit_price: unitPrice })
      });
      if (!res.ok) throw new Error("Failed to update item");
      toast.success("Item quantity updated");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error updating item");
    }
  };

  // Handle Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}/items/${itemId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove item");
      toast.success("Item removed");
      await fetchOrder();
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
          // Use public smart search
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

  // Handle Add Product to Order
  const handleAddProduct = async (product: any) => {
    setIsAddingProduct(true);
    try {
      // Basic add (without variations for simplicity in UI, relies on defaults or main product)
      const res = await fetch(`/api/admin/orders/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          sku: product.sku || 'N/A',
          product_name: product.name,
          image_url: product.image,
          quantity: 1,
          unit_price: 0 // Dummy price for newly added items from generic search
        })
      });
      if (!res.ok) throw new Error("Failed to add product");
      setShowAddProductModal(false);
      setSearchQuery("");
      toast.success("Product added to order");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error adding product");
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel order");
      toast.success("Order cancelled");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error cancelling order");
    }
  };

  // Handle Send Payment Link
  const handleSendPaymentLink = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/send-payment-link`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send payment link");
      const data = await res.json();
      toast.success(`Payment link generated and sent!\nLink: ${data.payment_link}`, { duration: 8000 });
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error sending payment link");
    }
  };

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
      toast.success("Status updated");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
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
      toast.success("Note added");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error adding note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || isNaN(Number(refundAmount)) || Number(refundAmount) <= 0) {
      toast.error("Please enter a valid amount");
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
      toast.success("Refund processed successfully");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error processing refund");
    } finally {
      setIsRefunding(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading order...</div>;
  if (!order) return <div className={styles.container}>Order not found.</div>;

  const totalRefunded = order.refunds?.reduce((sum: number, r) => sum + Number(r.amount), 0) || 0;

  const handleAddressChange = (type: 'billing' | 'shipping', field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [`${type}_address`]: {
        ...prev[`${type}_address`],
        [field]: value
      }
    }));
  };

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
        
        <div className={styles.statusUpdate} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {order.status !== 'cancelled' && (
            <button className={styles.btnDanger} onClick={handleCancelOrder} style={{ marginRight: '1rem' }}>
              Cancel Order
            </button>
          )}

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
            Update Status
          </button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        {/* Left Column: Order Details */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Addresses & Customer Details</h2>
              <button className={isEditing ? styles.btnOutline : styles.btn} onClick={toggleEditMode}>
                {isEditing ? 'Cancel Edit' : 'Edit Details'}
              </button>
            </div>
            
            {isEditing ? (
              <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display:'block', fontSize:'0.9rem', marginBottom:'0.25rem' }}>Email</label>
                  <input type="text" value={editData.customer_email || ''} onChange={e => setEditData({...editData, customer_email: e.target.value})} style={{ width:'100%', padding:'0.5rem' }} />
                </div>
                <div className={styles.addressGrid}>
                  {/* Billing Edit */}
                  <div className={styles.addressBlock}>
                    <h3>Edit Billing</h3>
                    <input placeholder="First Name" value={editData.billing_address?.firstName || ''} onChange={e => handleAddressChange('billing', 'firstName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Last Name" value={editData.billing_address?.lastName || ''} onChange={e => handleAddressChange('billing', 'lastName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Company" value={editData.billing_address?.companyName || ''} onChange={e => handleAddressChange('billing', 'companyName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Address Line" value={editData.billing_address?.addressLine || ''} onChange={e => handleAddressChange('billing', 'addressLine', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="City" value={editData.billing_address?.city || ''} onChange={e => handleAddressChange('billing', 'city', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="State/Prov" value={editData.billing_address?.stateProvince || ''} onChange={e => handleAddressChange('billing', 'stateProvince', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Zip Code" value={editData.billing_address?.zipCode || ''} onChange={e => handleAddressChange('billing', 'zipCode', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Country" value={editData.billing_address?.country || ''} onChange={e => handleAddressChange('billing', 'country', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Phone" value={editData.billing_address?.phone || ''} onChange={e => handleAddressChange('billing', 'phone', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                  </div>
                  {/* Shipping Edit */}
                  <div className={styles.addressBlock}>
                    <h3>Edit Shipping</h3>
                    <input placeholder="First Name" value={editData.shipping_address?.firstName || ''} onChange={e => handleAddressChange('shipping', 'firstName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Last Name" value={editData.shipping_address?.lastName || ''} onChange={e => handleAddressChange('shipping', 'lastName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Company" value={editData.shipping_address?.companyName || ''} onChange={e => handleAddressChange('shipping', 'companyName', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Address Line" value={editData.shipping_address?.addressLine || ''} onChange={e => handleAddressChange('shipping', 'addressLine', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="City" value={editData.shipping_address?.city || ''} onChange={e => handleAddressChange('shipping', 'city', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="State/Prov" value={editData.shipping_address?.stateProvince || ''} onChange={e => handleAddressChange('shipping', 'stateProvince', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Zip Code" value={editData.shipping_address?.zipCode || ''} onChange={e => handleAddressChange('shipping', 'zipCode', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Country" value={editData.shipping_address?.country || ''} onChange={e => handleAddressChange('shipping', 'country', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                    <input placeholder="Phone" value={editData.shipping_address?.phone || ''} onChange={e => handleAddressChange('shipping', 'phone', e.target.value)} style={{ width:'100%', padding:'0.25rem', marginBottom:'0.25rem' }} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button className={styles.btn} onClick={handleSaveEdits} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Details'}</button>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Line Items</h2>
              {isEditing && (
                <button className={styles.btnOutline} onClick={() => setShowAddProductModal(true)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                  + Add Product
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items?.map((item) => (
                <div key={item.id} className={styles.itemRow} style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url || '/placeholder.png'} alt={item.product_name} className={styles.itemImage} />
                  <div className={styles.itemInfo} style={{ flex: 1 }}>
                    <h4>{item.product_name}</h4>
                    <p>SKU: {item.sku}</p>
                    {item.variation_label && <p>Variation: {item.variation_label}</p>}
                  </div>
                  
                  {isEditing ? (
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <button className={styles.btnDanger} style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveItem(item.id)}>Remove</button>
                      <div>
                        Qty: <input 
                          type="number" 
                          min="1" 
                          defaultValue={item.quantity} 
                          style={{ width: '50px', padding: '0.25rem' }}
                          onBlur={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value), item.unit_price)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0 }}>
                        {item.regular_price && Number(item.regular_price) > Number(item.unit_price) && (
                          <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '6px' }}>
                            ${Number(item.regular_price).toFixed(2)}
                          </span>
                        )}
                        ${Number(item.unit_price).toFixed(2)} x {item.quantity}
                      </p>
                      <strong style={{ display: 'block', marginTop: '0.25rem' }}>${Number(item.line_total).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              ))}
              {order.items?.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No items in this order.</p>}
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
              <button 
                className={styles.btnSecondary} 
                onClick={handleSendPaymentLink}
              >
                Send Payment Reminder Link
              </button>
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <h2 style={{ marginTop: 0 }}>Add Product to Order</h2>
            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', minHeight: '200px' }}>
              {isSearching ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Searching...</p>
              ) : searchResults.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {searchResults.map(product => (
                    <li key={product.id} style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {product.image && <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{product.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>SKU: {product.sku || 'N/A'}</span>
                        </div>
                      </div>
                      <button className={styles.btnOutline} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleAddProduct(product)} disabled={isAddingProduct}>
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searchQuery.trim().length >= 2 ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No products found.</p>
              ) : (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Type to search products...</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className={styles.btnOutline} onClick={() => { setShowAddProductModal(false); setSearchQuery(""); }}>Close</button>
            </div>
          </div>
        </div>
      )}

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
              Note: This only records the refund in the database. You must still issue the refund via your payment provider.
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
