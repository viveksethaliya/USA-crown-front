import React from 'react';
import styles from '../policy.module.css';

export const metadata = {
  title: 'Terms & Conditions | Crown Findings',
  description: 'Terms and conditions for wholesale ordering at Crown Findings.',
};

export default function TermsPage() {
  return (
    <main className={styles.main}>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Terms &amp; Conditions</h1>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Wholesale Policy</h2>
            <p className={styles.text}>
              Crown Findings operates exclusively as a B2B wholesale jewelry findings supplier. We require all customers to provide a valid resale certificate, business license, or tax ID to establish a wholesale account. We reserve the right to review and approve all account applications to ensure compliance with our wholesale requirements.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Pricing &amp; Metal Markets</h2>
            <p className={styles.text}>
              Due to the volatile nature of precious metal markets, all prices are subject to change without prior notice. The final invoice price will be determined based on the current market rate on the day of shipment. We strive to keep our pricing as competitive and accurate as possible.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Ordering Minimums</h2>
            <p className={styles.text}>
              To maintain our competitive wholesale pricing, we require a minimum order value for initial and subsequent orders. Specific minimum requirements will be communicated upon account approval. Orders falling below the minimum threshold may be subject to additional processing fees or cancellation at our discretion.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Payment Terms</h2>
            <p className={styles.text}>
              All new accounts are established on a pre-paid basis (Credit Card, Wire Transfer, or ACH). Open terms (Net 30) may be granted to established accounts upon credit approval, subject to review. Late payments will incur a finance charge of 1.5% per month.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Liability</h2>
            <p className={styles.text}>
              Crown Findings is not liable for any consequential or indirect damages resulting from the use of our products. Our liability is expressly limited to the replacement value of the defective goods.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
