'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, Save, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/cart';
import { toast } from 'react-hot-toast';
import { adminFetch } from '@/lib/api';

export default function RolePermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  
  // Local state to track changes before saving
  const [rolePermsMap, setRolePermsMap] = useState<Record<number, Set<number>>>({});

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminFetch(apiUrl('/api/admin/permissions/roles'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }),
        adminFetch(apiUrl('/api/admin/permissions'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } })
      ]);

      if (rolesRes.ok && permsRes.ok) {
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();
        
        setRoles(rolesData);
        setPermissions(permsData);

        const initialMap: Record<number, Set<number>> = {};
        rolesData.forEach((r: any) => {
          initialMap[r.id] = new Set(r.permissions);
        });
        setRolePermsMap(initialMap);
      }
    } catch (err) {
      console.error('Error fetching role data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePermission = (roleId: number, permId: number) => {
    setRolePermsMap(prev => {
      const newMap = { ...prev };
      const roleSet = new Set(newMap[roleId]);
      if (roleSet.has(permId)) {
        roleSet.delete(permId);
      } else {
        roleSet.add(permId);
      }
      newMap[roleId] = roleSet;
      return newMap;
    });
  };

  const saveRole = async (roleId: number) => {
    setSaving(true);
    try {
      const permArray = Array.from(rolePermsMap[roleId] || []);
      const res = await adminFetch(apiUrl(`/api/admin/permissions/roles/${roleId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ permissions: permArray })
      });

      if (res.ok) {
        toast.success('Role permissions updated');
      } else {
        toast.error('Failed to update role permissions');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 -m-4 sm:m-0 max-w-7xl mx-auto pb-12">
      <div className="shrink-0 px-4 sm:px-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#312f2c]/50 mb-2">
            <Link href="/crown-admin/settings" className="hover:text-[#d1a054] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide">Role Permissions</h1>
          <p className="text-sm text-[#312f2c]/60 mt-1">Manage what each user role is allowed to access and do.</p>
        </div>
      </div>

      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex flex-col overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#312f2c]/10 bg-white">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#ece9e1]/50 border-b border-[#312f2c]/10">
                  <th className="p-4 text-[#312f2c]/60 text-xs font-bold uppercase tracking-wider w-1/3">
                    Permission
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="p-4 text-center">
                      <div className="text-sm font-bold text-[#312f2c]">{role.name}</div>
                      <button
                        onClick={() => saveRole(role.id)}
                        disabled={saving}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-[#312f2c] text-white text-xs rounded hover:bg-[#d1a054] transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {permissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-[#ece9e1]/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-sm text-[#312f2c]">{perm.name}</div>
                      <div className="text-xs text-[#312f2c]/50 mt-0.5">{perm.description}</div>
                    </td>
                    {roles.map(role => {
                      const hasPerm = rolePermsMap[role.id]?.has(perm.id);
                      return (
                        <td key={role.id} className="p-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasPerm || false}
                              onChange={() => togglePermission(role.id, perm.id)}
                              className="w-5 h-5 rounded border-[#312f2c]/20 text-[#d1a054] focus:ring-[#d1a054] transition-colors cursor-pointer"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
