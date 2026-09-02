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
      if (settings.seo_default_description) description = settings.seo_default_description;
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

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`storefront-root flex flex-col min-h-full w-full ${playfair.variable} ${outfit.variable}`}>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      <Toaster position="top-right" toastOptions={{ duration: 6000 }} />
    </div>
  );
}
