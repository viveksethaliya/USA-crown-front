'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Header.module.css';

// ... megaMenuData ...
const megaMenuData: Record<string, { title: string, links: { label: string, href: string }[] }> = {
  'findings': {
    title: 'FINDINGS',
    links: [
      { label: 'Clasps & Toggles', href: '/category/findings/clasps' },
      { label: 'Earring Findings', href: '/category/findings/earring' },
      { label: 'Jump Rings', href: '/category/findings/jump-rings' },
      { label: 'Settings', href: '/category/findings/settings' },
    ]
  },
  'mountings': {
    title: 'MOUNTINGS',
    links: [
      { label: 'Ring Mountings', href: '/category/mountings/rings' },
      { label: 'Pendant Mountings', href: '/category/mountings/pendants' },
      { label: 'Earring Mountings', href: '/category/mountings/earrings' },
      { label: 'Bracelet Mountings', href: '/category/mountings/bracelets' },
    ]
  },
  'finished': {
    title: 'FINISHED JEWELRY',
    links: [
      { label: 'Chains', href: '/category/finished/chains' },
      { label: 'Bracelets', href: '/category/finished/bracelets' },
      { label: 'Earrings', href: '/category/finished/earrings' },
      { label: 'Rings', href: '/category/finished/rings' },
    ]
  },
  'metals': {
    title: 'METALS',
    links: [
      { label: 'Casting Grain', href: '/category/metals/casting-grain' },
      { label: 'Wire', href: '/category/metals/wire' },
      { label: 'Sheet', href: '/category/metals/sheet' },
      { label: 'Solder', href: '/category/metals/solder' },
    ]
  }
};

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('findings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [metalPrices, setMetalPrices] = useState({
    gold: '...',
    silver: '...',
    platinum: '...'
  });

  useEffect(() => {
    async function fetchPrices() {
      try {
        const [goldRes, silverRes, platRes] = await Promise.all([
          fetch('https://api.gold-api.com/price/XAU/USD'),
          fetch('https://api.gold-api.com/price/XAG/USD'),
          fetch('https://api.gold-api.com/price/XPT/USD')
        ]);

        if (goldRes.ok && silverRes.ok && platRes.ok) {
          const goldData = await goldRes.json();
          const silverData = await silverRes.json();
          const platData = await platRes.json();

          const formatPrice = (price: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(price);
          };

          setMetalPrices({
            gold: formatPrice(goldData.price),
            silver: formatPrice(silverData.price),
            platinum: formatPrice(platData.price)
          });
        }
      } catch (error) {
        console.error('Failed to fetch metal prices:', error);
      }
    }

    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
            <Link href="/login" className={styles.topLink}>Sign In</Link>
            <Link href="/apply" className={styles.topLink}>Register</Link>
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
                <img src="/logo.png" alt="Crown Findings Logo" className={styles.logoImage} />
              </Link>
            </div>

            {/* Global Search */}
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search products by SKU, name, or category..."
                className={styles.searchInput}
              />
              <button className={styles.searchButton}>SEARCH</button>
            </div>

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
      <div className={styles.bottomTier}>
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

          <nav className={styles.nav}>
            {/* Desktop Nav */}
            <ul className={styles.navList}>
              <li
                className={styles.navItem}
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Link href="/products" className={styles.navLink}>
                  ALL PRODUCTS ▾
                </Link>

                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && (
                  <div className={styles.megaMenu}>
                    <div className={styles.megaMenuContainer}>
                      {/* Left Side: Categories */}
                      <div className={styles.megaMenuSidebar}>
                        {Object.keys(megaMenuData).map((catKey) => (
                          <div
                            key={catKey}
                            className={`${styles.sidebarItem} ${activeCategory === catKey ? styles.sidebarItemActive : ''}`}
                            onMouseEnter={() => setActiveCategory(catKey)}
                          >
                            {megaMenuData[catKey].title}
                            <span className={styles.sidebarArrow}>›</span>
                          </div>
                        ))}
                      </div>

                      {/* Right Side: Category Links */}
                      <div className={styles.megaMenuContent}>
                        <h3 className={styles.megaMenuTitle}>{megaMenuData[activeCategory].title}</h3>
                        <div className={styles.megaMenuLinksGrid}>
                          {megaMenuData[activeCategory].links.map((link, idx) => (
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
              <li className={styles.navItem}><Link href="/new" className={styles.navLink}>NEW ARRIVALS</Link></li>
              <li className={styles.navItem}><Link href="/metals" className={styles.navLink}>METALS & MILL</Link></li>
              <li className={styles.navItem}><Link href="/tools" className={styles.navLink}>TOOLS & SUPPLIES</Link></li>
              <li className={styles.navItem}><Link href="/custom" className={styles.navLink}>CUSTOM MANUFACTURING</Link></li>
            </ul>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
              <div className={styles.mobileNav}>
                <Link href="/products" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>ALL PRODUCTS</Link>
                <Link href="/new" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>NEW ARRIVALS</Link>
                <Link href="/metals" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>METALS & MILL</Link>
                <Link href="/tools" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>TOOLS & SUPPLIES</Link>
                <Link href="/custom" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>CUSTOM MANUFACTURING</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
