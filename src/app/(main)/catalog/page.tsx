import React from "react";
import styles from "./catalog.module.css";
import { FiBookOpen, FiDownload, FiSearch, FiLayers } from "react-icons/fi";
import ScrollReveal from "@/components/animations/ScrollReveal";

export const metadata = {
  title: "Catalog 2025 | Crown Findings",
  description: "Browse our interactive 2025 product catalog online.",
};

export default function CatalogPage() {
  const catalogUrl = "https://portal.printingcenterusa.com/flipbook_share.php?code=958313&title=Crown%20Findings%20Co%20Inc&desc=New%20Catalog%202025%27";

  return (
    <div className={styles.catalogContainer}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <ScrollReveal animation="fade-up">
          <h1 className={styles.title}>The 2025 Master Catalog</h1>
          <p className={styles.subtitle}>
            Discover thousands of premium findings, mountings, chains, and loose stones. 
            Browse our interactive flipbook below or open it in a full-screen view for the best experience.
          </p>
          <a 
            href={catalogUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.ctaButton}
          >
            <FiBookOpen className={styles.icon} />
            Open Fullscreen Catalog
          </a>
        </ScrollReveal>
      </section>

      {/* Embedded Flipbook */}
      <section className={styles.embedContainer}>
        <div className={styles.iframeWrapper}>
          <iframe 
            src={catalogUrl} 
            title="Crown Findings Co Inc New Catalog 2025"
            allowFullScreen 
            loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* Features/Highlights */}
      <section className={styles.features}>
        <ScrollReveal animation="fade-up" delay={0} className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiSearch />
          </div>
          <h3 className={styles.featureTitle}>Interactive Search</h3>
          <p className={styles.featureText}>
            Quickly find exact SKUs and product names using the built-in search tool within the flipbook viewer.
          </p>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={200} className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiLayers />
          </div>
          <h3 className={styles.featureTitle}>Comprehensive Range</h3>
          <p className={styles.featureText}>
            From classic gold mountings to modern platinum settings, our entire inventory is at your fingertips.
          </p>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={400} className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiDownload />
          </div>
          <h3 className={styles.featureTitle}>Download & Print</h3>
          <p className={styles.featureText}>
            Save the catalog locally as a PDF or print specific pages directly from the online viewer tool.
          </p>
        </ScrollReveal>
      </section>
    </div>
  );
}
