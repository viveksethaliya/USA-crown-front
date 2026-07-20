'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Image, Package, Tag, Tags, SlidersHorizontal, Shapes,
  Users, Building2, LogOut, ChevronRight, Settings, Layout, UsersRound, ShoppingCart, Activity, Ticket, Zap, PercentCircle, ClipboardList
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
    group: 'Management',
    items: [
      { label: 'Approvals', href: '/crown-admin/b2b', icon: Building2 },
      { label: 'Orders', href: '/crown-admin/orders', icon: ClipboardList },
      { label: 'Active Carts', href: '/crown-admin/carts', icon: ShoppingCart },
      { label: 'Settings', href: '/crown-admin/settings', icon: Settings },
    ]
  },
  {
    group: 'Pricing & Discounts',
    items: [
      { label: 'Group Pricing', href: '/crown-admin/groups', icon: UsersRound },
      { label: 'Promotions', href: '/crown-admin/discounts', icon: Zap },
      { label: 'Coupon Codes', href: '/crown-admin/coupons', icon: Ticket },
    ]
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', href: '/crown-admin/products', icon: Package },
      { label: 'Categories', href: '/crown-admin/categories', icon: Shapes },
      { label: 'Tags', href: '/crown-admin/tags', icon: Tags },
      { label: 'Collections', href: '/crown-admin/brands', icon: Tag },
      { label: 'Attributes', href: '/crown-admin/attributes', icon: SlidersHorizontal },
    ]
  },
  {
    group: 'Users & Settings',
    items: [
      { label: 'Customers', href: '/crown-admin/customers', icon: Users },
      { label: 'Banner', href: '/crown-admin/banner', icon: Layout },
      { label: 'Audit Logs', href: '/crown-admin/audit-logs', icon: Activity },
    ]
  },
];

function NavLink({ href, icon: Icon, label, exact }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] ${isActive
        ? 'bg-white/60 text-[#312f2c] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-white/40 hover:bg-white/80'
        : 'text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-white/60 border border-transparent'
        }`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[#d1a054]' : ''
          }`}
      />
      {label}
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#d1a054] ml-auto shadow-[0_0_4px_rgba(209,160,84,0.5)]"></div>}
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
    if (user) { try { setAdminUser(JSON.parse(user)); } catch (e) { } }

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
      <div className="min-h-screen flex items-center justify-center bg-[#f0ede5]">
        <div className="w-8 h-8 border-2 border-[#d1a054] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === '/crown-admin/login') return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#312f2c', color: '#f0ede5' } }} />
      {children}
    </>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#f0ede5] text-[#312f2c] font-sans overflow-hidden p-3 gap-3">
      <Toaster position="top-right" toastOptions={{ style: { background: '#312f2c', color: '#f0ede5', border: '1px solid #4a473f' } }} />

      {/* Sidebar */}
      <aside className="w-[260px] bg-[#e8e4d8]/50 backdrop-blur-2xl border border-white/40 rounded-3xl flex flex-col flex-shrink-0 shadow-sm overflow-hidden">
        {/* Logo */}
        <div className="h-24 flex items-center justify-center shrink-0 mt-4 mb-2">
          <div className="bg-white/80 border border-white/60 shadow-[0_8px_16px_rgba(0,0,0,0.06)] rounded-2xl p-3.5 flex items-center justify-center transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crown.png" alt="Crown Findings" className="h-10 w-auto object-contain" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {NAV.map((item, i) => {
            if (!('group' in item)) {
              return <NavLink key={i} {...item} />;
            }
            return (
              <div key={i} className="pt-5 first:pt-2">
                <p className="px-3 pb-2 text-[11px] font-bold text-[#312f2c]/40 uppercase tracking-widest">
                  {item.group}
                </p>
                <div className="space-y-1">
                  {item.items.map((link, j) => (
                    <NavLink key={j} {...link} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Navbar */}
        <header className="h-20 bg-[#ece9e1]/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex items-center px-8 shrink-0 z-10">
          <div className="ml-auto flex items-center gap-6">
            {adminUser && (
              <div className="text-right">
                <p className="text-sm font-semibold text-[#312f2c]">{adminUser.username || adminUser.first_name || adminUser.email || 'Admin'}</p>
                <p className="text-xs text-[#d1a054] font-medium">Administrator</p>
              </div>
            )}
            <div className="w-px h-8 bg-[#312f2c]/10"></div>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/crown-admin/login');
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-white/50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-[#ece9e1]/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden relative">
          <div className="h-full overflow-y-auto p-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div key={pathname} className="animate-tab-switch h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
