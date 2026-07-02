'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className={styles.footer}>
      {/* Newsletter Banner */}
      <div className={styles.newsletterBanner}>
        <div className={styles.newsletterContainer}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterText}>
              <h3 className={styles.newsletterTitle}>Stay in the Loop</h3>
              <p className={styles.newsletterSubtitle}>
                Get exclusive updates on new arrivals, metal price alerts, and wholesale deals.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
              <div className={styles.newsletterInputWrap}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') { setStatus('idle'); setMessage(''); }
                  }}
                  className={styles.newsletterInput}
                  required
                />
                <button
                  type="submit"
                  className={styles.newsletterBtn}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Subscribing...' : 'SUBSCRIBE'}
                </button>
              </div>
              {message && (
                <p className={`${styles.newsletterMsg} ${status === 'error' ? styles.newsletterMsgError : styles.newsletterMsgSuccess}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* Column 1 */}
        <div className={styles.column}>
          <div className={styles.logoContainer}>
            <Link href="/">
              <Image src="/logo.png" alt="Crown Findings Logo" width={180} height={40} className={styles.logo} unoptimized />
            </Link>
          </div>
          <p className={styles.text}>
            For decades, we&apos;ve provided wholesale jewelry findings, mountings, and supplies. Offering unbeatable prices and unmatched quality for the jewelry trade.
          </p>
          <div className={styles.contactInfo}>
            <p className={styles.contactItem}>
              <span className={styles.icon}>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
              </span>
              <a href="mailto:info@crownfindings.com">info@crownfindings.com</a>
            </p>
            <p className={styles.contactItem}>
              <span className={styles.icon}>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
              </span>
              44 West 47th Street, Ground Floor,<br />New York, NY 10036
            </p>
            <p className={styles.contactItem}>
              <span className={styles.icon}>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
              </span>
              <a href="tel:212-764-6470">212-764-6470</a>
            </p>
          </div>
        </div>

        {/* Column 2 */}
        <div className={styles.column}>
          <div className={styles.section}>
            <h4 className={styles.heading}>HELP CENTER</h4>
            <ul className={styles.list}>
              <li><Link href="/affiliation" className={styles.link}>Affiliation</Link></li>
              <li><Link href="/about" className={styles.link}>About us</Link></li>
              <li><Link href="/faqs" className={styles.link}>FAQs</Link></li>
            </ul>
          </div>
          <div className={styles.section}>
            <h4 className={styles.heading}>POLICY</h4>
            <ul className={styles.list}>
              <li><Link href="/terms" className={styles.link}>Terms &amp; Conditions</Link></li>
              <li><Link href="/returns" className={styles.link}>Returns &amp; Exchanges</Link></li>
              <li><Link href="/shipping" className={styles.link}>Shipping</Link></li>
            </ul>
          </div>
        </div>

        {/* Column 3 */}
        <div className={styles.column}>
          <div className={styles.section}>
            <h4 className={styles.heading}>TOP TRENDING</h4>
            <ul className={styles.list}>
              <li><Link href="/new" className={styles.link}>New</Link></li>
              <li><Link href="/best-selling" className={styles.link}>Best Selling</Link></li>
            </ul>
          </div>
          <div className={styles.section}>
            <h4 className={styles.heading}>CUSTOMER</h4>
            <ul className={styles.list}>
              <li><Link href="/login" className={styles.link}>Customer Login</Link></li>
              <li><Link href="/apply" className={styles.link}>Account Registration</Link></li>
            </ul>
          </div>
        </div>

        {/* Column 4 */}
        <div className={styles.column}>
          <div className={styles.section}>
            <h4 className={styles.heading}>QUICK LINKS</h4>
            <ul className={styles.list}>
              <li><Link href="/" className={styles.link}>Home</Link></li>
              <li><Link href="/about" className={styles.link}>About us</Link></li>
              <li><Link href="/blog" className={styles.link}>Blog</Link></li>
              <li><Link href="/discount" className={styles.link}>Discount</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact us</Link></li>
              <li><Link href="/certificate" className={styles.link}>Resale Certificate</Link></li>
            </ul>
          </div>
        </div>

        {/* Column 5 */}
        <div className={styles.column}>
          <div className={styles.section}>
            <h4 className={styles.heading}>CATEGORIES</h4>
            <ul className={styles.list}>
              <li><Link href="/category/batteries" className={styles.link}>Batteries</Link></li>
              <li><Link href="/category/beads" className={styles.link}>Beads</Link></li>
              <li><Link href="/category/bracelet" className={styles.link}>Bracelet</Link></li>
              <li><Link href="/category/chains" className={styles.link}>Chains</Link></li>
              <li><Link href="/category/cd-mounting" className={styles.link}>CD Mounting</Link></li>
              <li><Link href="/category/clasps" className={styles.link}>Clasps</Link></li>
              <li><Link href="/category/discs" className={styles.link}>Discs</Link></li>
              <li><Link href="/products" className={styles.link}>View All</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>Copyright &copy; {new Date().getFullYear()} Crown Findings Co., Inc. All Rights Reserved.</p>
          <div className={styles.socials}>
            <Link href="https://www.facebook.com/crownfindings" aria-label="Facebook" className={styles.socialIcon}>
              <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </Link>
            <Link href="https://www.instagram.com/crownfindings" aria-label="Instagram" className={styles.socialIcon}>
              <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
