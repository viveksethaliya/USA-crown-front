"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./orders.module.css";
import { toast } from "react-hot-toast";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk actions
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });
      if (status) params.append("status", status);
      if (paymentStatus) params.append("payment_status", paymentStatus);
      if (dateFrom) params.append("date_from", new Date(dateFrom).toISOString());
      if (dateTo) {
        // Set to end of day
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        params.append("date_to", endOfDay.toISOString());
      }
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      
      setOrders(data.orders || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
      setSelectedOrders(new Set()); // Reset selections on page change
    } catch (err) {
      console.error(err);
      toast.error("Error fetching orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay slightly to debounce search
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paymentStatus, dateFrom, dateTo, search]);

  const getStatusClass = (st: string) => {
    return styles[`status-${st}`] || styles.statusBadge;
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length && orders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const toggleSelectOrder = (id: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) return;
    
    if (!confirm(`Are you sure you want to change status to "${bulkAction}" for ${selectedOrders.size} order(s)?`)) return;

    setIsBulkUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/bulk-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderIds: Array.from(selectedOrders),
          status: bulkAction
        })
      });
      if (!res.ok) throw new Error("Failed to process bulk action");
      
      setBulkAction("");
      toast.success("Bulk action applied successfully");
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Error applying bulk action");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Orders</h1>
      </div>

      <div className={styles.filters}>
        <input 
          type="text" 
          placeholder="Search Order # or Customer..." 
          className={styles.searchInput}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select 
          className={styles.statusSelect}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select 
          className={styles.statusSelect}
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Payments</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Payment Paid</option>
          <option value="failed">Payment Failed</option>
        </select>
        <input 
          type="date" 
          className={styles.dateInput}
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          title="Start Date"
        />
        <input 
          type="date" 
          className={styles.dateInput}
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          title="End Date"
        />
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.bulkActions}>
          <select 
            className={styles.statusSelect}
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={selectedOrders.size === 0 || isBulkUpdating}
          >
            <option value="">Bulk Actions</option>
            <option value="pending">Change status to pending</option>
            <option value="processing">Change status to processing</option>
            <option value="on-hold">Change status to on-hold</option>
            <option value="completed">Change status to completed</option>
            <option value="cancelled">Change status to cancelled</option>
          </select>
          <button 
            className={styles.btnOutline} 
            onClick={handleBulkAction}
            disabled={!bulkAction || selectedOrders.size === 0 || isBulkUpdating}
          >
            Apply
          </button>
          <span style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: 'auto' }}>
            {selectedOrders.size} selected
          </span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input 
                  type="checkbox" 
                  checked={orders.length > 0 && selectedOrders.size === orders.length}
                  onChange={toggleSelectAll}
                  disabled={orders.length === 0}
                />
              </th>
              <th>Order</th>
              <th>Date</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center'}}>No orders found.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.checkboxCell}>
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td>
                    <Link href={`/crown-admin/orders/${order.id}`} className={styles.actionLink}>
                      #{order.order_number}
                    </Link>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div>{order.customer_name}</div>
                    <small style={{ color: "#64748b" }}>{order.customer_email}</small>
                  </td>
                  <td>${Number(order.total_amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <span style={{ margin: '0 0.5rem', alignSelf: 'center', fontSize: '0.9rem' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className={styles.pageBtn} 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
