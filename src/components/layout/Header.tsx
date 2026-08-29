'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl, cartFetch } from '@/lib/cart';
import styles from './Header.module.css';
import SmartSearchBar from './SmartSearchBar';
import { FiUser, FiMapPin, FiLogOut, FiBriefcase, FiUsers, FiMenu, FiChevronDown } from 'react-icons/fi';


interface NavCollection {
  id?: string;
  name: string;
  slug: string;
}

interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  level?: number;
}

interface Product {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  priceRange?: string | null;
}

const CATEGORY_ORDER = [
  "DISC",
  "SETTINGS",
  "EARRINGS",
  "PENDANTS",
  "CLASPS",
  "CHAINS",
  "BEADS",
  "PINS",
  "SOLDER",
  "RELIGIOUS ITEMS",
  "RINGS",
  "LETTERS",
  "NUMBERS",
  "MENS",
  "COIN FRAMES",
  "WATCH BEZELS FOR DIAMONDS",
  "MILL PRODUCTS"
];

function sortCategories(aTitle: string, bTitle: string) {
  const aIdx = CATEGORY_ORDER.indexOf(aTitle.toUpperCase());
  const bIdx = CATEGORY_ORDER.indexOf(bTitle.toUpperCase());

  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  return aTitle.localeCompare(bTitle);
}

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('findings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navCollections, setNavCollections] = useState<NavCollection[] | null>(null);
  const [megaMenuData, setMegaMenuData] = useState<Record<string, { title: string, slug: string, links: { label: string, href: string }[] }> | null>(null);
  const [mobileViewCategory, setMobileViewCategory] = useState<string | null>(null);

  const [recommendedCache, setRecommendedCache] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch recommended products when a category is hovered
  useEffect(() => {
    if (!isMegaMenuOpen || !activeCategory || !megaMenuData) return;
    if (recommendedCache[activeCategory]) return; // already fetched

    const catData = megaMenuData[activeCategory];
    if (!catData) return;

    async function fetchProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch(apiUrl(`/api/store/catalog/products?category=${catData.slug}&limit=24`));
        if (res.ok) {
          const data = await res.json();
          setRecommendedCache(prev => ({
            ...prev,
            [activeCategory]: data.products || []
          }));
        }
      } catch (err) {
        console.error("Failed to fetch recommended products", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [activeCategory, isMegaMenuOpen, megaMenuData, recommendedCache]);

  const getGroupedLinks = (links: { label: string, href: string }[]) => {
    const groups: Record<string, { label: string, href: string }[]> = {};
    links.forEach(link => {
      const firstLetter = link.label.charAt(0).toUpperCase();
      const bucket = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[bucket]) groups[bucket] = [];
      groups[bucket].push(link);
    });
    return groups;
  };

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCategoryHover = (catKey: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(catKey);
    }, 150);
  };

  const bottomTierRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserSession | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const router = useRouter();

  const [metalPrices, setMetalPrices] = useState<{ gold: number | null, silver: number | null, platinum: number | null }>({
    gold: null,
    silver: null,
    platinum: null
  });

  // Close mega menu on outside click and Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bottomTierRef.current && !bottomTierRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMegaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll and focus mega menu on open
  useEffect(() => {
    if (isMegaMenuOpen) {
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMegaMenuOpen, isMobileMenuOpen]);

  // Check user session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const token = localStorage.getItem('storeToken');
        if (!token) {
          setUser(null);
          return;
        }

        const res = await fetch(apiUrl('/api/store/auth/me'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          } else {
            setUser(null);
            localStorage.removeItem('storeToken');
          }
        } else {
          setUser(null);
          localStorage.removeItem('storeToken');
        }
      } catch {
        // silently fail
      }
    }

    async function loadCartCount() {
      try {
        const token = localStorage.getItem('storeToken');
        if (!token) {
          setCartCount(0);
          return;
        }

        const res = await cartFetch('/api/store/cart');

        if (res.ok) {
          const data = await res.json();
          setCartCount(data.cart?.itemCount || 0);
        }
      } catch {
        // silently fail
      }
    }

    checkSession();
    loadCartCount();

    // Listen for auth changes (from login/logout on other components)
    const handleAuthChange = () => {
      checkSession();
      loadCartCount();
    };
    const handleCartUpdated = () => loadCartCount();
    window.addEventListener('user-auth-change', handleAuthChange);
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      window.removeEventListener('user-auth-change', handleAuthChange);
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    // Fetch dynamic collections for navbar
    async function fetchCollections() {
      try {
        const res = await fetch(apiUrl('/api/store/catalog/collections'));
        if (res.ok) {
          const data = await res.json();
          if (data.collections && data.collections.length > 0) {
            setNavCollections(data.collections);
          }
        }
      } catch {
        // Keep fallback data
      }
    }


    // Fetch product categories for mega menu
    async function fetchCategories() {
      try {
        const res = await fetch(apiUrl('/api/store/catalog/categories'));
        if (res.ok) {
          const data = await res.json();
          if (data.categories && data.categories.length > 0) {
            const dynamicMenu: Record<string, { title: string, slug: string, links: { label: string, href: string }[] }> = {};
            data.categories.forEach((cat: { name: string; slug: string; children?: { name: string; slug: string }[] }) => {
              const key = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
              dynamicMenu[key] = {
                title: cat.name.toUpperCase(),
                slug: cat.slug || key,
                links: (cat.children || []).map((child: { name: string; slug: string }) => ({
                  label: child.name,
                  href: `/products?category=${child.slug}`
                }))
              };
            });
            if (Object.keys(dynamicMenu).length > 0) {
              setMegaMenuData(dynamicMenu);
              setActiveCategory(Object.keys(dynamicMenu)[0]);
            }
          }
        }
      } catch {
        // Keep fallback mega menu
      }
    }

    async function fetchPrices() {
      try {
        const res = await fetch(apiUrl('/api/store/catalog/metal-prices'));

        if (res.ok) {
          const data = await res.json();

          // Handle our backend format: { prices: { gold_14k, silver_925, platinum } }
          if (data.prices) {
            setMetalPrices({
              gold: data.prices.gold_14k || 0,
              silver: data.prices.silver_925 || 0,
              platinum: data.prices.platinum || 0
            });
            // Handle external metals API format: { XAU: { price }, XAG: { price }, XPT: { price } }
          } else if (data.XAU && data.XAG && data.XPT) {
            setMetalPrices({
              gold: data.XAU.price,
              silver: data.XAG.price,
              platinum: data.XPT.price
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch metal prices:', error);
      }
    }


    fetchCollections();
    fetchCategories();
    fetchPrices();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('storeToken');
      setUser(null);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event('user-auth-change'));
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className={styles.header}>
      {/* Top Tier: Member Links (White) */}
      <div className={styles.topTier}>
        <div className={`${styles.container} ${styles.topTierContainer}`}>
          <div className={styles.topContact}>
            <span>📞 (212)-764-6470</span>
            <span className={styles.topDivider} />
            <span>Monday – Friday 9:00 AM – 5:00 PM</span>
          </div>
          <div className={styles.topLinks}>
            <Link href="/resale-certificate" className={styles.topLink}>Generate Resale Certificate</Link>
            <span className={styles.topDivider} />
            <a href="/NYS-ResaleCertificate-ST120.pdf" className={styles.topLink} target="_blank" rel="noopener noreferrer">Download Resale Certificate</a>
            <span className={styles.topDivider} />
            <Link href="/" className={styles.topLink}>Home</Link>
            <span className={styles.topDivider} />
            <Link href="/contact" className={styles.topLink}>Contact Us</Link>
            <span className={styles.topDivider} />
            <Link href="/about" className={styles.topLink}>About Us</Link>
            <span className={styles.topDivider} />
            <Link href="/catalog" className={styles.topLink}>Catalog</Link>
            <span className={styles.topDivider} />
            <Link href="/cart" className={styles.topLink}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
            <span className={styles.topDivider} />

            {user ? (
              /* ── Logged-in state ── */
              <div className={styles.userArea}>
                <button
                  className={styles.userBtn}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className={styles.userAvatar}>
                    {user.firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.userName}>
                    {user.firstName} {user.lastName}
                  </span>
                  <span className={styles.userCaret}>▾</span>
                </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}>
                      <strong>{user.firstName} {user.lastName}</strong>
                      {user.companyName && user.companyName !== 'N/A' && (
                        <span>{user.companyName}</span>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser /> My Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className={styles.userDropdownLogout}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest state ── */
              <>
                <Link href="/login" className={styles.topLink}>Sign In</Link>
                <Link href="/apply" className={styles.topLink}>Register</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Tier: Logo, Search, Prices (Inkblue) */}
      <div className={styles.middleTier}>
        <div className={styles.container}>
          <div className={styles.middleContent}>
            {/* Logo */}
            <div className={styles.logoContainer}>
              <Link href="/" className={styles.logo}>
                <Image src="/logo.png" alt="Crown Findings Logo" width={200} height={50} priority className={styles.logoImage} unoptimized />
              </Link>
            </div>

            {/* Global Search */}
            <div className={styles.searchWrapper}>
              <SmartSearchBar />
            </div>

            {/* Live Metal Prices */}
            <div className={styles.metalPrices}>
              {[
                { label: 'GOLD', value: metalPrices.gold },
                { label: 'SILVER', value: metalPrices.silver },
                { label: 'PLATINUM', value: metalPrices.platinum },
              ].map(metal => {
                let displayStr = '...';
                if (metal.value === null) {
                  displayStr = '...';
                } else if (metal.value === 0) {
                  displayStr = user ? 'Call for Pricing' : 'Login for Pricing';
                } else {
                  displayStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metal.value);
                }

                return (
                  <div key={metal.label} className={styles.metalItem}>
                    <span className={styles.metalName}>{metal.label}</span>
                    <span className={styles.metalPrice}>{displayStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tier: Navigation & Mega Menu (Gold) */}
      <div className={styles.bottomTier} ref={bottomTierRef}>
        <div className={styles.container}>
          {/* Mobile Hamburger Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          <button
            className={styles.mobileAllProductsBtn}
            onClick={() => setIsMegaMenuOpen(prev => !prev)}
          >
            ALL PRODUCTS {isMegaMenuOpen ? '▴' : '▾'}
          </button>

          <nav className={styles.nav}>
            {/* Desktop Nav */}
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${styles.navLinkBtn}`}
                  aria-expanded={isMegaMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="mega-menu-dropdown"
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  disabled={!megaMenuData}
                  style={{ opacity: !megaMenuData ? 0.6 : 1, cursor: !megaMenuData ? 'wait' : 'pointer' }}
                >
                  <FiMenu className={styles.navMenuIcon} />
                  <span>ALL PRODUCTS</span>
                  <FiChevronDown className={`${styles.navChevronIcon} ${isMegaMenuOpen ? styles.rotated : ''}`} />
                </button>

                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && megaMenuData && (
                  <div className={styles.megaMenuDropdown} id="mega-menu-dropdown" role="menu">
                    <div className={styles.megaMenuInner}>

                      {/* Left Side: Categories */}
                      <div className={styles.categorySidebar} role="menu">
                        {Object.keys(megaMenuData)
                          .sort((a, b) => sortCategories(megaMenuData[a].title, megaMenuData[b].title))
                          .map((catKey) => (
                            <Link
                              href={`/products?category=${megaMenuData[catKey].slug}`}
                              key={catKey}
                              role="menuitem"
                              className={`${styles.categoryItem} ${activeCategory === catKey ? styles.active : ''}`}
                              onMouseEnter={() => handleCategoryHover(catKey)}
                              onFocus={() => handleCategoryHover(catKey)}
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              <span className={styles.catName}>{megaMenuData[catKey].title}</span>
                              <span className={styles.chevron}>›</span>
                            </Link>
                          ))}
                      </div>

                      {/* Right Side: Mega Panel */}
                      <div className={styles.megaPanel}>
                        {activeCategory && megaMenuData[activeCategory] && (
                          <>
                            {/* Tier 1: Sub Categories (Middle Column) */}
                            <div className={styles.subCategorySection}>
                              <h4 className={styles.sectionTitle}>Sub-Categories</h4>
                              {megaMenuData[activeCategory].links.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>No sub-categories available.</p>
                              ) : (
                                <div className={styles.subCategoryGrid}>
                                  {[...megaMenuData[activeCategory].links]
                                    .sort((a, b) => a.label.localeCompare(b.label))
                                    .map((link, idx) => (
                                      <Link href={link.href} key={idx} className={styles.subCategoryLink} onClick={() => setIsMegaMenuOpen(false)}>
                                        {link.label}
                                      </Link>
                                    ))}
                                </div>
                              )}
                              {/* Catalog Access Link */}
                              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                <Link
                                  href={`/products?category=${megaMenuData[activeCategory].slug}`}
                                  className={styles.viewFullCatalogBtn}
                                  onClick={() => setIsMegaMenuOpen(false)}
                                >
                                  View Full Catalog →
                                </Link>
                              </div>
                            </div>

                            {/* Tier 2: Recommended Products (Right Column) */}
                            <div className={styles.recommendedSection}>
                              <h4 className={styles.sectionTitle}>
                                Recommended
                              </h4>

                              {loadingProducts && (!recommendedCache[activeCategory] || recommendedCache[activeCategory].length === 0) ? (
                                <div style={{ color: '#888' }}>Finding recommendations...</div>
                              ) : (!recommendedCache[activeCategory] || recommendedCache[activeCategory].length === 0) ? (
                                <div style={{ color: '#888' }}>No products found.</div>
                              ) : (
                                <div className={styles.recommendedGrid}>
                                  {recommendedCache[activeCategory].map(prod => (
                                    <Link href={`/products/${encodeURIComponent(prod.slug)}`} key={prod.id} style={{ textDecoration: 'none' }} onClick={() => setIsMegaMenuOpen(false)}>
                                      <div className={styles.recommendedCard}>
                                        {prod.image ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={prod.image} alt={prod.name} className={styles.prodImage} />
                                        ) : (
                                          <div className={styles.prodImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#aaa', textAlign: 'center' }}>No Img</div>
                                        )}
                                        <div className={styles.prodInfo}>
                                          <div className={styles.prodName}>{prod.name}</div>
                                          {prod.priceRange && (
                                            <div className={styles.prodPrice}>{prod.priceRange}</div>
                                          )}
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </li>

              {/* Dynamic collection links */}
              {navCollections === null ? (
                Array(4).fill(0).map((_, i) => (
                  <li key={`skeleton-desktop-${i}`} className={styles.navItem}>
                    <div className={styles.skeletonNavLink} />
                  </li>
                ))
              ) : (
                navCollections.map((col) => (
                  <li key={col.slug} className={styles.navItem}>
                    <Link href={`/collections/${col.slug}`} className={styles.navLink}>
                      {col.name.toUpperCase()}
                    </Link>
                  </li>
                ))
              )}
            </ul>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
              <div className={styles.mobileNav}>
                {navCollections === null ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={`skeleton-mobile-${i}`} style={{ height: '40px', background: 'rgba(0,0,0,0.05)', margin: '0.5rem 1rem', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  ))
                ) : (
                  navCollections.map((col) => (
                    <Link
                      key={col.slug}
                      href={`/collections/${col.slug}`}
                      className={styles.mobileNavLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {col.name.toUpperCase()}
                    </Link>
                  ))
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Full-Screen Mobile Catalog Overlay */}
        {isMegaMenuOpen && (
          <div className={styles.mobileCatalogOverlay}>
            {/* Screen 1: Category List */}
            <div className={styles.mobileOverlayScreen}>
              <div className={styles.mobileFullScreenHeader}>
                <h2 className={styles.mobileFullScreenTitle}>BROWSE CATALOG</h2>
                <button
                  className={styles.mobileFullScreenCloseBtn}
                  onClick={() => {
                    setIsMegaMenuOpen(false);
                  }}
                >
                  CLOSE ✕
                </button>
              </div>
              <div className={styles.mobileFullScreenBody}>
                {Object.keys(megaMenuData)
                  .sort((a, b) => sortCategories(megaMenuData[a].title, megaMenuData[b].title))
                  .map((catKey) => (
                    <button
                      key={catKey}
                      className={styles.mobileDrillDownItem}
                      onClick={() => {
                        if (megaMenuData[catKey].links.length === 0) {
                          setIsMegaMenuOpen(false);
                          router.push(`/products?category=${megaMenuData[catKey].slug}`);
                        } else {
                          setMobileViewCategory(catKey);
                        }
                      }}
                    >
                      {megaMenuData[catKey].title}
                      <span className={styles.mobileChevron}>›</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Screen 2: Subcategories (Product Types) */}
            {mobileViewCategory && megaMenuData[mobileViewCategory] && (
              <div className={`${styles.mobileOverlayScreen} ${styles.mobileSubcategoryScreen}`}>
                <div className={styles.mobileFullScreenHeader}>
                  <button
                    className={styles.mobileFullScreenBackBtn}
                    onClick={() => setMobileViewCategory(null)}
                  >
                    ‹ BACK
                  </button>
                  <h2 className={styles.mobileFullScreenTitle}>{megaMenuData[mobileViewCategory].title}</h2>
                </div>
                <div className={styles.mobileFullScreenBody}>
                  {Object.entries(getGroupedLinks(megaMenuData[mobileViewCategory].links))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([letter, groupLinks]) => (
                      <div key={letter} className={styles.mobileAlphabetGroup}>
                        <div className={styles.mobileAlphabetHeader}>{letter}</div>
                        <div className={styles.mobileAlphabetLinks}>
                          {[...groupLinks]
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((link, idx) => (
                              <Link
                                key={idx}
                                href={link.href}
                                className={styles.mobileFullScreenLink}
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setIsMegaMenuOpen(false);
                                  setMobileViewCategory(null);
                                }}
                              >
                                {link.label}
                              </Link>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
