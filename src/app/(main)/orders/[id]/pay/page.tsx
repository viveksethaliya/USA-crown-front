"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../profile/profile.module.css";

export default function OrderPaymentPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  interface Order {
    id: string;
    order_number: string;
    total_amount: string | number;
  }
  const [order, setOrder] = useState<Order | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch(`/api/account/orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) {
          setMsg({ type: "error", text: "Order not found." });
        } else {
          setOrder(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSimulatePayment = async () => {
    // This is a dummy function. In reality, it would process with Stripe.
    alert("Payment simulated successfully! (Dummy)");
    router.push(`/orders/${params.id}`);
  };

  if (loading) return <div className={styles.container}>Loading order...</div>;
  if (!order) return <div className={styles.container}>{msg.text || "Failed to load."}</div>;

  return (
    <div className={styles.container}>
      <h2>Payment for Order #{order.order_number}</h2>
      
      <div className={styles.card}>
        <h3>Order Total: ${parseFloat(order.total_amount).toFixed(2)}</h3>
        <p>This is a dummy payment page as requested.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <button onClick={handleSimulatePayment} className={styles.btnPrimary} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
            Pay Now (Simulated)
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/orders/${order.id}`}>Back to Order Details</Link>
      </div>
    </div>
  );
}
