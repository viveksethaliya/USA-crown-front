
import Image from 'next/image';
import Link from 'next/link';
import styles from './about-us.module.css';
export const metadata = {
    title: 'About Us | Crown Findings',
    description: 'Learn about Crown Findings, a trusted B2B jewelry findings supplier with over 50 years of experience.',
};

export default function AboutPage() {
    return (
        <main className={styles.main}>
            {/* 1. Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <div className={styles.breadcrumbs}>
                        Home <span>/ About Us</span>
                    </div>
                    <h1 className={styles.heroTitle}>About Us</h1>
                    <p className={styles.heroText}>
                        Explore Crown Findings' comprehensive wholesale jewelry findings catalog, designed to meet the diverse needs of jewelers and crafters. Our extensive collection features premium-quality components, including discs, clasps, chains, jump rings, and more. Crafted with precision and available in a variety of metals such as gold, silver, brass, and stainless steel, each item in our catalog is built to support your creative vision.
                    </p>
                </div>
            </section>

            {/* Who We Are */}
            <section className={styles.whoWeAreSection}>
                <h2 className={styles.whoWeAreTitle}>Who We Are?</h2>
                <div className={styles.whoWeAreContent}>
                    <div className={styles.whoWeAreImageWrapper}>
                        <img src="/web-phts/about.jpg" alt="Crown Findings" className={styles.whoWeAreImage} />
                        <img src="/logo.png" alt="Crown Findings Logo" className={styles.whoWeAreCornerLogo} />
                    </div>
                    <p className={styles.whoWeAreText}>
                        Crown Findings Co., Inc. was established November 8, 1983 and has since flourished to become a leading wholesale jewelry findings business. Located in Manhattan’s iconic Diamond District, Crown Findings has been serving jewelers on the block, across the country, and around the world throughout its lifetime. Since its birth, Crown has provided the jewelry industry with competitive pricing, quality items, and unmatched service and integrity.

                        With decades of experience as a diamond setter and businessman, President Berc Gokberk has established a reliable and unique professional space where business thrives. His dedication, honesty, and drive are unparalleled, making him one of the most well-respected businessmen in the area. Through his efforts, Crown has evolved into a trusted company that takes pride in its role as a family business, as Berc’s brother has been working tirelessly by his side for decades and more recently, his daughter and son-in-law.
                        The decades old company has thousands of loyal customers who have been supporting the business since its beginning.

                        <b>“One of the best parts about being a business owner is having the opportunity to meet new people from different backgrounds,” Berc explains. “I still keep in touch with people I met through Crown 35 years ago.”</b>

                        As the world shifts in the direction of e-commerce and the role of technology becomes increasingly present in our lives, we hope that our website provides you with excellent service and convenience where you can place orders, access our inventory 24/7, get up-to-date pricing and product availability, and chat with us live online.
                    </p>
                </div>
            </section>
            {/* Our Commitment Section */}
            <section className={styles.commitmentSection}>
                <div className={styles.commitmentContent}>
                    <div className={styles.commitmentText}>
                        <span className={styles.sectionLabel}>OUR COMMITMENT</span>

                        <h2 className={styles.commitmentTitle}>
                            Trusted Quality & Reliable Service
                        </h2>

                        <p className={styles.commitmentDescription}>
                            At Crown Findings, we understand the importance of consistency,
                            precision, and dependable service in the jewelry industry.
                            Every product in our inventory is selected with attention to
                            quality, durability, and craftsmanship to support jewelers,
                            manufacturers, and designers in their daily operations.
                        </p>

                        <p className={styles.commitmentDescription}>
                            Our team remains committed to maintaining strong relationships
                            with customers through transparent communication, efficient
                            order fulfillment, and a continuously expanding catalog of
                            wholesale jewelry findings designed to meet evolving industry
                            demands.
                        </p>
                    </div>

                    <div className={styles.commitmentStats}>
                        <div className={styles.statCard}>
                            <h3>40+</h3>
                            <span>Years In Business</span>
                        </div>

                        <div className={styles.statCard}>
                            <h3>Thousands</h3>
                            <span>Of Loyal Customers</span>
                        </div>

                        <div className={styles.statCard}>
                            <h3>24/7</h3>
                            <span>Online Inventory Access</span>
                        </div>
                    </div>
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
