"use client";

import { useState } from "react";
import styles from "../policy.module.css";

const faqs = [
  {
    question: "What is Crown Findings’ Return Policy?",
    answer: "Crown Findings allows returns within 30 days of receipt. Customers must contact for an RMA for eligible new, unworn, and unmodified items. Returns without an RMA are not accepted."
  },
  {
    question: "How Do I Request a Return Merchandise Authorization (RMA)?",
    answer: "Contact Crown Findings within 30 days of receiving your item to request an RMA. Follow the instructions provided by our customer service team."
  },
  {
    question: "Are There Any Items Excluded from Returns?",
    answer: "Special Order merchandise, Cut Chains, Beads, Rondelles, Wire, Solders, Mill Products, and used or damaged merchandise are not eligible for return or refund."
  },
  {
    question: "What is the Time Frame for Processing Refunds?",
    answer: "Refunds are issued within 7 to 14 days after receiving the authorized return. The processing time may vary depending on your financial institution."
  },
  {
    question: "How Does the Exchange Process Work at Crown Findings?",
    answer: "The exchange process is similar to returns. Request an RMA specifying the exchange requirement and follow the provided instructions."
  },
  {
    question: "Can I Return Custom or Special Order Items?",
    answer: "Custom or special order items are not eligible for returns or exchanges."
  },
  {
    question: "Who Covers the Shipping Costs for Returns?",
    answer: "The customer is typically responsible for return shipping costs. Check with Crown Findings for specific details."
  }
];

export default function ReturnsFaqAccordion() {
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
