import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../blog.module.css';
import { apiUrl } from '@/lib/api';


interface BlogDetail {
  title: string;
  content: string;
  cover_image: string | null;
  published_at: string;
  excerpt: string;
  meta_description: string | null;
  author: string;
  tags: string[];
}

interface RelatedPost {
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  published_at?: string;
}

interface RelatedData {
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
  similar: RelatedPost[];
}

async function getBlogPost(slug: string): Promise<BlogDetail | null> {
  try {
    const res = await fetch(apiUrl(`/api/blogs/${slug}`), {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog || null;
  } catch {
    return null;
  }
}

async function getRelatedPosts(slug: string): Promise<RelatedData | null> {
  try {
    const res = await fetch(apiUrl(`/api/blogs/${slug}/related`), {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);

  if (post) {
    return {
      title: `${post.title} | Crown Findings`,
      description: post.meta_description || post.excerpt || ''
    };
  }

  return { title: 'Post Not Found' };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);
  const related = await getRelatedPosts(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const dateStr = new Date(post.published_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <main className={styles.main}>
      <section className={styles.postContainer}>
        <Link href="/blog" className={styles.backLink}>&larr; Back to Blog</Link>

          <div className={styles.postHeader}>
            <span className={styles.postDate}>{dateStr}</span>
            <h1 className={styles.postTitle}>{post.title}</h1>
          </div>

          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} className={styles.postHeroImage} />
          )}

          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Prev / Next Navigation */}
          {related && (related.prev || related.next) && (
            <nav className={styles.postNav}>
              <div className={styles.postNavItem}>
                {related.prev && (
                  <Link href={`/blog/${related.prev.slug}`} className={styles.postNavLink}>
                    <span className={styles.postNavLabel}>&larr; Previous</span>
                    <span className={styles.postNavTitle}>{related.prev.title}</span>
                  </Link>
                )}
              </div>
              <div className={`${styles.postNavItem} ${styles.postNavItemNext}`}>
                {related.next && (
                  <Link href={`/blog/${related.next.slug}`} className={styles.postNavLink}>
                    <span className={styles.postNavLabel}>Next &rarr;</span>
                    <span className={styles.postNavTitle}>{related.next.title}</span>
                  </Link>
                )}
              </div>
            </nav>
          )}

          {/* Similar Posts */}
          {related && related.similar.length > 0 && (
            <section className={styles.similarSection}>
              <h2 className={styles.similarTitle}>You May Also Like</h2>
              <div className={styles.similarGrid}>
                {related.similar.map((s) => (
                  <Link key={s.slug} href={`/blog/${s.slug}`} className={styles.similarCard}>
                    {s.cover_image && (
                      <img src={s.cover_image} alt={s.title} className={styles.similarImage} />
                    )}
                    <div className={styles.similarContent}>
                      <h3 className={styles.similarCardTitle}>{s.title}</h3>
                      {s.excerpt && <p className={styles.similarExcerpt}>{s.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
    </main>
  );
}
