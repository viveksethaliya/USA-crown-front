import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  let storeName = 'Crown Findings';
  try {
    const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online'}/api/store/settings`, { next: { revalidate: 60 } });
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings.store_name) storeName = settings.store_name;
    }
  } catch(e) {}
  
  return {
    title: `Blog | ${storeName}`,
    description: `News, insights, and updates from ${storeName}.`,
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
