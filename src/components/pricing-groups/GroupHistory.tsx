'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import { Activity, Clock, User, ArrowRight } from 'lucide-react';

export default function GroupHistory({ group }: { group: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [group.id]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    switch(action) {
      case 'create': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">Created</span>;
      case 'update': return <span className="bg-[#312f2c]/10 text-[#312f2c] px-2 py-0.5 rounded text-xs font-semibold uppercase">Updated</span>;
      case 'archive': return <span className="bg-[#312f2c]/15 text-[#312f2c]/80 px-2 py-0.5 rounded text-xs font-semibold uppercase">Archived</span>;
      default: return <span className="bg-[#312f2c]/10 text-[#312f2c]/80 px-2 py-0.5 rounded text-xs font-semibold uppercase">{action}</span>;
    }
  };

  if (loading) {
    return <div className="text-[#312f2c]/50 flex justify-center py-10">Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#312f2c]">Audit History</h2>
        <p className="text-[#312f2c]/50 text-sm mt-1">
          Detailed log of lifecycle changes for rules and campaigns in this group.
        </p>
      </div>

      <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-[#312f2c]/50">
            No audit logs found for this group's entities.
          </div>
        ) : (
          <div className="divide-y divide-[#312f2c]/5">
            {logs.map((log: any) => (
              <div key={log.id} className="p-5 hover:bg-[#312f2c]/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {formatAction(log.action)}
                    <span className="font-semibold text-[#312f2c]/80">
                      {log.entity_type === 'discount_rules' ? 'Rule' : 'Campaign'} ID: {log.entity_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#312f2c]/50">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {log.users?.first_name} {log.users?.last_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {log.action === 'update' && log.before_state && log.after_state && (
                  <div className="mt-3 bg-[#312f2c]/5 rounded border border-[#312f2c]/10 p-3 text-sm grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#312f2c]/50 mb-1 uppercase tracking-wider">Before</div>
                      <pre className="text-[#312f2c]/60 bg-white p-2 rounded border border-[#312f2c]/10 overflow-x-auto text-xs">
                        {JSON.stringify(log.before_state, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#312f2c]/50 mb-1 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> After
                      </div>
                      <pre className="text-[#312f2c]/60 bg-white p-2 rounded border border-[#312f2c]/10 overflow-x-auto text-xs">
                        {JSON.stringify(log.after_state, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {(log.action === 'create' || log.action === 'archive') && log.after_state && (
                   <div className="mt-3 bg-[#312f2c]/5 rounded border border-[#312f2c]/10 p-3 text-sm">
                      <div className="text-xs font-semibold text-[#312f2c]/50 mb-1 uppercase tracking-wider">Snapshot</div>
                      <pre className="text-[#312f2c]/60 bg-white p-2 rounded border border-[#312f2c]/10 overflow-x-auto text-xs max-h-40">
                        {JSON.stringify(log.after_state, null, 2)}
                      </pre>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
