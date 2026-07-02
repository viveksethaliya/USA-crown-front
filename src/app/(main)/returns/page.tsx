import React from 'react';
import styles from '../policy.module.css';
import ReturnsFaqAccordion from './ReturnsFaqAccordion';

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
          <div className={styles.twoColumnLayout}>
            <div className={styles.leftColumn}>
              <img
                src="/web-phts/return.jpg"
                alt="Returns and Exchanges"
                className={styles.imageFull}
              />
            </div>

            <div className={styles.rightColumn}>
              <div className={styles.section}>
                <h2 className={styles.heading}>Return Merchandise Authorization (RMA):</h2>
                <p className={styles.text}>
                  Contact us within 30 days of receipt for an RMA for new, unworn, unmodified items. Returns without an RMA will not be accepted.
                </p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Return Process:</h2>
                <p className={styles.text}>
                  Include a copy of the original invoice with your return. Returns must be postmarked within 30 days of receiving the RMA.
                </p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Refunds:</h2>
                <p className={styles.text}>
                  Once we accept an authorized return with an RMA, a refund to the original payment method will be processed within 7 to 14 days. The time frame for the refund to reflect in your account may vary based on your financial institution. Note that shipping charges are not refundable.
                </p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Exclusions:</h2>
                <p className={styles.text}>
                  Special Order merchandise, Cut Chains, Beads, Rondelles, Wire, Solders, Mill Products, and used or damaged merchandise are not eligible for return or refund.
                </p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Exchange Policy:</h2>
                <p className={styles.text}>
                  Follow the same procedure as returns. Please specify the exchange requirement when requesting an RMA.
                </p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.heading}>Additional Information</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Condition of Returned Items:</strong> Please return items in their original state, without any modifications or signs of wear.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Customer Support:</strong> For any queries regarding returns or exchanges, please contact (212)-764-6470
                  </li>
                </ul>
              </div>

              <div className={styles.section}>
                <p className={styles.text}>
                  <em>Note: We reserve the right to modify our returns and exchanges policy. For the most current information, please refer to this page.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.faqContainer}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <ReturnsFaqAccordion />
        </div>
      </section>
    </main>
  );
}
