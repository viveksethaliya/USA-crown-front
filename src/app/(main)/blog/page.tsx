"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from './blog.module.css';
import { apiUrl } from '@/lib/api';
import ScrollReveal from "@/components/animations/ScrollReveal";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  created_at: string;
  featured_image: string | null;
  category?: string | null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchPosts = useCallback(async (search: string, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      // Using the new store pages endpoint
      const res = await fetch(apiUrl(`/api/store/pages?page_type=blog&limit=50`), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
      }
    } catch {
      // keep existing posts
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPosts('', '');

    // Fetch categories
    async function fetchCategories() {
      // Categories not yet implemented on new pages table, leaving empty for now.
      setCategories([]);
    }
    fetchCategories();
  }, [fetchPosts]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchPosts(value, activeCategory);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleCategoryClick = (cat: string) => {
    const newCat = activeCategory === cat ? '' : cat;
    setActiveCategory(newCat);
    fetchPosts(searchQuery, newCat);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('');
    fetchPosts('', '');
  };

  const hasFilters = searchQuery || activeCategory;

  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <ScrollReveal animation="fade-up" className={styles.heroContent}>
          <h1 className={styles.heroTitle}>The Crown Blog</h1>
        </ScrollReveal>
      </section>

      <section className={styles.blogLayout}>
        {/* Left Sidebar — fixed */}
        <aside className={styles.blogSidebar}>
          <div className={styles.sidebarInner}>
            {/* Search */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Search</h3>
              <div className={styles.searchBox}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className={styles.searchClear}
                    onClick={() => handleSearchChange('')}
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Categories</h3>
                <ul className={styles.categoryList}>
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        className={`${styles.categoryBtn} ${activeCategory === cat ? styles.categoryBtnActive : ''}`}
                        onClick={() => handleCategoryClick(cat)}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Filters */}
            {hasFilters && (
              <div className={styles.sidebarSection}>
                <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                  <FiX /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content — scrollable blog list */}
        <div className={styles.blogMain}>
          {loading ? (
            <div className={styles.blogLoading}>Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className={styles.blogEmpty}>
              <h3>No articles found</h3>
              <p>Try adjusting your search or category filter.</p>
              {hasFilters && (
                <button className={styles.clearFiltersBtn} onClick={clearFilters} style={{ marginTop: '1rem' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {hasFilters && (
                <p className={styles.resultCount}>
                  Showing {posts.length} article{posts.length !== 1 ? 's' : ''}
                  {activeCategory && <> in <strong>{activeCategory}</strong></>}
                  {searchQuery && <> matching &quot;<strong>{searchQuery}</strong>&quot;</>}
                </p>
              )}
              <div className={styles.blogGrid}>
                {posts.map((post, index) => {
                  const dateStr = new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  });
                  return (
                    <ScrollReveal key={post.slug} animation="fade-up" delay={(index % 3) * 100 as 0|100|200} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Link href={`/blog/${post.slug}`} className={styles.blogCard} style={{ width: '100%' }}>
                        {post.featured_image && (
                          <img src={post.featured_image} alt={post.title} className={styles.blogImage} />
                        )}
                        <div className={styles.blogCardContent}>
                          {post.category && (
                            <span className={styles.blogCategory}>{post.category}</span>
                          )}
                          <span className={styles.blogDate}>{dateStr}</span>
                          <h2 className={styles.blogCardTitle}>{post.title}</h2>
                          <p className={styles.blogCardExcerpt}>{post.excerpt}</p>
                          <span className={styles.readMore}>Read Article &rarr;</span>
                        </div>
                      </Link>
                    </ScrollReveal>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
