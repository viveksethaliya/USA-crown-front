"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import styles from "./HeroBanner.module.css";

interface Banner {
  id: string;
  heading1: string;
  heading2: string;
  paragraph: string;
  cta_text: string;
  cta_link: string;
  bg_image_desktop: string;
  bg_image_mobile: string;
  overlay_color: string;
  overlay_opacity: number;
  text_color: string;
  text_align: string;
  banner_height: string;
  padding_x: number;
  padding_y: number;
}

const heightMap: Record<string, string> = {
  small: "300px",
  medium: "450px",
  large: "600px",
  fullscreen: "100vh",
};

export default function HeroBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/banners/active`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.banner) {
          setBanner(data.banner);
        }
      } catch {
        // Silently fail — homepage still works without a banner
      } finally {
        setLoaded(true);
      }
    };

    fetchBanner();
  }, []);

  // Don't render anything if no active banner or if user closed it
  if (!loaded || !banner || isHidden) return null;

  const bannerHeight = heightMap[banner.banner_height] || "600px";

  // Decide which image to show
  // On the server render / initial load we don't know viewport,
  // so we use CSS to toggle. But since this is a client component,
  // we can check window width too.
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const bgImage =
    isMobile && banner.bg_image_mobile
      ? banner.bg_image_mobile
      : banner.bg_image_desktop;

  const isExternal =
    banner.cta_link &&
    (banner.cta_link.startsWith("http://") ||
      banner.cta_link.startsWith("https://"));

  return (
    <section className={`${styles.bannerWrapper} ${styles.bannerFadeIn}`}>
      <button 
        className={styles.closeBannerBtn} 
        onClick={() => setIsHidden(true)}
        aria-label="Close Banner"
      >
        <FiX size={20} />
      </button>
      <div
        className={styles.bannerInner}
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : "none",
          minHeight: bannerHeight,
          justifyContent:
            banner.text_align === "left"
              ? "flex-start"
              : banner.text_align === "right"
                ? "flex-end"
                : "center",
        }}
      >
        {/* Overlay */}
        <div
          className={styles.overlay}
          style={{
            backgroundColor: banner.overlay_color,
            opacity: banner.overlay_opacity / 100,
          }}
        />

        {/* Content */}
        <div
          className={styles.content}
          style={{
            color: banner.text_color,
            textAlign: banner.text_align as any,
            padding: `${banner.padding_y}px ${banner.padding_x}px`,
          }}
        >
          {banner.heading1 && (
            <h2 className={styles.heading1}>{banner.heading1}</h2>
          )}
          {banner.heading2 && (
            <h3 className={styles.heading2}>{banner.heading2}</h3>
          )}
          {banner.paragraph && (
            <p
              className={styles.paragraph}
              style={{
                margin:
                  banner.text_align === "center"
                    ? "0 auto 2rem auto"
                    : banner.text_align === "right"
                      ? "0 0 2rem auto"
                      : "0 0 2rem 0",
              }}
            >
              {banner.paragraph}
            </p>
          )}
          {banner.cta_text && banner.cta_link && (
            isExternal ? (
              <a
                href={banner.cta_link}
                className={styles.ctaButton}
                style={{
                  color: banner.text_color,
                  borderColor: banner.text_color,
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {banner.cta_text}
              </a>
            ) : (
              <Link
                href={banner.cta_link}
                className={styles.ctaButton}
                style={{
                  color: banner.text_color,
                  borderColor: banner.text_color,
                }}
              >
                {banner.cta_text}
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
