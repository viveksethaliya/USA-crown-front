"use client";

import { useEffect, useState } from "react";
import styles from "../../profile/profile.module.css";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    try {
      const res = await fetch(apiUrl("/api/account/payment-methods"));
      if (res.ok) {
        setMethods(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMethods();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    try {
      const res = await fetch(apiUrl(`/api/account/payment-methods/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Payment method deleted.");
        setMethods(prev => prev.filter(m => m.id !== id));
      } else {
        toast.error("Failed to delete payment method.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete payment method.");
    }
  };

  return (
    <div>
      <h2>Saved Payment Methods</h2>

      {loading ? (
        <p>Loading...</p>
      ) : methods.length === 0 ? (
        <p>No saved payment methods found.</p>
      ) : (
        <div className={styles.addressList}>
          {methods.map(m => (
            <div key={m.id} className={styles.addressCard}>
              <h4>{m.brand.toUpperCase()} ending in {m.last4}</h4>
              <p>Expires: {m.exp_month.toString().padStart(2, '0')} / {m.exp_year}</p>
              {m.is_default && <span style={{ color: 'green', fontSize: '0.9rem', fontWeight: 'bold' }}>Default Method</span>}
              <div className={styles.addressActions}>
                <button onClick={() => handleDelete(m.id)} className={styles.btnSecondary} style={{color: 'red'}}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
