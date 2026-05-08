import Link from "next/link";
import styles from "./page.module.css";
import TestimonialCarousel from "../components/TestimonialCarousel";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* 50/50 Split Hero Section */}
      <section className={styles.heroSplit}>
        <div className={styles.heroTextSide}>
          <div className={styles.heroTextContent}>
            <h1 className={styles.heroTitle}>Premium Wholesale Jewelry & Findings</h1>
            <p className={styles.heroText}>
              Exclusive access to our high-SKU catalog of professional-grade chains, clasps, earrings, and findings.
              Providing the finest quality materials to jewelers worldwide since 1985.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryBtn}>Member Login</Link>
              <Link href="/apply" className={styles.secondaryBtn}>Apply for Membership</Link>
            </div>
          </div>
        </div>
        <div className={styles.heroImageSide}>
          <img
            src="/web-phts/Jeweler-Image-Placeholder.jpg"
            alt="Jeweler Working"
            className={styles.heroImage}
          />
        </div>
      </section>

      {/* About Crown Findings Section */}
      <section className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.aboutSplit}>
            <div className={styles.aboutImageSide}>
              <img
                src="/web-phts/Mask-group-2-600x436-1.webp"
                alt="Crown Findings Workshop"
                className={styles.aboutImage}
              />
            </div>
            <div className={styles.aboutTextSide}>
              <h2 className={styles.aboutTitle}>About Crown Findings</h2>
              <p className={styles.aboutText}>
                Crown Findings Co., Inc. was established November 8, 1983 and has since flourished to become a leading wholesale jewelry findings business. Located in Manhattan’s iconic Diamond District, Crown Findings has been serving jewelers on the block, across the country, and around the world throughout its lifetime. Since its birth, Crown has provided the jewelry industry with competitive pricing, quality items, and unmatched service and integrity.
              </p>
              <blockquote className={styles.aboutQuote}>
                “One of the best parts about being a business owner is having the opportunity to meet new people from different backgrounds,” Berc explains. “I still keep in touch with people I met through Crown 35 years ago.”
              </blockquote>
              <Link href="/about" className={styles.primaryBtn}>
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Section */}
      <section className={styles.categoriesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Wholesale Jewelry Supplies</h2>
          <p className={styles.sectionDescription}>
            Explore our diverse wholesale jewelry findings range featuring settings, chains, pendants, mill products and more to unlock limitless design potential for your creations.
          </p>
          <div className={styles.categoryGrid}>

            {/* Category Card 1: Earrings */}
            <Link href="/products?category=earrings" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Earrings.webp" alt="Earrings" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Earrings</h3>
                <p className={styles.categoryDesc}>Our earrings range offers diverse findings, including posts, hooks, backs, jackets, and wires, for unique and custom earring creations.</p>
              </div>
            </Link>

            {/* Category Card 2: Chains */}
            <Link href="/products?category=chains" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Chains.webp" alt="Chains" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Chains</h3>
                <p className={styles.categoryDesc}>Choose from our versatile chains, available in bulk or by inch, to create distinctive necklaces and bracelets for your collection.</p>
              </div>
            </Link>

            {/* Category Card 3: Rings */}
            <Link href="/products?category=rings" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Rings-1.png.webp" alt="Rings" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Rings</h3>
                <p className={styles.categoryDesc}>Explore our ring components, offering a solid foundation for crafting tailored rings that stand out in any jewelry collection.</p>
              </div>
            </Link>

            {/* Category Card 4: Pendants */}
            <Link href="/products?category=pendants" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Pendants-1.png.webp" alt="Pendants" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Pendants</h3>
                <p className={styles.categoryDesc}>Discover our selection of oval pendants, ideal for custom gemstone settings or engraving, adding a personal touch to any design.</p>
              </div>
            </Link>

            {/* Category Card 5: Clasps */}
            <Link href="/products?category=clasps" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Clasps-1.png.webp" alt="Clasps" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Clasps</h3>
                <p className={styles.categoryDesc}>Explore our range of over 30 types of clasps, offering jewelers diverse, stylish, and secure options for all necklace and bracelet designs.</p>
              </div>
            </Link>

            {/* Category Card 6: Religious Items */}
            <Link href="/products?category=religious-items" className={styles.categoryCard}>
              <img src="https://crownfindings.com/wp-content/uploads/2025/10/Religious-Items-1.webp" alt="Religious Items" className={styles.categoryImage} />
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>Religious Items</h3>
                <p className={styles.categoryDesc}>Our religious items feature a variety of charms and symbols, perfect for creating spiritually meaningful jewelry at wholesale prices.</p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Professional Affiliations Section */}
      <section className={styles.affiliationsSection}>
        <div className={styles.container}>
          <h3 className={styles.sectionTitle}>Professional Affiliations</h3>
          <p className={styles.sectionDescription}>
            We are proud members of the following professional organizations:
          </p>
          <div className={styles.affiliationsGrid}>
            <img src="/professional-affiliations/image-2-25.png" alt="Affiliation 1" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-3.webp" alt="Affiliation 2" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-4-removebg-preview.png" alt="Affiliation 3" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-5-removebg-preview.png" alt="Affiliation 4" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/jewelersofamerica-logo_1-1-200x133-1.png" alt="Jewelers of America" className={styles.affiliationLogo} />
          </div>
        </div>
      </section>

      {/* Exclusive Pricing CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Get Access to Exclusive Pricing &amp; Bulk Discounts</h2>
          <p className={styles.ctaText}>
            As a trusted wholesale jewelry supplier serving this industry for over 40 years, we offer our competitive pricing, bulk discounts, and ordering only to members of the jewelry trade. By becoming a member, you gain access to our full catalog of quality jewelry findings at competitive trade prices. You&#39;ll also benefit from working with our experienced and attentive team. Apply today to start enjoying exclusive pricing and benefits.
          </p>
          <Link href="/login" className={styles.ctaButton}>
            Start Application
          </Link>
        </div>
      </section>
      {/* Explore the World of Crown Section */}
      <section className={styles.exploreSection}>
        <div className={styles.container}>
          <div className={styles.exploreSplit}>
            <div className={styles.exploreTextSide}>
              <h2 className={styles.exploreTitle}>
                Explore the<br />World of Crown
              </h2>
              <p className={styles.exploreText}>
                Crown Findings Co., Inc offers a wide variety of 14K, 18K &amp; Plat. wholesale findings. The decades old family owned &amp; operated business runs on fast and reliable service.
              </p>
            </div>
            <div className={styles.exploreVideoSide}>
              <iframe
                className={styles.exploreVideo}
                src="https://www.youtube.com/embed/i5y6E2C0ULI"
                title="Explore the World of Crown Findings"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Comments / Testimonials Section */}
      <section className={styles.commentsSection}>
        <div className={styles.container}>
          <div className={styles.commentsSplit}>
            <div className={styles.commentsImageSide}>
              <img
                src="/web-phts/comments2.webp"
                alt="Customer Testimonials"
                className={styles.commentsImage}
              />
            </div>
            <div className={styles.commentsTextSide}>
              <TestimonialCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className={styles.bottomBanner}>
        <div className={styles.container}>
          <p className={styles.bannerText}>
            Elevate your jewelry creations with our premium 14K, 18K, and Platinum wholesale jewelry findings. Our family business combines decades of expertise with unwavering dedication to fast, reliable service with exclusive member discounts!
          </p>
          <h3 className={styles.bannerHeadline}>Experience the Crown Findings Difference</h3>
          <Link href="/apply" className={styles.bannerBtn}>
            Register for a Wholesale Account
          </Link>
        </div>
      </section>
    </div>
  );
}
