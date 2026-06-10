"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../admin.module.css";
import { FiArrowLeft } from "react-icons/fi";

export default function TaxesSettingsPage() {
  const [taxClasses, setTaxClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings/tax-classes')
      .then(res => res.json())
      .then(data => setTaxClasses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/crown-admin" className={styles.backBtn}><FiArrowLeft /></Link>
          <h1>Tax Settings</h1>
        </div>
        <button className={styles.submitBtn}>Add Tax Class</button>
      </div>

      <div className={styles.card}>
        <p>Dummy tax information. You can configure tax classes and rates here later.</p>
        
        {taxClasses && taxClasses.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Description</th>
                <th>Rates Defined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxClasses.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.description}</td>
                  <td>{c.tax_rates?.length || 0}</td>
                  <td><button className={styles.btnSecondary}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tax classes configured yet.</p>
        )}
      </div>
    </div>
  );
}
