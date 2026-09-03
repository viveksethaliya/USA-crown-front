import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { generateSEOTitle } from '@/lib/generateProductMeta';
import ProductCard from '@/components/products/ProductCard';
import styles from '@/app/(main)/products/products.module.css'; // Reuse existing product grid styles

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata(props: PageProps) {
  try {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;
    const res = await fetch(apiUrl(`/api/store/catalog/categories/${params.slug}?page=${pageNum}`), {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) return { title: 'Category Not Found' };
    
    const data = await res.json();
    const category = data.category;
    
    const title = category.seo_title || generateSEOTitle(category.name);
    let description = category.seo_description || category.description;
    if (!description) {
      description = `Browse our selection of ${category.name} at Crown Findings.`;
    }

    // Determine robots directive
    // Rule: apply both < 3 products and single-child parent
    // The parent is the head term with search volume ("Bracelets"). A single
    // child is a temporary data state — add a second child later and the parent
    // becomes a legitimate hub. Noindexing the child is reversible; noindexing
    // the parent costs it its position.
    // So if isOnlyChild is true (this category is a child, and the only child of its parent), we noindex.
    let robots = 'index, follow';
    if (data.totalProducts < 3 || data.isOnlyChild) {
      robots = 'noindex, follow';
    }

    // Canonical URL handles pagination
    const canonicalBase = `/categories/${params.slug}`;
    const canonical = pageNum > 1 ? `${canonicalBase}?page=${pageNum}` : canonicalBase;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots,
      openGraph: {
        title,
        description,
        images: category.seo_og_image ? [{ url: category.seo_og_image }] : [],
      }
    };
  } catch (error) {
    return { title: 'Category Not Found' };
  }
}

export default async function CategoryPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const res = await fetch(apiUrl(`/api/store/catalog/categories/${params.slug}?page=${pageNum}`), {
    next: { revalidate: 60 }
  });

  if (res.status === 404) {
    notFound();
  }
  
  if (!res.ok) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Failed to load category.</div>;
  }

  const data = await res.json();
  const { category, children, parent, products, totalProducts, totalPages } = data;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <main className={styles.main} style={{ width: '100%', margin: '0 auto', maxWidth: '1200px', padding: '2rem' }}>
          
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
            <Link href="/" style={{ color: '#0066cc', textDecoration: 'none' }}>Home</Link>
            {' > '}
            {parent && (
              <>
                <Link href={`/categories/${parent.slug}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                  {parent.name}
                </Link>
                {' > '}
              </>
            )}
            <span aria-current="page" style={{ color: '#333', fontWeight: 500 }}>
              {category.name}
            </span>
          </nav>

          {/* Header */}
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
            {category.name}
          </h1>

          {/* Subcategories (if any) */}
          {children && children.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {children.map((child: { name: string, slug: string }) => (
                <Link 
                  key={child.slug} 
                  href={`/categories/${child.slug}`}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '0.9rem',
                    background: '#f9f9f9'
                  }}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {/* Top Bar for product count */}
          <div className={styles.topBar} style={{ marginBottom: '1.5rem' }}>
            <span className={styles.resultCount}>
              Showing {products.length} of {totalProducts} results
            </span>
          </div>

          {/* Product Grid */}
          <div className={styles.productGrid}>
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                isAuthenticated={false} // Server component fallback, real value hydrated on client if needed, or static
                userPermission={null}
              />
            ))}
          </div>

          {/* Server-Rendered Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem' }}>
              {pageNum > 1 && (
                <Link 
                  href={`/categories/${params.slug}${pageNum - 1 > 1 ? `?page=${pageNum - 1}` : ''}`}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', textDecoration: 'none', color: '#333' }}
                >
                  Previous
                </Link>
              )}
              <span style={{ margin: '0 1rem', fontSize: '0.95rem' }}>
                Page {pageNum} of {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link 
                  href={`/categories/${params.slug}?page=${pageNum + 1}`}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', textDecoration: 'none', color: '#333' }}
                >
                  Next
                </Link>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
