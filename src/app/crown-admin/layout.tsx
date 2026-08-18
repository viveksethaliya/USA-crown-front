'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import {
  LayoutDashboard, Image, Package, Tag, Tags, SlidersHorizontal, Shapes,
  Users, Building2, LogOut, ChevronRight, Settings, Layout, UsersRound, ShoppingCart, Activity, Ticket, Zap, PercentCircle, ClipboardList, ListOrdered, Megaphone, Undo2, FileText, FormInput, Search
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
      { label: 'Returns', href: '/crown-admin/returns', icon: Undo2 },
      { label: 'Active Carts', href: '/crown-admin/carts', icon: ShoppingCart },
      { label: 'Checkout Fields', href: '/crown-admin/checkout-fields', icon: FormInput },
      { label: 'Settings', href: '/crown-admin/settings', icon: Settings },
    ]
  },
  {
    group: 'Pricing & Discounts',
    items: [
      { label: 'B2B Pricing Groups', href: '/crown-admin/pricing-groups', icon: Megaphone },
      { label: 'Price Lists', href: '/crown-admin/price-lists', icon: ListOrdered },
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
      { label: 'Pages & Blog', href: '/crown-admin/pages', icon: FileText },
      { label: 'Search Synonyms', href: '/crown-admin/synonyms', icon: Search },
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
  const [sessionExpired, setSessionExpired] = useState(false);

  // Any page can fire this to show the modal:
  //   window.dispatchEvent(new CustomEvent('admin:session-expired'))
  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('admin:session-expired', handler);
    return () => window.removeEventListener('admin:session-expired', handler);
  }, []);

  const handleReLogin = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setSessionExpired(false);
    router.push('/crown-admin/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (user) { try { setAdminUser(JSON.parse(user)); } catch (e) { } }

    let isExpired = false;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isExpired = true;
        }
      } catch (e) {
        isExpired = true; // Invalid token format
      }
    }

    if ((!token || isExpired) && pathname !== '/crown-admin/login') {
      if (isExpired) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
      router.push('/crown-admin/login');
    } else if (token && !isExpired) {
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
    <div className="flex h-screen bg-[#f0ede5] text-[#312f2c] font-sans overflow-hidden p-3 gap-3 print:h-auto print:overflow-visible print:bg-white print:p-0 print:block">
      <Toaster position="top-right" toastOptions={{ style: { background: '#312f2c', color: '#f0ede5', border: '1px solid #4a473f' } }} />

      {/* ── Session Expired Modal ── */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#f0ede5] border border-white/60 rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#d1a054]/15 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-[#d1a054]" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#312f2c] mb-1">Session Expired</h2>
              <p className="text-sm text-[#312f2c]/60 leading-relaxed">
                Your login session has expired or is no longer valid. Please sign in again to continue.
              </p>
            </div>
            <button
              onClick={handleReLogin}
              className="w-full flex items-center justify-center gap-2 bg-[#312f2c] hover:bg-[#4a473f] text-[#f0ede5] px-6 py-3 rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              Sign In Again
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[260px] bg-[#e8e4d8]/50 backdrop-blur-2xl border border-white/40 rounded-3xl flex flex-col flex-shrink-0 shadow-sm overflow-hidden print:hidden">
        {/* Logo */}
        <div className="h-24 flex items-center justify-center shrink-0 mt-4 mb-2">
          <div className="bg-white/80 border border-white/60 shadow-[0_8px_16px_rgba(0,0,0,0.06)] rounded-2xl p-3.5 flex items-center justify-center transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crown.png" alt="Crown Findings" className="h-10 w-auto object-contain" />
          </div>
        </div>

        {/* User Info & Logout */}
        {adminUser && (
          <div className="flex flex-col items-center gap-2 mb-4 shrink-0 px-4 pb-4 border-b border-black/5 mx-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#312f2c]">{adminUser.username || adminUser.first_name || adminUser.email || 'Admin'}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#d1a054] font-bold mt-0.5">Administrator</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/crown-admin/login');
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-[#312f2c]/60 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        )}

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
      <div className="flex-1 flex flex-col gap-3 overflow-hidden print:overflow-visible">
        {/* Main Content */}
        <main className="flex-1 bg-[#ece9e1]/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm overflow-hidden relative print:bg-transparent print:border-none print:shadow-none print:overflow-visible print:rounded-none">
          <div className="h-full overflow-y-auto p-8 print:h-auto print:overflow-visible print:p-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div key={pathname} className="animate-tab-switch h-full print:h-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
