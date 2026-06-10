'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl, getGuestCartId, type CartApiResponse } from '@/lib/cart';
import styles from './Header.module.css';
import SmartSearchBar from './SmartSearchBar';

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

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('findings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navCollections, setNavCollections] = useState<NavCollection[]>(fallbackCollections);
  const [megaMenuData, setMegaMenuData] = useState(fallbackMegaMenuData);
  const [mobileViewCategory, setMobileViewCategory] = useState<string | null>(null);

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

  const [metalPrices, setMetalPrices] = useState({
    gold: '...',
    silver: '...',
    platinum: '...'
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/session`, {
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
          const data = await res.json() as CartApiResponse;
          setCartCount(data.cart.itemCount);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/collections`);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/metal-prices`);

        if (res.ok) {
          const data = await res.json();

          const formatPrice = (price: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(price);
          };

          setMetalPrices({
            gold: formatPrice(data.XAU.price),
            silver: formatPrice(data.XAG.price),
            platinum: formatPrice(data.XPT.price)
          });
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/logout`, {
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
                      href="/profile"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      ✏️ Edit Profile
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
              <div className={styles.metalItem}>
                <span className={styles.metalName}>GOLD</span>
                <span className={styles.metalPrice}>{metalPrices.gold}</span>
              </div>
              <div className={styles.metalItem}>
                <span className={styles.metalName}>SILVER</span>
                <span className={styles.metalPrice}>{metalPrices.silver}</span>
              </div>
              <div className={styles.metalItem}>
                <span className={styles.metalName}>PLATINUM</span>
                <span className={styles.metalPrice}>{metalPrices.platinum}</span>
              </div>
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
                  onClick={() => setIsMegaMenuOpen(prev => !prev)}
                  aria-expanded={isMegaMenuOpen}
                >
                  ALL PRODUCTS ▾
                </button>

                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && (
                  <div className={styles.megaMenu}>
                    <div className={styles.megaMenuContainer}>
                      {/* Left Side: Categories */}
                      <div className={styles.megaMenuSidebar}>
                        {Object.keys(megaMenuData)
                          .sort((a, b) => megaMenuData[a].title.localeCompare(megaMenuData[b].title))
                          .map((catKey) => (
                          <div
                            key={catKey}
                            className={`${styles.sidebarItem} ${activeCategory === catKey ? styles.sidebarItemActive : ''}`}
                            onMouseEnter={() => setActiveCategory(catKey)}
                            onClick={() => {
                              if (megaMenuData[catKey].links.length === 0) {
                                setIsMegaMenuOpen(false);
                                router.push(`/products?category=${megaMenuData[catKey].slug}`);
                              }
                            }}
                          >
                            {megaMenuData[catKey].title}
                            <span className={styles.sidebarArrow}>›</span>
                          </div>
                        ))}
                      </div>

                      {/* Right Side: Category Links */}
                      <div className={styles.megaMenuContent}>
                        <h3 className={styles.megaMenuTitle}>{currentCategoryData.title}</h3>
                        <div className={styles.megaMenuLinksGrid}>
                          {[...currentCategoryData.links]
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((link, idx) => (
                            <Link key={idx} href={link.href} className={styles.megaMenuLink}>
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Mega Menu Featured Image/Promo */}
                      <div className={styles.megaMenuPromo}>
                        <div className={styles.promoImagePlaceholder}>
                          Featured
                        </div>
                        <p className={styles.promoText}>Discover our new Spring mountings.</p>
                        <Link href="/collections/spring" className={styles.promoBtn}>SHOP NOW</Link>
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
                  .sort((a, b) => megaMenuData[a].title.localeCompare(megaMenuData[b].title))
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
