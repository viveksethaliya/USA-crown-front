import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import HeroBanner from "@/components/HeroBanner";
import { apiUrl } from "@/lib/cart";

async function fetchFeaturedCategories() {
  try {
    const res = await fetch(apiUrl('/api/store/catalog/categories/featured'), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error("Failed to fetch featured categories:", error);
    return [];
  }
}

export default async function Home() {
  const featuredCategories = await fetchFeaturedCategories();
  
  return (
    <div className={styles.page}>
      <Script src="//code.tidio.co/hutysrzpj6mhyrdxotho54hskhb4hgq5.js" strategy="lazyOnload" />
      {/* Dynamic Promotional Banner */}
      <HeroBanner />

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
              <Link href="/contact" className={styles.primaryBtn}>
                Contact Us
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
            {featuredCategories.length > 0 ? (
              featuredCategories.map((cat: any) => (
                <Link href={`/products?category=${cat.slug}`} key={cat.id} className={styles.categoryCard}>
                  <img src={cat.image_url} alt={cat.name} className={styles.categoryImage} />
                  <div className={styles.categoryContent}>
                    <h3 className={styles.categoryTitle}>{cat.name}</h3>
                    <p className={styles.categoryDesc}>
                      Explore our {cat.name.toLowerCase()} range for unique and custom jewelry creations at wholesale prices.
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
                No featured categories found. Please add parent categories with images in the Admin Panel.
              </p>
            )}
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
