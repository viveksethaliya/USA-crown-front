'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronUp, ChevronDown, X, Building2, Clock } from 'lucide-react';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

const POLL_INTERVAL_MS = 60_000; // 60 seconds
const STORAGE_KEY = 'adminLastSeenPendingCount';

interface PendingApp {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  created_at: string;
}

export default function PendingRegistrationsBar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingApps, setPendingApps] = useState<PendingApp[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch pending registrations ─────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await adminFetch(`${API}/b2b?status=pending&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const json = await res.json();
      const count: number = json.pagination?.total ?? (json.data?.length ?? 0);
      const apps: PendingApp[] = (json.data || []).map((a: any) => ({
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        company_name: a.company_name,
        created_at: a.created_at,
      }));

      setPendingCount(count);
      setPendingApps(apps);

      // "New since last seen" detection:
      // Compare current count with what was stored when admin last dismissed/collapsed.
      const lastSeen = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      if (count > lastSeen) {
        setHasNew(true);
      }
    } catch (err) {
      // silently fail — non-critical
    }
  }, []);

  // ── Initial fetch + polling ─────────────────────────────────────────────
  useEffect(() => {
    fetchPending();
    intervalRef.current = setInterval(fetchPending, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPending]);

  // ── Dismiss / collapse: store current count as "last seen" ─────────────
  const handleCollapse = () => {
    localStorage.setItem(STORAGE_KEY, String(pendingCount));
    setHasNew(false);
    setIsExpanded(false);
  };

  // ── Navigate to Customers list with deep-link for specific customer ─────
  const handleItemClick = (id: string) => {
    setIsExpanded(false);
    router.push(`/crown-admin/customers?review=${id}`);
  };

  // ── Navigate to full Customers list ────────────────────────────────────
  const handleBarClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Don't render if nothing is pending
  if (pendingCount === 0 && !hasNew) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9990] w-full max-w-lg px-4 pb-3 print:hidden">
      {/* Expanded panel */}
      {isExpanded && (
        <div className="mb-2 bg-[#ece9e1]/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#312f2c]/10 bg-white/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-5 h-5 text-[#d1a054]" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </div>
              <span className="font-bold text-[#312f2c] text-sm">Pending Registrations</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/crown-admin/customers')}
                className="text-xs text-[#d1a054] font-semibold hover:underline"
              >
                View All
              </button>
              <button
                onClick={handleCollapse}
                className="w-7 h-7 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-[#312f2c]/50 hover:text-[#312f2c] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pending list */}
          <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {pendingApps.length === 0 ? (
              <div className="py-8 text-center text-[#312f2c]/40 text-sm">
                No pending applications.
              </div>
            ) : (
              pendingApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleItemClick(app.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/50 transition-colors text-left border-b border-[#312f2c]/5 last:border-0 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center shrink-0 border border-[#d1a054]/15 group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#312f2c] truncate">
                      {app.company_name || 'Unnamed Company'}
                    </p>
                    <p className="text-xs text-[#312f2c]/55 truncate">
                      {app.first_name} {app.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#312f2c]/40 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      <button
        onClick={isExpanded ? handleCollapse : handleBarClick}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-[#312f2c] hover:bg-[#3f3c38] text-[#f0ede5] rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Bell className="w-4 h-4" />
            {hasNew && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#312f2c] animate-pulse" />
            )}
          </div>
          <span className="text-sm font-semibold">
            {pendingCount} Pending Registration{pendingCount !== 1 ? 's' : ''}
          </span>
          {hasNew && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
              New
            </span>
          )}
        </div>
        {isExpanded
          ? <ChevronDown className="w-4 h-4 opacity-60" />
          : <ChevronUp className="w-4 h-4 opacity-60" />
        }
      </button>
    </div>
  );
}
