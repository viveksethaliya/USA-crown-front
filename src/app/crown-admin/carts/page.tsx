"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiEye, FiSearch, FiShoppingCart } from "react-icons/fi";
import styles from "./carts.module.css";
import { apiUrl } from "@/lib/cart";

interface CartSummary {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  totalItems: number;
  totalValue: number;
  users: {
    email: string;
    full_name: string;
    company_name?: string;
  } | null;
}

export default function CartsPage() {
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/carts`), {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setCarts(data.carts || []);
      } else {
        console.error("Carts API error:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Failed to fetch carts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCarts = search
    ? carts.filter(c =>
        (c.users?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.users?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.users?.company_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : carts;

  return (
    <div>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}><FiShoppingCart /> Customer Carts</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.tableControls}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>Loading carts...</div>
        ) : filteredCarts.length === 0 ? (
          <div className={styles.emptyState}>No active customer carts found.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Value</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarts.map(cart => (
                  <tr key={cart.id}>
                    <td>
                      <div><strong>{cart.users?.full_name || 'Unknown'}</strong></div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{cart.users?.email}</div>
                      {cart.users?.company_name && <div style={{ fontSize: '0.85rem', color: '#666' }}>{cart.users.company_name}</div>}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${cart.status === 'active' ? styles.statusSuccess : styles.statusWarning}`}>
                        {cart.status}
                      </span>
                    </td>
                    <td>{cart.totalItems}</td>
                    <td>${(cart.totalValue || 0).toFixed(2)}</td>
                    <td>{new Date(cart.updated_at).toLocaleString()}</td>
                    <td>
                      <Link href={`/crown-admin/carts/${cart.id}`} className={styles.actionBtn}>
                        <FiEye /> View/Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
