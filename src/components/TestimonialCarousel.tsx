'use client';

import { useState } from 'react';
import styles from './TestimonialCarousel.module.css';

const TESTIMONIALS = [
  {
    "id": 1,
    "text": "Crown Findings has consistently delivered premium quality jewelry findings with outstanding service.",
    "author": "Daniel M., Goldsmith, Chicago"
  },
  {
    "id": 2,
    "text": "Reliable products, fast shipping, and professional support make Crown Findings our trusted supplier.",
    "author": "Emily T., Jewelry Retailer, Miami"
  },
  {
    "id": 3,
    "text": "Their craftsmanship and competitive wholesale pricing keep us coming back every time.",
    "author": "Kevin R., Manufacturer, Dallas"
  },
  {
    "id": 4,
    "text": "Crown Findings always provides excellent quality and smooth communication for bulk orders.",
    "author": "Sophia L., Designer, Seattle"
  },
  {
    "id": 5,
    "text": "One of the most dependable B2B jewelry suppliers we've worked with in the last decade.",
    "author": "Anthony P., Wholesaler, Boston"
  }
];

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? TESTIMONIALS.length - 1 : prevIndex - 1
    );
  };

  const next = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === TESTIMONIALS.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentTestimonial = TESTIMONIALS[currentIndex];

  return (
    <div className={styles.carouselContainer}>
      <button onClick={prev} className={styles.navButton} aria-label="Previous testimonial">
        &#10094;
      </button>

      <div className={styles.testimonialContent}>
        <div className={styles.quoteIconWrapper}>
          <span className={styles.quoteIcon}>&ldquo;</span>
        </div>

        <div className={styles.stars}>
          &#9733;&#9733;&#9733;&#9733;&#9733;
        </div>

        <p className={styles.testimonialText}>
          {currentTestimonial.text}
        </p>

        <p className={styles.testimonialAuthor}>
          {currentTestimonial.author}
        </p>
      </div>

      <button onClick={next} className={styles.navButton} aria-label="Next testimonial">
        &#10095;
      </button>
    </div>
  );
}
