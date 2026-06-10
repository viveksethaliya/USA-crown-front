"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../admin.module.css";
import { FiArrowLeft } from "react-icons/fi";

export default function ShippingSettingsPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings/shipping-zones')
      .then(res => res.json())
      .then(data => setZones(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/crown-admin" className={styles.backBtn}><FiArrowLeft /></Link>
          <h1>Shipping Settings</h1>
        </div>
        <button className={styles.submitBtn}>Add Shipping Zone</button>
      </div>

      <div className={styles.card}>
        <p>Dummy shipment information. You can add zones and rates here later.</p>
        
        {zones && zones.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Regions</th>
                <th>Methods</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z: any) => (
                <tr key={z.id}>
                  <td>{z.name}</td>
                  <td>{z.regions?.join(', ')}</td>
                  <td>{z.shipping_methods?.length || 0}</td>
                  <td><button className={styles.btnSecondary}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No shipping zones configured yet.</p>
        )}
      </div>
    </div>
  );
}
