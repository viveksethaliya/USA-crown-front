import React from 'react';
import styles from '../policy.module.css';

export const metadata = {
  title: 'Shipping Policy | Crown Findings',
  description: 'Shipping rates, methods, and delivery policies for Crown Findings.',
};

export default function ShippingPage() {
  return (
    <main className={styles.main}>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Shipping Policy</h1>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Order Processing</h2>
            <p className={styles.text}>
              We strive to process and ship all in-stock orders placed before 2:00 PM EST on the same business day. Orders placed after 2:00 PM EST, on weekends, or during holidays will be processed on the following business day. Custom orders and special requests will require additional processing time, which will be communicated at the time of order placement.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Shipping Methods</h2>
            <p className={styles.text}>
              We offer a variety of shipping methods through major carriers (FedEx, UPS, USPS) to meet your delivery requirements:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Next Day Air</li>
              <li className={styles.listItem}>2nd Day Air</li>
              <li className={styles.listItem}>Ground Shipping</li>
              <li className={styles.listItem}>Registered Mail (for high-value shipments)</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Shipping Rates &amp; Insurance</h2>
            <p className={styles.text}>
              Shipping rates are calculated based on the weight, dimensions, destination, and selected shipping method. All shipments are fully insured for the invoice value of the goods. The cost of insurance is included in the final shipping charge.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Signature Requirement</h2>
            <p className={styles.text}>
              Due to the high value of our products, a direct signature is required upon delivery for all shipments. Please ensure someone is available at the shipping address to receive and sign for the package.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>International Shipping</h2>
            <p className={styles.text}>
              We do accommodate international orders. International shipments may be subject to customs duties, taxes, and import fees determined by the destination country. The recipient is solely responsible for paying these additional charges. We cannot declare international shipments as gifts or alter the invoice value to bypass customs fees.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
