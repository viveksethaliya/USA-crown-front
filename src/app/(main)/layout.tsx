import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./storefront.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "Crown Findings | B2B Wholesale Jewelry";
  let description = "Premium B2B wholesale jewelry platform for verified members.";
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online'}/api/store/settings`, { 
      next: { revalidate: 60 } 
    });
    if (res.ok) {
      const settings = await res.json();
      if (settings.seo_default_title) title = settings.seo_default_title;
      else if (settings.store_name) title = `${settings.store_name} | B2B Wholesale Jewelry`;
      if (settings.seo_default_description) description = settings.seo_default_description;
      if (settings.robots_site_noindex === true) {
        return { title, description, robots: { index: false, follow: true } };
      }
    }
  } catch (error) {
    console.error("Failed to fetch store settings for metadata:", error);
  }

  return { title, description };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let orgSchema = null;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online'}/api/store/settings`, { 
      next: { revalidate: 60 } 
    });
    if (res.ok) {
      const settings = await res.json();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const storeName = settings.store_name || "Crown Findings";
      
      if (siteUrl && storeName) {
        orgSchema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": storeName,
          "url": siteUrl
        };
        if (settings.seo_default_og_image) {
          orgSchema.logo = settings.seo_default_og_image;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch store settings for org schema:", error);
  }

  return (
    <div className={`storefront-root flex flex-col min-h-full w-full ${playfair.variable} ${outfit.variable}`}>
      {orgSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      )}
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      <Toaster position="top-right" toastOptions={{ duration: 6000 }} />
    </div>
  );
}
