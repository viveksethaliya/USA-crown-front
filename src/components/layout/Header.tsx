'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl, getGuestCartId, type CartApiResponse } from '@/lib/cart';
import styles from './Header.module.css';
import SmartSearchBar from './SmartSearchBar';
import { FiUser, FiMapPin, FiLogOut } from 'react-icons/fi';

// Static fallback mega menu data
const fallbackMegaMenuData: Record<string, { title: string, slug: string, links: { label: string, href: string }[] }> = {
  'findings': {
    title: 'FINDINGS',
    slug: 'findings',
    links: [
      { label: 'Clasps & Toggles', href: '/products?category=clasps' },
      { label: 'Earring Findings', href: '/products?category=earring-findings' },
      { label: 'Jump Rings', href: '/products?category=jump-rings' },
      { label: 'Settings', href: '/products?category=settings' },
    ]
  },
  'mountings': {
    title: 'MOUNTINGS',
    slug: 'mountings',
    links: [
      { label: 'Ring Mountings', href: '/products?category=ring-mountings' },
      { label: 'Pendant Mountings', href: '/products?category=pendant-mountings' },
      { label: 'Earring Mountings', href: '/products?category=earring-mountings' },
      { label: 'Bracelet Mountings', href: '/products?category=bracelet-mountings' },
    ]
  },
  'finished': {
    title: 'FINISHED JEWELRY',
    slug: 'finished',
    links: [
      { label: 'Chains', href: '/products?category=chains' },
      { label: 'Bracelets', href: '/products?category=bracelets' },
      { label: 'Earrings', href: '/products?category=earrings' },
      { label: 'Rings', href: '/products?category=rings' },
    ]
  },
  'metals': {
    title: 'METALS',
    slug: 'metals',
    links: [
      { label: 'Casting Grain', href: '/products?category=casting-grain' },
      { label: 'Wire', href: '/products?category=wire' },
      { label: 'Sheet', href: '/products?category=sheet' },
      { label: 'Solder', href: '/products?category=solder' },
    ]
  }
};

// Fallback links if API is unavailable
const fallbackCollections = [
  { name: 'NEW ARRIVALS', slug: 'new' },
  { name: 'METALS & MILL', slug: 'metals' },
  { name: 'TOOLS & SUPPLIES', slug: 'tools' },
  { name: 'CUSTOM MANUFACTURING', slug: 'custom' },
];

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
}

interface Product {
  id: number;
  name: string;
  price?: number;
  regular_price?: number;
  image: string | null;
  slug: string;
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
  const [navCollections, setNavCollections] = useState<NavCollection[]>(fallbackCollections);
  const [megaMenuData, setMegaMenuData] = useState(fallbackMegaMenuData);
  const [mobileViewCategory, setMobileViewCategory] = useState<string | null>(null);

