'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Monitor, Globe, Mail, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';

interface AuditLog {
  id: string;
  user_id: number | null;
  login_email: string;
  ip_address: string;
  user_agent: string;
  os_info: string;
  status: 'success' | 'failed';
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        const res = await fetch(`${API_URL}/api/admin/audit/login-history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        
        const data = await res.json();
        setLogs(data);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-[#d1a054] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c]">Audit Logs</h1>
          <p className="text-sm text-[#312f2c]/60 mt-1">
            Monitor all login attempts and security events across the platform.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#312f2c]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f9f8f6] text-[#312f2c]/60 border-b border-[#312f2c]/10">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312f2c]/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f9f8f6]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[#312f2c]/80">
                      <Clock className="w-4 h-4 text-[#312f2c]/40" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#312f2c]/40" />
                      <span className="font-medium text-[#312f2c]">{log.login_email || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                        <ShieldAlert className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#312f2c]/80">
                      <Globe className="w-4 h-4 text-[#312f2c]/40" />
                      <span className="font-mono text-xs bg-[#f0ede5] px-2 py-0.5 rounded">{log.ip_address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#312f2c]/80" title={log.user_agent}>
                      <Monitor className="w-4 h-4 text-[#312f2c]/40" />
                      <span>{log.os_info || 'Unknown OS'}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#312f2c]/40">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
