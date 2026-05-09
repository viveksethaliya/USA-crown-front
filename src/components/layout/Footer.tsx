import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.heading}>CROWN FINDINGS</h3>
          <p className={styles.text}>
            Premium wholesale jewelry platform.<br />
            Access restricted to verified members.
          </p>
        </div>
        <div className={styles.column}>
          <h4 className={styles.subHeading}>Quick Links</h4>
          <ul className={styles.list}>
            <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
            <li><Link href="/catalog" className={styles.link}>Catalog Preview</Link></li>
            <li><Link href="/apply" className={styles.link}>Apply for Membership</Link></li>
          </ul>
        </div>
        <div className={styles.column}>
          <h4 className={styles.subHeading}>Support</h4>
          <ul className={styles.list}>
            <li><Link href="/faqs" className={styles.link}>FAQs & Policies</Link></li>
            <li><Link href="/certificate" className={styles.link}>Resale Certificate</Link></li>
            <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Crown Findings. All rights reserved.</p>
      </div>
    </footer>
  );
}
