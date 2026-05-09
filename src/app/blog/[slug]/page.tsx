import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../blog.module.css';

// Mock database for the sample blog posts
const blogData = {
  'the-essential-guide-to-jewelry-findings': {
    title: 'The Essential Guide to Jewelry Findings: What Every Jeweler Needs',
    date: 'October 12, 2023',
    image: 'https://images.unsplash.com/photo-1599643478514-411c7f558155?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p>Whether you are a seasoned bench jeweler or just starting to design your own line, understanding the vast world of jewelry findings is absolutely essential. Findings are the building blocks of jewelry making—the functional components that hold pieces together, provide wearability, and often add that final touch of professionalism.</p>
      
      <h2>What Exactly Are Findings?</h2>
      <p>In the jewelry trade, "findings" refers to the components that go into the making of jewelry, excluding the gemstones and the primary metal stock (like sheet or wire). They are the clasps, the jump rings, the ear wires, the settings, and the bails.</p>
      
      <h2>Essential Components Every Studio Needs</h2>
      <p>While the specific findings you need will depend heavily on the type of jewelry you create, there are several staples that almost every jeweler should keep in stock:</p>
      
      <ul>
        <li><strong>Jump Rings:</strong> The most fundamental finding. Used to connect everything from clasps to charms. Having a variety of sizes and gauges in solid gold is crucial.</li>
        <li><strong>Clasps:</strong> Lobster claws and spring rings are the most common. A secure clasp is the difference between a piece that lasts a lifetime and one that is quickly lost.</li>
        <li><strong>Ear Nuts (Friction Backs):</strong> If you sell earrings, you will constantly need replacement backs. Quality friction backs ensure the earring stays securely on the ear.</li>
        <li><strong>Bails:</strong> Used to attach a pendant to a necklace. They come in simple rings, intricate pinch bails, and elegant hidden bails.</li>
      </ul>

      <h2>Quality Matters</h2>
      <p>When it comes to fine jewelry, the quality of your findings reflects the quality of your brand. A beautifully set diamond pendant can be ruined by a cheap, flimsy clasp. At Crown Findings, we pride ourselves on providing high-quality, durable findings manufactured to precise standards, ensuring your creations stand the test of time.</p>
      
      <p>Investing in solid gold and platinum findings not only adds value to your finished pieces but also provides peace of mind for both you and your customers.</p>
    `
  },
  'understanding-gold-karats': {
    title: 'Understanding Gold Karats in Wholesale Jewelry',
    date: 'September 28, 2023',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p>Choosing the right gold karat is a critical decision in jewelry manufacturing and design. The karat value not only dictates the cost of the material but also its color, durability, and target market.</p>
      <h2>The Basics of Karatage</h2>
      <p>Pure gold is 24 karats (24K). However, 24K gold is typically too soft for daily wear. To increase durability, gold is alloyed with other metals such as copper, silver, zinc, or palladium. The resulting mixture is what we refer to when we discuss 14K or 18K gold.</p>
      <h2>14K vs. 18K: What's the Difference?</h2>
      <p><strong>14K Gold</strong> is 58.3% pure gold. It offers excellent durability and is highly resistant to scratching, making it the most popular choice for everyday jewelry, including engagement rings and wedding bands in the US market.</p>
      <p><strong>18K Gold</strong> is 75% pure gold. It features a richer, deeper yellow color than 14K and is generally considered more luxurious. While slightly softer than 14K, it is still perfectly suitable for high-end fine jewelry.</p>
    `
  },
  'spring-ring-vs-lobster-clasp': {
    title: 'Spring Ring vs. Lobster Clasp: Making the Right Choice',
    date: 'September 15, 2023',
    image: 'https://images.unsplash.com/photo-1573408301145-b98c4af01004?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p>When designing a necklace or bracelet, the clasp is often an afterthought. However, the functionality and security of the clasp are paramount to the wearer's experience.</p>
      <h2>The Spring Ring</h2>
      <p>A classic, economical choice. Spring rings are circular clasps with a spring mechanism. They are lightweight and inexpensive, making them ideal for delicate chains and budget-conscious designs. However, they can be difficult to manipulate for individuals with limited dexterity.</p>
      <h2>The Lobster Clasp</h2>
      <p>Named for its resemblance to a lobster's claw, this clasp is generally considered superior in terms of security and ease of use. It contains a heavier spring mechanism and a more robust structure. While slightly more expensive, lobster clasps add a premium feel to any piece of jewelry.</p>
      <h2>Which Should You Choose?</h2>
      <p>For fine jewelry where security is the top priority, the lobster clasp is almost always the recommended choice. For lightweight, mass-market items, the spring ring provides a cost-effective solution.</p>
    `
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = blogData[resolvedParams.slug as keyof typeof blogData];

  if (!post) return { title: 'Post Not Found' };
  return { title: `${post.title} | Crown Findings` };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = blogData[resolvedParams.slug as keyof typeof blogData];

  if (!post) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <section className={styles.postContainer}>
        <Link href="/blog" className={styles.backLink}>&larr; Back to Blog</Link>

        <div className={styles.postHeader}>
          <span className={styles.postDate}>{post.date}</span>
          <h1 className={styles.postTitle}>{post.title}</h1>
        </div>

        <img src={post.image} alt={post.title} className={styles.postHeroImage} />

        <div
          className={styles.postContent}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>
    </main>
  );
}
