"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_URL } from "@/lib/config";
import styles from "./SmartSearchBar.module.css";

interface ProductPreview {
  id: number;
  name: string;
  sku: string;
  image: string | null;
  price?: string;
  category?: string;
  matchScore?: number;
}

interface Suggestion {
  label: string;
  type: "correction" | "synonym" | "category" | "popular" | "ai";
  confidence?: number;
}

interface SearchResult {
  products: ProductPreview[];
  suggestions: Suggestion[];
  correctedQuery?: string;
  aiContext?: string;
}

// Lightweight Levenshtein distance for client-side fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Common metal/jewelry synonyms for client-side expansion
const SYNONYM_MAP: Record<string, string[]> = {
  gold: ["yellow gold", "white gold", "rose gold", "18k", "14k", "24k"],
  silver: ["sterling", "925", "argentium"],
  ring: ["band", "solitaire", "eternity"],
  chain: ["necklace", "link", "rope", "cable"],
  earring: ["stud", "hoop", "drop", "dangle"],
  bracelet: ["bangle", "cuff", "tennis bracelet"],
  diamond: ["brilliant", "solitaire", "cz", "cubic zirconia"],
  platinum: ["pt950", "pt900"],
};

function expandSynonyms(query: string): string[] {
  const lower = query.toLowerCase();
  const expansions: string[] = [];
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (lower.includes(key)) {
      synonyms.forEach((s) => expansions.push(lower.replace(key, s)));
    }
    if (synonyms.some((s) => lower.includes(s))) {
      expansions.push(lower.replace(lower, key));
    }
  }
  return [...new Set(expansions)].slice(0, 3);
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
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
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
      setSuggestions([]);
      setCorrectedQuery(null);
      setAiContext(null);
      setIsOpen(false);
      return;
    }

    // Cancel any in-flight requests
    abortRef.current?.abort();
    aiAbortRef.current?.abort();

    const fetchSearch = async () => {
      setIsLoading(true);
      abortRef.current = new AbortController();

      try {
        // 1. Hit our backend API for robust search fallback
        const res = await fetch(
          `${API_URL}/api/store/catalog/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`,
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
          
          const mappedProducts = (data.products || []).map((hit: any) => ({
            id: hit.id,
            name: hit.name,
            sku: hit.sku,
            image: hit.product_images?.[0]?.url || hit.image, // Depends on what backend returns for image
            price: hit.regular_price ? `$${hit.regular_price.toFixed(2)}` : undefined,
            category: hit.product_categories?.[0]?.categories?.name,
            matchScore: (hit.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || hit.sku.toLowerCase().includes(debouncedQuery.toLowerCase())) ? 10 : 5
          }));

          setProducts(mappedProducts);
          setSuggestions([]); // the AI handles suggestions below
          setCorrectedQuery(null);
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

    // 2. Simultaneously fire AI suggestion generation (non-blocking)
    const fetchAiSuggestions = async () => {
      setIsAiLoading(true);
      aiAbortRef.current = new AbortController();

      try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API}`
          },
          signal: aiAbortRef.current.signal,
          body: JSON.stringify({
            model: "llama3-8b-8192",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are a search assistant for a precious metals and B2B jewellery e-commerce store. 
Given a user's search query, respond ONLY with a valid JSON object (no markdown, no backticks) in this exact shape:
{
  "correctedQuery": "corrected spelling if needed, or null",
  "suggestions": [
    { "label": "suggestion text", "type": "correction|synonym|popular|ai" }
  ],
  "context": "one sentence describing what the user is likely looking for, or null"
}
Rules:
- suggestions: 10 items max
- Detect spelling mistakes and offer the corrected form as type "correction"
- IMPORTANT: If the query looks like a SKU or product code (e.g., contains numbers and dashes like "FR-123"), DO NOT autocorrect it. Return correctedQuery as null.
- Expand abbreviations (e.g. "18k" → "18 karat gold")
- Keep labels short (≤ 5 words)
- context: plain helpful note (e.g. "Looks like you're searching for gold chains") or null`
              },
              { role: "user", content: debouncedQuery }
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.choices?.[0]?.message?.content ?? "";
          const clean = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);

          // Merge AI suggestions, deduplicating against backend suggestions
          setSuggestions((prev) => {
            const existing = new Set(prev.map((s) => s.label.toLowerCase()));
            const newOnes = (parsed.suggestions || []).filter(
              (s: Suggestion) => !existing.has(s.label.toLowerCase())
            );
            return [...prev, ...newOnes].slice(0, 6);
          });

          if (parsed.correctedQuery) setCorrectedQuery(parsed.correctedQuery);
          if (parsed.context) setAiContext(parsed.context);

          // If the primary search found nothing, but AI offered a correction or synonym, fetch products for it!
          const fallbackTerm = parsed.correctedQuery || (parsed.suggestions && parsed.suggestions[0]?.label ? parsed.suggestions[0]?.label : null);
          if (fallbackTerm) {
            // We only need to fetch if the current products list is empty
            setProducts((currentProducts) => {
              if (currentProducts.length === 0) {
                fetch(`${API_URL}/api/store/catalog/products?search=${encodeURIComponent(fallbackTerm)}&limit=6`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  signal: aiAbortRef.current?.signal 
                })
                  .then(r => r.json())
                  .then(data => {
                    if (data.products && data.products.length > 0) {
                      const mappedProducts = data.products.map((hit: any) => ({
                        id: hit.id,
                        name: hit.name,
                        sku: hit.sku,
                        image: hit.product_images?.[0]?.url || hit.image,
                        price: hit.regular_price ? `$${hit.regular_price.toFixed(2)}` : undefined,
                        category: hit.product_categories?.[0]?.categories?.name,
                        matchScore: (hit.name.toLowerCase().includes(fallbackTerm.toLowerCase()) || hit.sku.toLowerCase().includes(fallbackTerm.toLowerCase())) ? 10 : 5
                      }));
                      setProducts(mappedProducts);
                    }
                  })
                  .catch(() => {});
              }
              return currentProducts;
            });
          }

        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error("AI suggestions failed", err);
        }
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchSearch();
    fetchAiSuggestions();

    return () => {
      abortRef.current?.abort();
      aiAbortRef.current?.abort();
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

  const handleSuggestionClick = (label: string) => {
    setQuery(label);
    navigate(label);
  };

  const handleCorrectionClick = () => {
    if (!correctedQuery) return;
    setQuery(correctedQuery);
    navigate(correctedQuery);
  };

  const isEmpty = products.length === 0 && suggestions.length === 0;
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
            if (query.trim() ? products.length > 0 || suggestions.length > 0 : recentSearches.length > 0) {
              setIsOpen(true);
            }
          }}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        <button type="submit" className={styles.searchButton} aria-label="Submit search">
          SEARCH
        </button>
      </form>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-label="Search suggestions">

          {/* Spelling correction banner */}
          {correctedQuery && correctedQuery.toLowerCase() !== query.toLowerCase() && (
            <div className={styles.correctionBanner}>
              <span className={styles.correctionText}>
                Did you mean{" "}
                <button
                  type="button"
                  className={styles.correctionBtn}
                  onClick={handleCorrectionClick}
                >
                  {correctedQuery}
                </button>
                ?
              </span>
            </div>
          )}

          {/* AI context hint */}
          {aiContext && (
            <div className={styles.aiContextBanner}>
              <span className={styles.aiIcon} aria-hidden="true">✦</span>
              <span className={styles.aiContextText}>{aiContext}</span>
              {isAiLoading && <span className={styles.aiSpinner} aria-label="AI thinking" />}
            </div>
          )}

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
                      onClick={() => handleSuggestionClick(s)}
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
              ) : isEmpty && !isAiLoading ? (
                <div className={styles.noResults}>
                  No matches found for &ldquo;{query}&rdquo;
                  {suggestions.length === 0 && (
                    <p className={styles.noResultsHint}>Try a different spelling or browse all products</p>
                  )}
                </div>
              ) : (
                <div className={styles.dropdownContent}>

                  {/* Left: Suggestions */}
                  {(suggestions.length > 0 || isAiLoading) && (
                    <div className={styles.suggestionsArea}>
                      <h4 className={styles.dropdownSectionTitle}>
                        Suggestions
                        {isAiLoading && (
                          <span className={styles.aiPill} aria-label="AI-powered">AI</span>
                        )}
                      </h4>
                      <ul className={styles.suggestionList}>
                        {suggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className={`${styles.suggestionBtn} ${s.type === "correction" ? styles.suggestionCorrection : ""}`}
                              onClick={() => handleSuggestionClick(s.label)}
                            >
                              <span className={styles.suggestionIcon} aria-hidden="true">
                                {s.type === "correction" ? "✎" :
                                  s.type === "synonym" ? "↔" :
                                    s.type === "ai" ? "✦" : "🔍"}
                              </span>
                              {s.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Right: Products */}
                  {products.length > 0 && (
                    <div className={styles.productsArea}>
                      <h4 className={styles.dropdownSectionTitle}>Products</h4>
                      <div className={styles.productList}>
                        {products.slice(0, 6).map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.id}`}
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
                                <span className={styles.productSku}>SKU: {p.sku}</span>
                                {p.category && (
                                  <span className={styles.productCategory}>{p.category}</span>
                                )}
                              </span>
                              {p.price && (
                                <span className={styles.productPrice}>{p.price}</span>
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
function HighlightMatch({ text, query }: { text: string; query: string }) {
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
