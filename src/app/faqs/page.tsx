import React from 'react';
import styles from '../policy.module.css';

export const metadata = {
  title: 'FAQs | Crown Findings',
  description: 'Frequently Asked Questions about Crown Findings wholesale orders, shipping, and products.',
};

export default function FaqsPage() {
  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Account &amp; Ordering</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>Do I need a business license to order?</h3>
              <p className={styles.text}>Yes, Crown Findings is strictly a B2B wholesale supplier. We require a valid resale certificate or tax ID to establish an account and process orders.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>What is your minimum order requirement?</h3>
              <p className={styles.text}>Our minimum order value varies depending on the account type and product categories. Please contact your account representative for specific details regarding your minimums.</p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>How do fluctuating gold prices affect my order?</h3>
              <p className={styles.text}>All precious metal products are priced based on the current market rate on the day of shipment. The final invoice will reflect the active market price, not necessarily the price at the time the order was placed.</p>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Shipping &amp; Returns</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>When will my order ship?</h3>
              <p className={styles.text}>In-stock items ordered before 2:00 PM EST typically ship the same business day. Custom orders or items requiring manufacturing will have a specific lead time communicated during the ordering process.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>What is your return policy?</h3>
              <p className={styles.text}>We accept returns on most standard items within 14 days of the invoice date. Items must be in their original, unused condition. Custom manufactured items and custom-cut chains are strictly non-returnable. A 15% restocking fee may apply.</p>
            </div>
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.heading}>Products &amp; Quality</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>Are your findings nickel-free?</h3>
              <p className={styles.text}>Yes, the vast majority of our solid gold and platinum findings are nickel-free and hypoallergenic. If you have specific alloy requirements, please specify them when placing your order.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-inkblue)', marginBottom: '0.5rem' }}>Can you manufacture custom findings?</h3>
              <p className={styles.text}>Absolutely. We have extensive manufacturing capabilities. If you have a specific design or modification required for a production run, please contact us to discuss minimum quantities and tooling costs.</p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
