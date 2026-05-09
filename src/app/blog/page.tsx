import React from 'react';
import Link from 'next/link';

import styles from './blog.module.css';

export const metadata = {
  title: 'Blog | Crown Findings',
  description: 'News, insights, and updates from Crown Findings.',
};

const blogPosts = [
  {
    id: 'the-essential-guide-to-jewelry-findings',
    title: 'The Essential Guide to Jewelry Findings: What Every Jeweler Needs',
    excerpt: 'Discover the core components that make up fine jewelry. From clasps to ear wires, understanding your findings is crucial for quality craftsmanship.',
    date: 'October 12, 2023',
    image: 'https://images.unsplash.com/photo-1599643478514-411c7f558155?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'understanding-gold-karats',
    title: 'Understanding Gold Karats in Wholesale Jewelry',
    excerpt: 'A comprehensive breakdown of 14K, 18K, and 24K gold. Learn which karat is best for your specific jewelry designs and target market.',
    date: 'September 28, 2023',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'spring-ring-vs-lobster-clasp',
    title: 'Spring Ring vs. Lobster Clasp: Making the Right Choice',
    excerpt: 'Two of the most popular clasps in the industry. We compare their durability, ease of use, and aesthetic appeal to help you choose the right one.',
    date: 'September 15, 2023',
    image: 'https://images.unsplash.com/photo-1573408301145-b98c4af01004?q=80&w=800&auto=format&fit=crop'
  }
];

export default function BlogPage() {
  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>The Crown Blog</h1>
        </div>
      </section>

      <section className={styles.container}>
        <div className={styles.blogGrid}>
          {blogPosts.map((post) => (
            <Link href={`/blog/${post.id}`} key={post.id} className={styles.blogCard}>
              {/* Using standard img to avoid next/image external domain config issues for sample data */}
              <img src={post.image} alt={post.title} className={styles.blogImage} />
              <div className={styles.blogCardContent}>
                <span className={styles.blogDate}>{post.date}</span>
                <h2 className={styles.blogCardTitle}>{post.title}</h2>
                <p className={styles.blogCardExcerpt}>{post.excerpt}</p>
                <span className={styles.readMore}>Read Article &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
