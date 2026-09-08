import { generateStaticPageMetadata } from "@/utils/pageSeo";

export async function generateMetadata() {
  return generateStaticPageMetadata('/apply');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
