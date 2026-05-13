import Image from 'next/image';
import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import styles from './contact.module.css';

export const metadata = {
  title: 'Contact Us | Crown Findings',
  description: 'Learn about Crown Findings, a trusted B2B jewelry findings supplier with over 50 years of experience.',
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      {/* 1. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.breadcrumbs}>
            Home <span>/ Contact Us</span>
          </div>
          <h1 className={styles.heroTitle}>Contact Us</h1>
          <p className={styles.heroText}>
            Explore Crown Findings' comprehensive wholesale jewelry findings catalog, designed to meet the diverse needs of jewelers and crafters. Our extensive collection features premium-quality components, including discs, clasps, chains, jump rings, and more. Crafted with precision and available in a variety of metals such as gold, silver, brass, and stainless steel, each item in our catalog is built to support your creative vision.
          </p>
        </div>
      </section>

      {/* 2. Form + Map Section */}
      <section className={styles.formMapSection}>
        <div className={styles.formContainer}>
          <form>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name <span>*</span></label>
                <input type="text" className={styles.input} placeholder="First name" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>&nbsp;</label>
                <input type="text" className={styles.input} placeholder="Last name" />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Company name <span>*</span></label>
                <input type="text" className={styles.input} placeholder="Company name" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email <span>*</span></label>
                <input type="email" className={styles.input} placeholder="Ex: johndoe214@gmail.com" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone <span>*</span></label>
                <input type="tel" className={styles.input} placeholder="+1 (xxx) xxx-xxxx" required />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Subject <span>*</span></label>
                <input type="text" className={styles.input} placeholder="Subject" required />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>What can we help you with? <span>*</span></label>
                <textarea className={styles.textarea} placeholder="Type your message here" required></textarea>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms" className={styles.checkboxText}>
                    <strong>Click here</strong><br />
                    I agree to terms & conditions provided, and to receive SMS notifications, alerts & occasional marketing communications from Crown Findings. Message frequency varies. Message & data rates may apply. Text HELP to (917) 746-6470 for assistance. You can reply STOP to unsubscribe at anytime.
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn}>Submit</button>
          </form>
        </div>

        <div className={styles.mapContainer}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.3789311145326!2d-73.98402432426372!3d40.75806497138491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c64c4897%3A0x868b446a783321db!2s44%20W%2047th%20St%2C%20New%20York%2C%20NY%2010036!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Crown Findings Location"
          ></iframe>
        </div>
      </section>

      {/* 3. Info Boxes Section */}
      <section className={styles.infoBoxesSection}>
        <div className={styles.infoBoxesGrid}>
          <div className={styles.infoBox}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3 className={styles.infoBoxTitle}>Business Hours</h3>
            <p className={styles.infoBoxText}>
              Monday — Friday<br />
              9:00 AM — 5:00 PM
            </p>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <h3 className={styles.infoBoxTitle}>Address</h3>
            <p className={styles.infoBoxText}>
              Crown Findings Co., Inc. 44 West 47 Street, GF-12, New York, NY 10036
            </p>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <h3 className={styles.infoBoxTitle}>Call Us</h3>
            <p className={styles.infoBoxText}>
              (212)-764-6470
            </p>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <h3 className={styles.infoBoxTitle}>Email</h3>
            <p className={styles.infoBoxText}>
              orders@crownfindings.com
            </p>
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqContent}>
          <div className={styles.faqCrownIcon}>
            <Image src="/crown.png" alt="Crown Logo" width={40} height={30} style={{ objectFit: 'contain' }} />
          </div>
          <h2 className={styles.faqTitle}>Popular Questions</h2>
          <p className={styles.faqSubtitle}>
            At Crown Findings, we understand the importance of providing valuable information to our clients about jewelry findings. Here are answers to some of the most commonly asked questions from our customers around the country.
          </p>

          <FaqAccordion />
        </div>
      </section>

      {/* 5. Bottom Banner */}
      <section className={styles.bottomBanner}>
        <p className={styles.bannerText}>
          Elevate your jewelry creations with our premium 14K, 18K, and Platinum wholesale jewelry findings. Our family business combines decades of expertise with unwavering dedication to fast, reliable service with exclusive member discounts!
        </p>
        <div className={styles.bannerTitle}>
          Experience the Crown Findings Difference
        </div>
        <button className={styles.bannerBtn}>
          Register For A Wholesale Account
        </button>
      </section>

    </main>
  );
}
