'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Image, Package, Tag, Tags, SlidersHorizontal, Shapes,
  Users, Building2, LogOut, ChevronRight
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

interface NavLinkProps {
  href: string;
  icon: any;
  label: string;
  exact?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

type NavElement = NavItem | NavGroup;

const NAV: NavElement[] = [
  { label: 'Dashboard', href: '/crown-admin', icon: LayoutDashboard, exact: true },
  { label: 'Media Library', href: '/crown-admin/media', icon: Image, exact: false },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', href: '/crown-admin/products', icon: Package },
      { label: 'Categories', href: '/crown-admin/categories', icon: Shapes },
      { label: 'Tags', href: '/crown-admin/tags', icon: Tags },
      { label: 'Brands', href: '/crown-admin/brands', icon: Tag },
      { label: 'Attributes', href: '/crown-admin/attributes', icon: SlidersHorizontal },
    ]
  },
  {
    group: 'Users & B2B',
    items: [
      { label: 'Customers', href: '/crown-admin/customers', icon: Users },
      { label: 'Approvals', href: '/crown-admin/b2b', icon: Building2 },
    ]
  },
];

function NavLink({ href, icon: Icon, label, exact }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
        isActive
          ? 'bg-blue-600/20 text-blue-400 shadow-sm shadow-blue-900/10'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
      {label}
      {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-500" />}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (user) { try { setAdminUser(JSON.parse(user)); } catch (e) {} }

    if (!token && pathname !== '/crown-admin/login') {
      router.push('/crown-admin/login');
    } else if (token) {
      setIsAuthenticated(true);
      if (pathname === '/crown-admin/login') router.push('/crown-admin');
    }
    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === '/crown-admin/login') return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />
      {children}
    </>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
      {/* Sidebar */}
      <aside className="w-60 bg-gray-950 border-r border-gray-800/80 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800/80 shrink-0">
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Crown Admin
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item, i) => {
            if (!('group' in item)) {
              return <NavLink key={i} {...item} />;
            }
            return (
              <div key={i} className="pt-4 first:pt-0">
                <p className="px-3 pb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                  {item.group}
                </p>
                <div className="space-y-0.5">
                  {item.items.map((link, j) => (
                    <NavLink key={j} {...link} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-900/30">
        <header className="h-16 border-b border-gray-800/80 flex items-center px-8 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
          <div className="ml-auto flex items-center gap-6">
            {adminUser && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-200">{adminUser.username || adminUser.first_name || adminUser.email || 'Admin'}</p>
                <p className="text-xs text-indigo-400 font-medium">Administrator</p>
              </div>
            )}
            <div className="w-px h-8 bg-gray-800"></div>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/crown-admin/login');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

