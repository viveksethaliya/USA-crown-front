"use client";

import { useState } from "react";
import styles from "./contact.module.css";

const faqs = [
  {
    question: "What Are Jewelry Findings?",
    answer: "“Jewelry findings” are the parts that are used to make a piece of jewelry. They are the building blocks. It was coined during the early ages of jewelry making when experts found small metal scraps around their workshops and added them to their pieces. Jewelry findings are small pieces made from a broad range of materials forged into various shapes, sizes, styles, and connectors."
  },
  {
    question: "What Are the Dimensions of the Items I Want?",
    answer: "You can check the item’s description on our online shop or call us for individual merchandise details such as dimensions or measurements."
  },
  {
    question: "Can I Order Jewelry Findings Online?",
    answer: "Visit our site and sign up for a free wholesale partner account to see our prices and place orders online. You will acquire access to more of our features and place an online order."
  },
  {
    question: "Can I Get a Bulk Order Discount?",
    answer: <>We recommend purchasing in bulk to enable you to save money through our quantity discounts that include:<br />6-piece discount: 5%.<br />72-piece discount: 10%.<br />250-piece discount: 15%.<br />The discounts do not apply to certain items.</>
  },
  {
    question: "Can I Return an Item?",
    answer: "We have a 30-day return policy on all items except mill products and special orders. You should return the item within 30 days of shopping, accompanied by the item’s invoice. You also have to make sure that the item is new and in the same condition it was when you bought it."
  }
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(4); // Initially open the last item (index 4)

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
