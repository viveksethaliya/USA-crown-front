import React from 'react';
import styles from '../policy.module.css';

export const metadata = {
  title: 'Returns & Exchanges | Crown Findings',
  description: 'Return and exchange policy for Crown Findings.',
};

export default function ReturnsPage() {
  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Returns &amp; Exchanges</h1>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Return Policy</h2>
            <p className={styles.text}>
              We stand behind the quality of our findings. If you are not completely satisfied with your purchase, returns may be accepted within 14 days of the invoice date. All items must be returned in their original, unused condition and original packaging.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Non-Returnable Items</h2>
            <p className={styles.text}>
              Please note that certain items cannot be returned or exchanged:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Custom orders or special manufactured items.</li>
              <li className={styles.listItem}>Chain cut to order.</li>
              <li className={styles.listItem}>Items that have been modified, soldered, or damaged by the customer.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Restocking Fees</h2>
            <p className={styles.text}>
              A 15% restocking fee will apply to all returns that are not the result of our error (e.g., defective merchandise or shipping errors). Shipping charges are non-refundable.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Return Process</h2>
            <p className={styles.text}>
              To initiate a return, please contact our customer service team at 212-764-6470 to obtain a Return Merchandise Authorization (RMA) number. Packages without an RMA number clearly marked on the outside may be refused and returned to the sender.
            </p>
            <p className={styles.text}>
              Customers are responsible for secure packaging and insured return shipping. We are not responsible for returned items lost or damaged in transit.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
