'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiChevronRight, FiClock, FiCheck, FiX, FiRefreshCcw, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { apiUrl } from "@/lib/cart";
import styles from '../profile/profile.module.css';

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  cancellation_requested_at?: string;
  returns?: { status: string }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem('storeToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(apiUrl('/api/store/account/orders'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          toast.error('Failed to load order history.');
        }
      } catch (err) {
        toast.error('An error occurred while fetching orders.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [router]);

  const handleCancel = async (id: number) => {
    const reason = window.prompt('Please enter a reason for cancelling this order:');
    if (reason === null) return; // User clicked cancel

    try {
      const token = localStorage.getItem('storeToken');
      const res = await fetch(apiUrl(`/api/store/account/orders/${id}/cancel-request`), {
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
        setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
        // We might want to just reload the page to get the true state, 
        // but since we don't have cancellation_requested_at in this Order type yet,
        // we'll just optimistically update or reload.
        window.location.reload();
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <span style={{ color: '#856404', fontWeight: 500 }}>Pending</span>;
      case 'paid': return <span style={{ color: '#155724', fontWeight: 500 }}>Paid</span>;
      case 'refunded': return <span style={{ color: '#721c24', fontWeight: 500 }}>Refunded</span>;
      default: return <span style={{ color: '#555', fontWeight: 500 }}>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ textAlign: 'center', padding: '4rem', fontWeight: 600 }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.subtitle}>View your order history and check order status.</p>
          </div>
          <Link href="/profile" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'transparent', color: '#333', border: '1px solid #ddd', padding: '0.5rem 1rem',
            borderRadius: '4px', textDecoration: 'none', fontWeight: 600
          }}>
            <FiArrowLeft /> Back to Account
          </Link>
        </div>

        <div className={styles.form} style={{ padding: '2rem' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <FiShoppingBag size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>No Orders Found</h3>
              <p style={{ margin: 0, color: '#777' }}>You haven't placed any orders yet.</p>
              <Link href="/products" className={styles.saveBtn} style={{ display: 'inline-block', marginTop: '1.5rem', textDecoration: 'none' }}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Order ID</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Payment</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#555', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: '#555', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: '#000' }}>#{order.order_number}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#555' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{getPaymentStatusBadge(order.payment_status)}</td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>${parseFloat(order.total.toString()).toFixed(2)}</td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {(order.status === 'pending' || order.status === 'on-hold') && !order.cancellation_requested_at && (
                            <button onClick={() => handleCancel(order.id)} className={styles.btnSmall} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545' }}>
                              <FiX /> Cancel
                            </button>
                          )}
                          {(order.status === 'pending' || order.status === 'on-hold') && order.cancellation_requested_at && (
                            <span style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 600, padding: '0.2rem 0.5rem', border: '1px solid #dc3545', borderRadius: '4px', backgroundColor: '#fff' }}>Cancel Requested</span>
                          )}
                          {order.status === 'completed' && (!order.returns || !order.returns.some(r => ['requested', 'approved', 'received'].includes(r.status))) && (
                            <Link href={`/orders/${order.id}?action=return`} className={styles.btnSmall} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff', color: '#d1a054', border: '1px solid #d1a054' }}>
                              <FiRefreshCcw /> Return
                            </Link>
                          )}
                          {order.status === 'completed' && order.returns && order.returns.some(r => ['requested', 'approved', 'received'].includes(r.status)) && (
                            <span style={{ fontSize: '0.75rem', color: '#d1a054', fontWeight: 600, padding: '0.2rem 0.5rem', border: '1px solid #d1a054', borderRadius: '4px', backgroundColor: '#fff' }}>Return Requested</span>
                          )}
                          <Link href={`/orders/${order.id}`} className={styles.btnSmall} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Details <FiChevronRight />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
