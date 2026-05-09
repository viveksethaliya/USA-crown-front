'use client';

import { useState } from 'react';
import styles from './TestimonialCarousel.module.css';

const TESTIMONIALS = [
  {
    id: 1,
    text: "Reliable products, fast shipping, and professional support make Crown Findings our trusted supplier.",
    author: "Emily T., Jewelry Retailer, Miami",
    image: "/web-phts/testim/1.jpg"
  },
  {
    id: 2,
    text: "Crown Findings always provides excellent quality and smooth communication for bulk orders.",
    author: "Sophia L., Designer, Seattle",
    image: "/web-phts/testim/2.jpg"
  },
  {
    id: 3,
    text: "One of the most dependable B2B jewelry suppliers we've worked with in the last decade.",
    author: "Anthony P., Wholesaler, Boston",
    image: "/web-phts/testim/3.jpg"
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
      <div className={styles.imageColumn}>
        <div className={styles.imageOffsetBg}></div>
        <div className={styles.imageWrapper}>
          <img 
            src={currentTestimonial.image} 
            alt={currentTestimonial.author}
            className={styles.authorImage}
          />
        </div>
      </div>

      <div className={styles.contentColumn}>
        <div className={styles.quoteIcon}>&ldquo;</div>

        <p className={styles.testimonialText}>
          {currentTestimonial.text}
        </p>

        <div className={styles.authorSection}>
          <div>
            <p className={styles.testimonialAuthor}>
              {currentTestimonial.author}
            </p>
            <div className={styles.stars}>
              &#9733;&#9733;&#9733;&#9733;&#9733;
            </div>
          </div>

          <div className={styles.navigation}>
            <button onClick={prev} className={styles.navButton} aria-label="Previous testimonial">
              &#8592;
            </button>
            <button onClick={next} className={`${styles.navButton} ${styles.navButtonActive}`} aria-label="Next testimonial">
              &#8594;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
