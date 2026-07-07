'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, Users, Clock } from 'lucide-react';
import Link from 'next/link';

import { ADMIN_API as API } from '@/lib/config';

interface DashboardStats {
  totalProducts: number;
  pendingApprovals: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, pendingApprovals: 0, totalCustomers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await fetch(`${API}/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error('Failed to load stats', err); }
      finally { setIsLoading(false); }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      href: '/crown-admin/products',
      accent: false,
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      href: '/crown-admin/b2b',
      accent: stats.pendingApprovals > 0,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      href: '/crown-admin/customers',
      accent: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#312f2c]">Dashboard Overview</h2>
        <p className="text-[#312f2c]/50 text-sm mt-1">Welcome back to Crown Admin</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#312f2c]/45">
          <Loader2 className="w-4 h-4 animate-spin text-[#d1a054]" /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map(({ label, value, icon: Icon, href, accent }) => (
            <Link key={label} href={href}
              className={`group bg-[#ece9e1] p-6 rounded-xl border transition-all hover:shadow-md relative overflow-hidden ${
                accent ? 'border-[#d1a054]/40' : 'border-[#312f2c]/10 hover:border-[#d1a054]/30'
              }`}>
              {accent && <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d1a054]" />}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[#312f2c]/50 text-xs font-semibold mb-3 uppercase tracking-wider">{label}</h3>
                  <p className={`text-4xl font-bold ${accent ? 'text-[#d1a054]' : 'text-[#312f2c]'}`}>
                    {value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${accent ? 'bg-[#d1a054]/12 text-[#d1a054]' : 'bg-[#312f2c]/6 text-[#312f2c]/40 group-hover:text-[#d1a054] group-hover:bg-[#d1a054]/10 transition-colors'}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-[#312f2c]/35 mt-4 group-hover:text-[#d1a054]/70 transition-colors">View →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
