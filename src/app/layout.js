import { Montserrat, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export async function generateMetadata() {
  let title = "Crown Findings";
  let description = "B2B Wholesale Jewelry";
  
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

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "https://usa-crown-front.vercel.app"),
    title,
    description,
  };
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${playfair.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-body" suppressHydrationWarning>{children}</body>
    </html>
  );
}
