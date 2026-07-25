"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiUrl } from "@/lib/api";
import { useSessionStatus } from "@/lib/auth";
import styles from "./SmartSearchBar.module.css";

interface ProductPreview {
  id: number;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  priceRange?: string | null;
  matchScore?: number;
  category?: string | null;
}



// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated } = useSessionStatus();

  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 280);

  // Load recent searches from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch { }
  }, []);

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Main search + AI suggestions
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      setIsOpen(false);
      return;
    }

    // Cancel any in-flight requests
    abortRef.current?.abort();

    const fetchSearch = async () => {
      setIsLoading(true);
      abortRef.current = new AbortController();

      try {
        const res = await fetch(
          apiUrl(`/api/store/catalog/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: abortRef.current.signal
          }
        );

        if (res.ok) {
          const data = await res.json();
          // The backend returns results already sorted by relevance score
          setProducts(data.products || []);
          setIsOpen(true);
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error("Search failed", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedQuery]);

  const saveRecentSearch = useCallback((term: string) => {
    try {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      sessionStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch { }
  }, [recentSearches]);

  const navigate = useCallback(
    (term: string) => {
      setIsOpen(false);
      saveRecentSearch(term);
      router.push(`/products?search=${encodeURIComponent(term.trim())}`);
    },
    [router, saveRecentSearch]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(query);
  };

  const isEmpty = products.length === 0;
  const showRecents = !query.trim() && recentSearches.length > 0;

  return (
    <div className={styles.searchContainer} ref={wrapperRef}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by SKU, name, or material…"
          className={styles.searchInput}
          value={query}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() ? products.length > 0 : recentSearches.length > 0) {
              setIsOpen(true);
            }
          }}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        <button type="submit" className={styles.searchButton} aria-label="Submit search">
          <span className={styles.searchBtnText}>SEARCH</span>
          <span className={styles.searchBtnIcon}>🔍</span>
        </button>
      </form>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-label="Search suggestions">



          {/* Recent searches (when input is empty) */}
          {showRecents && (
            <div className={styles.recentArea}>
              <h4 className={styles.dropdownSectionTitle}>Recent searches</h4>
              <ul className={styles.suggestionList}>
                {recentSearches.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.suggestionBtn}
                      onClick={() => navigate(s)}
                    >
                      <span className={styles.suggestionIcon} aria-hidden="true">🕐</span>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main results */}
          {query.trim() && (
            <>
              {isLoading ? (
                <div className={styles.loading}>
                  <span className={styles.loadingDots} aria-label="Searching">
                    <span /><span /><span />
                  </span>
                  Searching…
                </div>
              ) : isEmpty ? (
                <div className={styles.noResults}>
                  No matches found for &ldquo;{query}&rdquo;
                  <p className={styles.noResultsHint}>Try a different spelling or browse all products</p>
                </div>
              ) : (
                <div className={styles.dropdownContent}>

                  {/* Right: Products */}
                  {products.length > 0 && (
                    <div className={styles.productsArea}>
                      <h4 className={styles.dropdownSectionTitle}>Products</h4>
                      <div className={styles.productList}>
                        {products.slice(0, 6).map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${encodeURIComponent(p.slug)}`}
                            className={styles.productItem}
                            onClick={() => {
                              setIsOpen(false);
                              saveRecentSearch(query);
                            }}
                          >
                            <div className={styles.productImageWrapper}>
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  width={44}
                                  height={44}
                                  className={styles.productImage}
                                  unoptimized
                                />
                              ) : (
                                <div className={styles.imagePlaceholder} aria-hidden="true" />
                              )}
                            </div>
                            <div className={styles.productDetails}>
                              <span className={styles.productName}>
                                <HighlightMatch text={p.name} query={query} />
                              </span>
                              <span className={styles.productMeta}>
                                <span className={styles.productSku}>SKU: <HighlightMatch text={p.sku} query={query} /></span>
                                {p.category && (
                                  <>
                                    <span style={{ margin: '0 4px', color: '#ccc' }}>•</span>
                                    <span style={{ color: '#888' }}>{p.category}</span>
                                  </>
                                )}
                              </span>
                              {isAuthenticated && p.priceRange && (
                                <span className={styles.productPrice}>{p.priceRange}</span>
                              )}
                            </div>
                            {p.matchScore !== undefined && p.matchScore >= 9 && (
                              <span className={styles.exactBadge} aria-label="Exact match">Exact</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className={styles.dropdownFooter}>
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={() => handleSubmit()}
            >
              View all results for &ldquo;{query || "…"}&rdquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Highlights matching substrings in product names
function HighlightMatch({ text, query }: { text?: string | null; query: string }) {
  if (!text) return null;
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: "rgba(202,163,30,0.25)", color: "inherit", borderRadius: "2px" }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
