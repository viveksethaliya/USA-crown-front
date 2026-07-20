import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import HeroBannerDynamic from "@/components/layout/HeroBannerDynamic";
import HeroActionsClient from "@/components/layout/HeroActionsClient";
import ProductCard from "@/components/products/ProductCard";
import ScrollReveal from "@/components/animations/ScrollReveal";
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

async function fetchFeaturedProducts() {
  try {
    const res = await fetch(apiUrl('/api/store/catalog/products?is_featured=true&limit=8'), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch featured products');
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredCategories = await fetchFeaturedCategories();
  
  // Feature flag check
  const isFeaturedEnabled = process.env.ENABLE_FEATURED_PRODUCTS === 'true';
  const featuredProducts = isFeaturedEnabled ? await fetchFeaturedProducts() : [];
  
  return (
    <div className={styles.page}>
      <Script src="//code.tidio.co/hutysrzpj6mhyrdxotho54hskhb4hgq5.js" strategy="lazyOnload" />
      {/* Dynamic Promotional Banner */}
      <HeroBannerDynamic />

      {/* 50/50 Split Hero Section */}
      <section className={styles.heroSplit}>
        <div className={styles.heroTextSide}>
          <ScrollReveal animation="slide-right" duration={1000} className={styles.heroTextContent}>
            <h1 className={styles.heroTitleMain}>
              Premium Wholesale<br />Jewelry <span style={{ fontFamily: '"Times New Roman", Times, serif' }}>&amp;</span> Findings
            </h1>
            <p className={styles.heroTextMain}>
              Exclusive access to our high-SKU catalog of professional-grade chains, clasps, earrings, and findings.
              Providing the finest quality materials to jewelers worldwide since 1985.
            </p>
            <div className={styles.heroActions}>
              <HeroActionsClient />
            </div>
          </ScrollReveal>
        </div>
        <div className={styles.heroImageSide}>
          <div className={styles.heroImageWrapper}>
            <img
              src="/web-phts/Jeweler-Image-Placeholder.jpg"
              alt="Jeweler Working"
              className={styles.heroImage}
            />
            <div className={styles.heroImageOverlay}></div>
          </div>
        </div>
      </section>

      {/* Featured Products / Best Sellers Showcase */}
      {isFeaturedEnabled && featuredProducts.length > 0 && (
        <section className={styles.bestSellersSection}>
          <div className={styles.container}>
            <ScrollReveal animation="fade-up">
              <h2 className={styles.bestSellersTitle}>Best Sellers Showcase</h2>
              <p className={styles.bestSellersDescription}>
                Handcrafted excellence in 14K Gold and Platinum. Explore our top-selling findings that master jewelers trust to bring their visions to life.
              </p>
            </ScrollReveal>
            <div className={styles.bestSellersGrid}>
              {featuredProducts.map((prod: any, index: number) => (
                <ScrollReveal key={prod.id} animation="fade-up" delay={(index % 4) * 100 as 0|100|200|300} className={styles.bestSellersCardWrapper}>
                  <ProductCard product={prod} />
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal animation="fade-up" delay={200}>
              <div style={{ textAlign: 'center' }}>
                <Link href="/products" className={styles.goldOutlineBtn}>
                  Shop All Findings
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ─── BENTO BOX CATEGORIES ──────────────────────── */}
      <section className="py-28 relative z-10 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 md:px-16">
          <ScrollReveal animation="fade-up" className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="sectionTitle" style={{ color: 'var(--color-primary)', fontSize: '2.8rem', textAlign: 'center' }}>Curated Collections</h2>
            <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-accent2)', margin: '1rem auto 2.5rem auto' }}></div>
            <p className={styles.sectionDescription}>
              Wholesale jewelry findings — settings, chains, pendants, and mill products.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[300px]">
            {/* LARGE — Chains (has real image) */}
            <Link
              href="/products?category=rings"
              className="group relative col-span-1 md:col-span-2 row-span-2 overflow-hidden rounded-2xl border border-black/5 hover:border-[#182955]/50 transition-all duration-500 shadow-2xl"
            >
              <img
                src="/web-phts/type-of-rings-scaled-1-2048x1024.jpg"
                alt="Rings & Settings"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ opacity: 0.75 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10"></div>
              <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                <span className="text-[#FF9E1B] text-xs font-bold tracking-widest uppercase mb-2 block drop-shadow-md">Fine Collection</span>
                <h3 className="text-4xl font-bold text-white mb-3 drop-shadow-lg" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>Rings <span style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>&amp;</span> Settings</h3>
                <p className="text-white/90 max-w-md text-sm leading-relaxed drop-shadow-md">A solid foundation for crafting tailored rings in 14K, 18K & Platinum.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[#FF9E1B] text-sm font-semibold group-hover:gap-3 transition-all">
                  Explore Collection <span>→</span>
                </span>
              </div>
            </Link>

            {/* MEDIUM — Rings (gradient background since no image) */}
            <Link
              href="/products?category=chains"
              className="group relative col-span-1 md:col-span-2 overflow-hidden rounded-2xl border border-black/5 hover:border-[#182955]/50 transition-all duration-500 shadow-xl"
            >
              <img
                src="/web-phts/chains.png"
                alt="Chains & Necklaces"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ opacity: 0.85 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10"></div>
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <span className="text-[#FF9E1B] text-xs font-bold tracking-widest uppercase mb-2 block drop-shadow-md">Signature Collection</span>
                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>Chains <span style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>&amp;</span> Necklaces</h3>
                <p className="text-white/90 text-sm max-w-md drop-shadow-md">Versatile chains, available in bulk or by inch, to create distinctive pieces.</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[#FF9E1B] text-sm font-semibold group-hover:gap-3 transition-all">
                  Browse <span>→</span>
                </span>
              </div>
            </Link>

            {/* SMALL — Earrings */}
            <Link
              href="/products?category=earrings"
              className="group relative col-span-1 overflow-hidden rounded-2xl border border-black/5 hover:border-[#182955]/50 transition-all duration-500 shadow-xl"
            >
              <img
                src="/web-phts/earrings.png"
                alt="Earrings"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ opacity: 0.85 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10"></div>
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                <span className="text-[#FF9E1B] text-xs font-bold tracking-widest uppercase mb-1 block drop-shadow-md">Findings</span>
                <h3 className="text-xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>Earrings</h3>
                <p className="text-white/90 text-xs mt-1 drop-shadow-md">Posts, wires, hooks & more</p>
              </div>
            </Link>

            {/* SMALL — Clasps */}
            <Link
              href="/products?category=clasps"
              className="group relative col-span-1 overflow-hidden rounded-2xl border border-black/5 hover:border-[#182955]/50 transition-all duration-500 shadow-xl"
            >
              <img
                src="/web-phts/clasps.png"
                alt="Clasps & Toggles"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ opacity: 0.85 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10"></div>
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                <span className="text-[#FF9E1B] text-xs font-bold tracking-widest uppercase mb-1 block drop-shadow-md">Hardware</span>
                <h3 className="text-xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>Clasps <span style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>&amp;</span> Toggles</h3>
                <p className="text-white/90 text-xs mt-1 drop-shadow-md">Lobster, spring, box & more</p>
              </div>
            </Link>
          </div>
          
          <div className="mt-14 text-center">
            <Link href="/products" className="inline-flex items-center justify-center border border-[#182955] text-[#182955] px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#182955] hover:text-white transition-colors duration-300">
              VIEW ENTIRE CATALOG <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* About Crown Findings Section */}
      <section className={styles.aboutSection} style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className={styles.container}>
          <div className={styles.aboutSplit}>
            <div className={styles.aboutImageSide}>
              <ScrollReveal animation="slide-right" duration={1000}>
                <img
                  src="/web-phts/Mask-group-2-600x436-1.webp"
                  alt="Crown Findings Workshop"
                  className={styles.aboutImage}
                />
              </ScrollReveal>
            </div>
            <div className={styles.aboutTextSide}>
              <ScrollReveal animation="slide-left" duration={1000}>
                <h2 className="aboutTitle" style={{ color: 'var(--color-primary)', fontSize: '2.5rem' }}>About Crown Findings</h2>
                <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-accent2)', margin: '1rem 0 2rem 0' }}></div>
                <p className={styles.aboutText}>
                  Crown Findings Co., Inc. was established November 8, 1983 and has since flourished to become a leading wholesale jewelry findings business. Located in Manhattan’s iconic Diamond District, Crown Findings has been serving jewelers on the block, across the country, and around the world throughout its lifetime.
                </p>
                <blockquote className={styles.aboutQuote} style={{ borderLeft: '4px solid var(--color-accent2)', paddingLeft: '1.5rem', color: 'var(--color-primary)' }}>
                  “One of the best parts about being a business owner is having the opportunity to meet new people from different backgrounds,” Berc explains. “I still keep in touch with people I met through Crown 35 years ago.”
                </blockquote>
                <Link href="/contact" className="secondaryBtn" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)', padding: '12px 28px', display: 'inline-block' }}>
                  Contact Us
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Section */}
      <section className={styles.categoriesSection} style={{ backgroundColor: 'var(--color-white)' }}>
        <div className={styles.container}>
          <h2 className="sectionTitle" style={{ color: 'var(--color-primary)', fontSize: '2.8rem', textAlign: 'center' }}>Wholesale Supplies</h2>
          <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-accent2)', margin: '1rem auto 2.5rem auto' }}></div>
          <div className={styles.categoryGrid}>
            {featuredCategories.length > 0 ? (
              featuredCategories.map((cat: any) => (
                <Link href={`/products?category=${cat.slug}`} key={cat.id} className={styles.categoryCard}>
                  <img src={cat.image_url} alt={cat.name} className={styles.categoryImage} style={{ borderBottom: 'none' }} />
                  <div className={styles.categoryContent}>
                    <h3 className="categoryTitle" style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>{cat.name}</h3>
                    <p className={styles.categoryDesc}>
                      Explore our {cat.name.toLowerCase()} range for unique and custom jewelry creations.
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
                No featured categories found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Professional Affiliations Section */}
      <section className={styles.affiliationsSection} style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className={styles.container}>
          <h3 className="sectionTitle" style={{ fontSize: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>Professional Affiliations</h3>
          <div className={styles.affiliationsGrid} style={{ marginTop: '3rem' }}>
            <img src="/professional-affiliations/image-2-25.png" alt="Affiliation 1" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-3.webp" alt="Affiliation 2" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-4-removebg-preview.png" alt="Affiliation 3" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/image-5-removebg-preview.png" alt="Affiliation 4" className={styles.affiliationLogo} />
            <img src="/professional-affiliations/jewelersofamerica-logo_1-1-200x133-1.png" alt="Jewelers of America" className={styles.affiliationLogo} />
          </div>
        </div>
      </section>

      {/* Explore the World of Crown Section */}
      <section className={styles.exploreSection}>
        <div className={styles.container}>
          <div className={styles.exploreSplit}>
            <div className={styles.exploreTextSide}>
              <ScrollReveal animation="fade-up">
                <h2 className="exploreTitle" style={{ fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1.1 }}>
                  Explore the<br />World of Crown
                </h2>
                <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-accent2)', margin: '1.5rem 0' }}></div>
                <p className={styles.exploreText}>
                  Crown Findings Co., Inc offers a wide variety of 14K, 18K & Plat. wholesale findings. The decades old family owned & operated business runs on fast and reliable service.
                </p>
              </ScrollReveal>
            </div>
            <div className={styles.exploreVideoSide} style={{ border: 'none', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <ScrollReveal animation="scale-up" duration={700}>
                <iframe
                  className={styles.exploreVideo}
                  src="https://www.youtube.com/embed/i5y6E2C0ULI"
                  title="Explore the World of Crown Findings"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Comments / Testimonials Section */}
      <section className={styles.commentsSection} style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className={styles.container}>
          <div className={styles.commentsSplit}>
            <div className={styles.commentsTextSide}>
              <TestimonialCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className={styles.bottomBanner} style={{ background: 'linear-gradient(rgba(28,33,53,0.9), rgba(28,33,53,0.9)), url(/web-phts/btmbnr.jpg.jpeg)' }}>
        <div className={styles.container}>
          <ScrollReveal animation="fade-up">
            <h3 className="bannerHeadline" style={{ color: 'var(--color-accent2)', fontSize: '2.5rem', marginBottom: '1rem' }}>Experience the Crown Difference</h3>
            <p className={styles.bannerText} style={{ color: 'var(--color-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Elevate your jewelry creations with our premium 14K, 18K, and Platinum wholesale jewelry findings. Our family business combines decades of expertise with unwavering dedication to fast, reliable service.
            </p>
            <Link href="/apply" className="primaryBtn" style={{ padding: '14px 36px', backgroundColor: 'var(--color-cta)', color: '#fff', border: 'none' }}>
              Register for a Wholesale Account
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
