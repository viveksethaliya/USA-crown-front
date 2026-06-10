"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./SmartSearchBar.module.css";

interface ProductPreview {
  id: number;
  name: string;
  sku: string;
  image: string | null;
}

interface Suggestion {
  label: string;
  type: string;
}

export default function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setProducts([]);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSearch = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search/smart?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setSuggestions(data.suggestions || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Smart search failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (label: string) => {
    setQuery(label);
    setIsOpen(false);
    router.push(`/products?search=${encodeURIComponent(label)}`);
  };

  return (
    <div className={styles.searchContainer} ref={wrapperRef}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search products by SKU, name, or category..."
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (products.length > 0 || suggestions.length > 0) setIsOpen(true);
          }}
        />
        <button type="submit" className={styles.searchButton}>
          SEARCH
        </button>
      </form>

      {isOpen && (query.trim() !== "") && (
        <div className={styles.dropdown}>
          {isLoading ? (
            <div className={styles.loading}>Searching...</div>
          ) : (products.length === 0 && suggestions.length === 0) ? (
            <div className={styles.noResults}>No matches found.</div>
          ) : (
            <div className={styles.dropdownContent}>
              
              {/* Left Column: Suggestions */}
              {suggestions.length > 0 && (
                <div className={styles.suggestionsArea}>
                  <h4 className={styles.dropdownSectionTitle}>Suggestions</h4>
                  <ul className={styles.suggestionList}>
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button 
                          className={styles.suggestionBtn}
                          onClick={() => handleSuggestionClick(s.label)}
                          type="button"
                        >
                          <span className={styles.suggestionIcon}>🔍</span>
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Right Column: Products */}
              {products.length > 0 && (
                <div className={styles.productsArea}>
                  <h4 className={styles.dropdownSectionTitle}>Products</h4>
                  <div className={styles.productList}>
                    {products.map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/products/${p.id}`} 
                        className={styles.productItem}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className={styles.productImageWrapper}>
                          {p.image ? (
                            <Image 
                              src={p.image} 
                              alt={p.name} 
                              width={40} 
                              height={40} 
                              className={styles.productImage}
                              unoptimized
                            />
                          ) : (
                            <div className={styles.imagePlaceholder} />
                          )}
                        </div>
                        <div className={styles.productDetails}>
                          <span className={styles.productName}>{p.name}</span>
                          <span className={styles.productSku}>SKU: {p.sku}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
          
          <div className={styles.dropdownFooter}>
            <button 
              type="button" 
              className={styles.viewAllBtn}
              onClick={() => handleSubmit()}
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
