"use client";

import { useState } from "react";
import styles from "../policy.module.css";

const faqs = [
  {
    question: "Same-Day Shipping for Jewelry Findings",
    answer: "For urgent jewelry findings orders, our same-day shipping cutoff is 2:00 PM EST. This ensures prompt delivery of your essential jewelry components."
  },
  {
    question: "Managing Back Orders in Jewelry Supplies",
    answer: "We closely monitor and communicate about back-ordered jewelry supplies, ensuring you’re informed and can confirm the need for these items."
  },
  {
    question: "Minimum Order Requirement for Jewelry Findings Shipping",
    answer: "A minimum order of $25.00 is required for shipping jewelry findings, ensuring cost-effectiveness and efficiency in order fulfillment."
  },
  {
    question: "Calculating Shipping Charges for Jewelry Components",
    answer: "Shipping charges for your jewelry components include postage, insurance, and handling, ensuring safe and secure delivery of your orders."
  },
  {
    question: "Account Status and Shipping Jewelry Supplies",
    answer: "Orders for jewelry supplies may be affected if there are outstanding balances on your account, aligning with our commitment to responsible business practices."
  },
  {
    question: "Updating Incorrect Shipping Information for Jewelry Orders",
    answer: "Accuracy in shipping information is crucial. Contact us immediately for corrections to ensure seamless delivery of your jewelry findings."
  }
];

export default function ShippingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Initially open the first item

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.accordion}>
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className={styles.accordionItem}>
            <button
              type="button"
              className={`${styles.accordionHeader} ${isOpen ? styles.open : ""}`}
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
            >
              {faq.question}
            </button>
            <div className={`${styles.accordionContentWrapper} ${isOpen ? styles.open : ""}`}>
              <div className={styles.accordionContentInner}>
                <div className={styles.accordionContent}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