  const [recommendedCache, setRecommendedCache] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch recommended products when a category is hovered
  useEffect(() => {
    if (!isMegaMenuOpen || !activeCategory) return;
    if (recommendedCache[activeCategory]) return; // already fetched

    const catData = megaMenuData[activeCategory];
    if (!catData) return;

    async function fetchProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/products?category=${catData.slug}&limit=3`);
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

  // Close mega menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bottomTierRef.current && !bottomTierRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll and focus mega menu on open
  useEffect(() => {
    if (isMegaMenuOpen) {
      if (!isMobileMenuOpen && bottomTierRef.current) {
        // Scroll the tier 3 nav bar to the top of the screen
        const rect = bottomTierRef.current.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        window.scrollTo({ top, behavior: 'smooth' });

        // Wait for smooth scroll to finish before locking body
        const timer = setTimeout(() => {
          document.body.style.overflow = 'hidden';
        }, 400);
        return () => clearTimeout(timer);
      } else {
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
        const res = await fetch('/api/user/session', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch {
        // silently fail
      }
    }

    async function loadCartCount() {
      try {
        const guestId = getGuestCartId();
        const res = await fetch(apiUrl(`/api/cart?guestId=${encodeURIComponent(guestId)}`), {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          // Backend returns { cart: { id, status }, items: [] }
          setCartCount(data.items?.length || 0);
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
        const res = await fetch('/api/collections');
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
        const res = await fetch('/api/categories');
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
        const res = await fetch('/api/metal-prices');

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
      await fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event('user-auth-change'));
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const currentCategoryData = megaMenuData[activeCategory] || megaMenuData[Object.keys(megaMenuData)[0]] || { title: '', links: [] };

  return (
    <header className={styles.header}>
      {/* Top Tier: Member Links (White) */}
      <div className={styles.topTier}>
        <div className={`${styles.container} ${styles.topTierContainer}`}>
          <div className={styles.topContact}>
            <span>📞 (212)-764-6470</span>
            <span className={styles.divider}>|</span>
            <span>Monday – Friday 9:00 AM – 5:00 PM</span>
          </div>
          <div className={styles.topLinks}>
            <Link href="/NYS-ResaleCertificate-ST120.pdf" target="_blank" className={styles.topLink}>Download Resale Certificate</Link>
            <span className={styles.divider}>|</span>
            <Link href="/calculator" className={styles.topLink}>MM to Carat Calculator</Link>
            <span className={styles.divider}>|</span>
            <Link href="/" className={styles.topLink}>Home</Link>
            <span className={styles.divider}>|</span>
            <Link href="/contact" className={styles.topLink}>Contact Us</Link>
            <span className={styles.divider}>|</span>
            <Link href="/about" className={styles.topLink}>About Us</Link>
            <span className={styles.divider}>|</span>
            <Link href="/catalog" className={styles.topLink}>Catalog</Link>
            <span className={styles.divider}>|</span>
            <Link href="/cart" className={styles.topLink}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
            <span className={styles.divider}>|</span>

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
                      <span>{user.companyName}</span>
                    </div>
                    <Link
                      href="/account/profile"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser /> My Profile
                    </Link>
                    <Link
                      href="/account/addresses"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiMapPin /> Addresses
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
            <SmartSearchBar />

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
              <li 
                className={styles.navItem}
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Link
                  href="/products"
                  className={`${styles.navLink} ${styles.navLinkBtn}`}
                  aria-expanded={isMegaMenuOpen}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>☰</span> ALL PRODUCTS ▾
                </Link>

                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && (
                  <div className={styles.megaMenuDropdown}>
                    <div className={styles.megaMenuInner}>
                      
                      {/* Left Side: Categories */}
                      <div className={styles.categorySidebar}>
                        {Object.keys(megaMenuData)
                          .sort((a, b) => sortCategories(megaMenuData[a].title, megaMenuData[b].title))
                          .map((catKey) => (
                            <Link
                              href={`/products?category=${megaMenuData[catKey].slug}`}
                              key={catKey}
                              className={`${styles.categoryItem} ${activeCategory === catKey ? styles.active : ''}`}
                              onMouseEnter={() => setActiveCategory(catKey)}
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
                            {/* Tier 1: Recommended Products */}
                            <div className={styles.recommendedSection}>
                              <h4 className={styles.sectionTitle}>
                                Recommended in {megaMenuData[activeCategory].title}
                              </h4>
                              
                              {loadingProducts && (!recommendedCache[activeCategory] || recommendedCache[activeCategory].length === 0) ? (
                                <div style={{ color: '#888' }}>Finding recommendations...</div>
                              ) : (!recommendedCache[activeCategory] || recommendedCache[activeCategory].length === 0) ? (
                                <div style={{ color: '#888' }}>No products found.</div>
                              ) : (
                                <div className={styles.recommendedGrid}>
                                  {recommendedCache[activeCategory].map(prod => (
                                    <Link href={`/products/${prod.id}`} key={prod.id} style={{ textDecoration: 'none' }} onClick={() => setIsMegaMenuOpen(false)}>
                                      <div className={styles.recommendedCard}>
                                        {prod.image ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={prod.image} alt={prod.name} className={styles.prodImage} />
                                        ) : (
                                          <div className={styles.prodImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#aaa', textAlign: 'center' }}>No Img</div>
                                        )}
                                        <div className={styles.prodInfo}>
                                          <div className={styles.prodName}>{prod.name}</div>
                                          {!!prod.regular_price && (
                                            <div className={styles.prodPrice}>
                                              ${prod.regular_price.toFixed(2)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>

                            <hr className={styles.divider} />

                            {/* Tier 2: Sub Categories */}
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
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </li>

              {/* Dynamic collection links */}
              {navCollections.map((col) => (
                <li key={col.slug} className={styles.navItem}>
                  <Link href={`/collections/${col.slug}`} className={styles.navLink}>
                    {col.name.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
              <div className={styles.mobileNav}>
                {navCollections.map((col) => (
                  <Link
                    key={col.slug}
                    href={`/collections/${col.slug}`}
                    className={styles.navLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {col.name.toUpperCase()}
                  </Link>
                ))}
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
