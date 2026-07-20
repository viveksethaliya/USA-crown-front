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

export const metadata: Metadata = {
  title: "Crown Findings | B2B Wholesale Jewelry",
  description: "Premium B2B wholesale jewelry platform for verified members.",
};

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
      <Toaster position="bottom-right" toastOptions={{ duration: 6000 }} />
    </div>
  );
}
