import { generateStaticPageMetadata } from "@/utils/pageSeo";

export async function generateMetadata() {
  return generateStaticPageMetadata('/resale-certificate');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
