'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Search, Trash2, Loader2, ChevronLeft, ChevronRight,
  Mail, Edit2, Download, Upload, CheckCircle2, XCircle, FileText, Building2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Pagination } from '@/types/admin';
import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

function CustomersPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Review Modal State ─────────────────────────────────────────────────
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);   // the customer row
  const [approvalData, setApprovalData] = useState<any | null>(null);   // full b2b detail
  const [isLoadingApproval, setIsLoadingApproval] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  // ── Debounce search ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch customers ────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: String(25) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter) params.set('role', roleFilter);
      if (yearFilter) params.set('year', yearFilter);
      const res = await adminFetch(`${API}/customers?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      setCustomers(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, yearFilter]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  // ── URL-driven auto-open for notification bar deep-link ───────────────
  // If ?review=<id> is present, auto-open that customer's modal
  const autoOpenRef = useRef(false);
  useEffect(() => {
    const reviewId = searchParams.get('review');
    if (reviewId && !autoOpenRef.current) {
      autoOpenRef.current = true;
      openReviewModal({ id: reviewId });
      // Clean the URL
      router.replace('/crown-admin/customers', { scroll: false });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open review modal ──────────────────────────────────────────────────
  const openReviewModal = async (customer: any) => {
    setReviewTarget(customer);
    setApprovalData(null);
    setActionNotes('');
    setIsLoadingApproval(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`${API}/b2b/${customer.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingApproval(false);
    }
  };

  const closeReviewModal = () => {
    setReviewTarget(null);
    setApprovalData(null);
    setActionNotes('');
  };

  // ── Approve / Reject ──────────────────────────────────────────────────
  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!reviewTarget) return;
    setIsActioning(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`${API}/b2b/${reviewTarget.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: actionNotes })
      });
      if (!res.ok) throw new Error('Action failed');
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      // Update row in-place without full reload
      setCustomers(prev => prev.map(c =>
        c.id === reviewTarget.id ? { ...c, status: newStatus } : c
      ));
      toast.success(action === 'approve' ? 'Customer approved — welcome email sent.' : 'Customer rejected — notification email sent.');
      closeReviewModal();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsActioning(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username || id}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      await adminFetch(`${API}/customers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchCustomers(pagination.page);
    } catch (error) { console.error(error); }
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await adminFetch(`${API}/customers/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminFetch(`${API}/customers/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      alert(`Import complete: ${data.imported} created, ${data.updated} updated, ${data.failed} failed.`);
      fetchCustomers(1);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Badges / Status helpers ────────────────────────────────────────────
  const getRoleBadge = (roles: any) => {
    if (!roles) return null;
    const colors: Record<string, string> = {
      admin: 'bg-[#312f2c]/10 text-[#312f2c] border-[#312f2c]/20',
      customer: 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20',
      wholesale: 'bg-[#d1a054]/15 text-[#d1a054] border-[#d1a054]/25',
      employee: 'bg-[#312f2c]/8 text-[#312f2c]/70 border-[#312f2c]/15',
      'sub-user': 'bg-[#312f2c]/8 text-[#312f2c]/70 border-[#312f2c]/15',
      b2b: 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20',
    };
    const cls = colors[roles.slug] || 'bg-[#312f2c]/6 text-[#312f2c]/60 border-[#312f2c]/10';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${cls}`}>
        {roles.name}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-[#d1a054]';
    if (status === 'pending') return 'text-amber-600';
    if (status === 'rejected') return 'text-red-500';
    if (status === 'suspended') return 'text-[#312f2c]/40';
    return 'text-[#312f2c]/50';
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-[#d1a054]/10 text-[#d1a054] border border-[#d1a054]/20';
    if (status === 'rejected') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
  };

  // ── Modal field helper ─────────────────────────────────────────────────
  const InfoField = ({ label, value }: { label: string; value: any }) => (
    <div>
      <label className="block text-xs text-[#312f2c]/40 uppercase tracking-wider mb-1">{label}</label>
      <p className="text-sm text-[#312f2c] font-medium">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Customers</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">{pagination.total} registered accounts</p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/60 p-2 border border-[#312f2c]/10 rounded-xl flex-grow sm:flex-grow-0">
            <Search className="w-5 h-5 text-[#312f2c]/35 ml-2" />
            <input
              type="text"
              placeholder="Search by ID, Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-1 w-64 outline-none text-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-3 py-2.5 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="sub-user">Sub-User</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-xl px-3 py-2.5 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none"
          >
            <option value="">All Years</option>
            {Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import
          </button>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />

          <Link
            href={`${API}/customers/template`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#312f2c]/10 text-[#312f2c]/70 hover:bg-[#312f2c]/5 rounded-xl font-medium transition-colors shadow-sm"
          >
            Template
          </Link>

          <Link
            href="/crown-admin/customers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-xl font-medium transition-colors shadow-sm"
          >
            Create User
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#312f2c]/60">
            <thead className="bg-[#312f2c]/5 text-xs uppercase text-[#312f2c]/40 border-b border-[#312f2c]/10">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Total Spent</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Last Login</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312f2c]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#312f2c]/40">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-[#312f2c]/4 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#312f2c]">{customer.username || '-'}</span>
                        <span className="text-xs text-[#312f2c]/60 mt-0.5">
                          {customer.first_name || ''} {customer.last_name || ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.totalSpent || 0)}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#312f2c]/35" />
                      <span className="text-[#312f2c]/70">{customer.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {getRoleBadge(customer.roles)}
                        {customer.parent_user_id && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-[#312f2c]/50 tracking-wide">
                            <span className="text-[#312f2c]/30">↳</span>
                            {customer.parent ? (
                              <Link 
                                href={`/crown-admin/customers/${customer.parent_user_id}`} 
                                className="hover:text-[#d1a054] hover:underline transition-colors truncate max-w-[140px]" 
                                title="Parent Account"
                              >
                                {customer.parent.user_company_details?.company_name || `${customer.parent.first_name || ''} ${customer.parent.last_name || ''}`.trim() || 'Parent Account'}
                              </Link>
                            ) : (
                              <span title="Parent account unavailable">Unknown Parent</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#312f2c]/50">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#312f2c]/50">
                      {customer.last_login_at ? new Date(customer.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {/* Approve/Reject — only for pending */}
                      {customer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openReviewModal(customer)}
                            className="p-2 text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors mr-1 inline-flex"
                            title="Approve / Review Application"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReviewModal(customer)}
                            className="p-2 text-red-400/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mr-1 inline-flex"
                            title="Reject Application"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* Edit — always */}
                      <Link
                        href={`/crown-admin/customers/${customer.id}`}
                        className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded-lg transition-colors mr-1 inline-flex"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {/* Delete — not for admins */}
                      {customer.roles?.slug !== 'admin' && (
                        <button
                          onClick={() => handleDelete(customer.id, customer.username)}
                          className="p-2 text-[#312f2c]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#312f2c]/10">
            <button onClick={() => fetchCustomers(pagination.page - 1)} disabled={pagination.page === 1}
              className="p-2 hover:bg-[#312f2c]/8 rounded-lg disabled:opacity-30 transition-colors text-[#312f2c]/50 hover:text-[#312f2c]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#312f2c]/50">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => fetchCustomers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-[#312f2c]/8 rounded-lg disabled:opacity-30 transition-colors text-[#312f2c]/50 hover:text-[#312f2c]">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Review / Approval Modal ─────────────────────────────────────── */}
      {reviewTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#312f2c]/30 backdrop-blur-sm" onClick={closeReviewModal} />

          {/* Modal */}
          <div className="relative bg-[#ece9e1]/95 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="px-8 py-6 border-b border-[#312f2c]/5 bg-white/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20 shadow-sm">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#312f2c]">
                    {approvalData?.company_name || reviewTarget.user_company_details?.[0]?.company_name || 'Reviewing Application'}
                  </h3>
                  {approvalData && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1.5 ${statusBadge(approvalData.approval_status)}`}>
                      {approvalData.approval_status}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#312f2c]/50 hover:text-[#312f2c] hover:bg-white hover:shadow-md transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoadingApproval ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
                </div>
              ) : approvalData ? (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoField label="First Name" value={approvalData.first_name} />
                      <InfoField label="Last Name" value={approvalData.last_name} />
                      <InfoField label="Email" value={approvalData.email} />
                      <InfoField label="Phone" value={approvalData.phone} />
                      <InfoField label="Heard about us" value={approvalData.how_did_you_hear_about_us} />
                    </div>
                  </div>

                  {/* Company Information */}
                  <div>
                    <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Company Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoField label="Company Name" value={approvalData.company_name} />
                      <InfoField label="Company Website" value={approvalData.company_website} />
                      <InfoField label="Tax ID / Resale No" value={approvalData.resale_tax_id_number} />
                      <InfoField label="Fax" value={approvalData.fax} />
                      <InfoField label="Credit Application" value={approvalData.wants_credit_application} />
                    </div>

                  </div>

                  {/* Address Details */}
                  <div>
                    <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Address Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoField label="Address Line" value={approvalData.address_line1} />
                      <InfoField label="City" value={approvalData.city} />
                      <InfoField label="State / Province" value={approvalData.state} />
                      <InfoField label="Zip / Postal Code" value={approvalData.postal_code} />
                      <InfoField label="Country" value={approvalData.country} />
                    </div>
                  </div>

                  {/* Uploaded Certificates */}
                  {approvalData.documents && approvalData.documents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Uploaded Certificates</h4>
                      <div className="flex gap-3 flex-wrap">
                        {approvalData.documents.map((doc: any, idx: number) => (
                          <a key={idx} href={doc.file_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/70 border border-white/80 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all text-sm font-medium text-[#d1a054]">
                            <FileText className="w-4 h-4" />
                            {doc.original_filename || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action section — only for pending */}
                  {approvalData.approval_status === 'pending' && (
                    <div className="pt-6 border-t border-[#312f2c]/10 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider mb-2">Review Notes (Optional)</label>
                        <textarea
                          rows={3}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Add notes that will be saved with this decision..."
                          className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:border-[#d1a054]/40 outline-none resize-none placeholder:text-[#312f2c]/40 shadow-inner"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprovalAction('approve')}
                          disabled={isActioning}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5] rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          Approve Application
                        </button>
                        <button
                          onClick={() => handleApprovalAction('reject')}
                          disabled={isActioning}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500/10 hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-lg text-red-600 hover:text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                          Reject Application
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#312f2c]/40">
                  <p>Could not load application data.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#d1a054] border-t-transparent rounded-full animate-spin" /></div>}>
      <CustomersPageInner />
    </Suspense>
  );
}
