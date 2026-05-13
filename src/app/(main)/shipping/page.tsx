import React from 'react';
import styles from '../policy.module.css';
import ShippingFaqAccordion from './ShippingFaqAccordion';

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
          <div className={styles.twoColumnLayout}>
            <div className={styles.leftColumn}>
              <img
                src="/web-phts/shippment.jpg"
                alt="Shipping Information"
                className={styles.imageFull}
              />
            </div>

            <div className={styles.rightColumn}>
              <div className={styles.section}>
                <h2 className={styles.heading}>Shipping Timelines:</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Orders placed by 2:00 PM EST are generally shipped the same day or within 24 hours.</li>
                  <li className={styles.listItem}>Items not in stock or ordered in large quantities may be back-ordered. We’ll contact you upon receipt to confirm if the merchandise is still needed.</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Minimum Orders and Shipping Charges:</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>A minimum order value of $25.00 is required for shipment.</li>
                  <li className={styles.listItem}>Shipping charges include postage, insurance, and handling fees.</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Account and Shipping:</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Shipments may be withheld for accounts with past-due balances.</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Accuracy of Shipping Information:</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Please ensure all shipping details are correct at checkout. Crown Findings is not responsible for errors or delays due to incorrect information.</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Delivery Times:</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Custom order volumes can affect delivery times. We’ll notify you of any delays and make every effort to minimize them.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.faqSection}>
        <div className={styles.faqContainer}>
          <h2 className={styles.faqTitle}>Jewelry Findings Shipping FAQ’s</h2>
          <ShippingFaqAccordion />
        </div>
      </section>
    </main>
  );
}
