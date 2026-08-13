import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../blog.module.css';
import { apiUrl } from '@/lib/api';


interface BlogDetail {
  title: string;
  content: string;
  featured_image: string | null;
  created_at: string;
  excerpt: string;
  seo_description: string | null;
  seo_title: string | null;
  seo_keywords: string | null;
  seo_og_image: string | null;
  users?: { first_name: string; last_name: string } | null;
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
    const res = await fetch(apiUrl(`/api/store/pages/${encodeURIComponent(slug)}`), {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

async function getRelatedPosts(slug: string): Promise<RelatedData | null> {
  try {
    const res = await fetch(apiUrl(`/api/blogs/${slug}/related`), {
      next: { revalidate: 60 }
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
    const title = post.seo_title || `${post.title} | Crown Findings Blog`;
    const description = post.seo_description || post.excerpt || `Read ${post.title} on the Crown Findings Blog.`;
    const imageUrl = post.seo_og_image || post.featured_image || undefined;

    return {
      title,
      description,
      keywords: post.seo_keywords || undefined,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: post.created_at,
        images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      }
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

  const dateStr = new Date(post.created_at).toLocaleDateString('en-US', {
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

          {post.featured_image && (
            <img src={post.featured_image} alt={post.title} className={styles.postHeroImage} fetchPriority="high" />
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
