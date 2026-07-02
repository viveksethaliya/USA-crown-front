'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

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
        const res = await fetch(`${API}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
        Dashboard Overview
      </h2>
      
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Total Products</h3>
            <p className="text-4xl font-bold text-white">{stats.totalProducts}</p>
          </div>
          <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden">
            {stats.pendingApprovals > 0 && (
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
            )}
            <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Pending Approvals</h3>
            <p className={`text-4xl font-bold ${stats.pendingApprovals > 0 ? 'text-amber-500' : 'text-white'}`}>
              {stats.pendingApprovals}
            </p>
          </div>
          <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Total Customers</h3>
            <p className="text-4xl font-bold text-white">{stats.totalCustomers}</p>
          </div>
        </div>
      )}
    </div>
  );
}
