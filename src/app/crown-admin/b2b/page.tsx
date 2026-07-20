'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';
import { B2BApplication, Pagination } from '@/types/admin';

import { ADMIN_API as API } from '@/lib/config';

const STATUS_TABS = [
  { id: '', label: 'All Applications' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function B2BPage() {
  const [applications, setApplications] = useState<B2BApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<B2BApplication | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [search, setSearch] = useState('');

  const fetchApplications = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: String(25) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/b2b?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      setApplications(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchApplications(1); }, [fetchApplications]);

  const handleAction = async (appId: string, action: string) => {
    setIsActioning(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API}/b2b/${appId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: actionNotes })
      });
      if (res.ok) { setSelectedApp(null); setActionNotes(''); fetchApplications(pagination.page); }
    } catch (error) { console.error(error); }
    finally { setIsActioning(false); }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-[#d1a054]/10 text-[#d1a054] border border-[#d1a054]/20';
    if (status === 'rejected') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-[#312f2c]/8 text-[#312f2c]/60 border border-[#312f2c]/15';
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const filteredApps = applications.filter(app =>
    !search ||
    app.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.users?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full gap-6 -m-4 sm:m-0">
      {/* Left Panel: Status Filter */}
      <div className="hidden sm:flex w-64 shrink-0 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm p-6 flex-col">
        <h2 className="text-xl font-bold text-[#312f2c] mb-1">Approvals</h2>
        <p className="text-[#312f2c]/55 text-xs mb-6">Review and manage business registrations</p>

        <div className="space-y-2 flex-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setSelectedApp(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${statusFilter === tab.id
                  ? 'bg-white/70 text-[#d1a054] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/50'
                  : 'text-[#312f2c]/60 hover:bg-white/50 hover:text-[#312f2c] border border-transparent'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="sm:hidden flex overflow-x-auto gap-2 pb-2 mb-4 px-4 custom-scrollbar shrink-0 border-b border-[#312f2c]/5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setSelectedApp(null); }}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${statusFilter === tab.id
                ? 'bg-white/70 text-[#d1a054] shadow-sm border border-white/50'
                : 'text-[#312f2c]/60 hover:bg-white/50 border border-transparent'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Panel: List of Applications */}
      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="flex items-center bg-white/60 p-2.5 border border-white/40 rounded-xl shadow-sm mb-6 w-full max-w-md">
          <Search className="w-4 h-4 text-[#312f2c]/40 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[#312f2c] font-medium placeholder:text-[#312f2c]/40 placeholder:font-normal px-3 w-full outline-none text-sm"
          />
        </div>

        {/* List Grid */}
        <div className="flex-1 overflow-y-auto p-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#312f2c]/35">
              <Building2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No applications found</p>
            </div>
          ) : (
            <div className="flex flex-col min-h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {filteredApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => { setSelectedApp(app); setActionNotes(''); }}
                    className="text-left p-5 bg-white/50 border border-white/60 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:bg-white/80 transition-all duration-300 flex flex-col group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-5 w-full">
                      <div className="w-10 h-10 rounded-xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center shrink-0 border border-[#d1a054]/20 group-hover:scale-110 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0 ${statusBadge(app.approval_status)}`}>
                        {statusIcon(app.approval_status)}
                        {app.approval_status}
                      </span>
                    </div>
                    <div className="min-w-0 w-full">
                      <h3 className="font-bold text-[#312f2c] text-base truncate">{app.company_name || 'Unnamed Company'}</h3>
                      <p className="text-sm text-[#312f2c]/60 truncate font-medium mt-0.5">{app.first_name} {app.last_name}</p>
                      <p className="text-xs text-[#312f2c]/40 mt-4 font-medium">
                        Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#312f2c]/5">
                  <p className="text-xs text-[#312f2c]/40 font-medium">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchApplications(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white text-[#312f2c]/60 hover:text-[#312f2c] disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchApplications(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white text-[#312f2c]/60 hover:text-[#312f2c] disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal for User Details */}
      {selectedApp && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#312f2c]/30 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />

          {/* Modal Content */}
          <div className="relative bg-[#ece9e1]/95 backdrop-blur-xl w-full max-w-5xl max-h-full rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#312f2c]/5 bg-white/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20 shadow-sm">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#312f2c]">{selectedApp.company_name || 'Unnamed Company'}</h3>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1.5 w-fit ${statusBadge(selectedApp.approval_status)}`}>
                    {statusIcon(selectedApp.approval_status)}
                    {selectedApp.approval_status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#312f2c]/50 hover:text-[#312f2c] hover:bg-white hover:shadow-md transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoField label="First Name" value={selectedApp.first_name || '—'} />
                    <InfoField label="Last Name" value={selectedApp.last_name || '—'} />
                    <InfoField label="Email" value={selectedApp.email || '—'} />
                    <InfoField label="Phone" value={selectedApp.phone || '—'} />
                    <InfoField label="Heard about us" value={(selectedApp as any).how_did_you_hear_about_us || '—'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Company Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoField label="Company Name" value={selectedApp.company_name || '—'} />
                    <InfoField label="Company Website" value={selectedApp.company_website || '—'} />
                    <InfoField label="Tax ID / Resale No" value={selectedApp.resale_tax_id_number || '—'} />
                    <InfoField label="Fax" value={selectedApp.fax || '—'} />
                    <InfoField label="Credit Application" value={selectedApp.wants_credit_application || '—'} />
                  </div>
                  {selectedApp.additional_company_details && (
                    <div className="mt-5">
                      <label className="block text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider mb-2">Additional Details</label>
                      <p className="text-sm text-[#312f2c]/80 bg-white/50 rounded-xl p-4 border border-white/60 shadow-sm leading-relaxed">{selectedApp.additional_company_details}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Address Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoField label="Address Line" value={selectedApp.address_line1 || '—'} />
                    <InfoField label="City" value={selectedApp.city || '—'} />
                    <InfoField label="State / Province" value={selectedApp.state || '—'} />
                    <InfoField label="Zip / Postal Code" value={selectedApp.postal_code || '—'} />
                    <InfoField label="Country" value={selectedApp.country || '—'} />
                  </div>
                </div>

                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Uploaded Certificates</h4>
                    <div className="flex gap-3 flex-wrap">
                      {selectedApp.documents.map((doc, idx) => (
                        <a key={idx} href={doc.file_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/70 border border-white/80 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all text-sm font-medium text-[#d1a054]">
                          <FileText className="w-4 h-4" />
                          {doc.original_filename || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.review_notes && (
                  <div>
                    <h4 className="text-sm font-bold text-[#312f2c] border-b border-[#312f2c]/10 pb-2 mb-4 uppercase tracking-wider">Admin Review Notes</h4>
                    <p className="text-sm text-[#312f2c]/80 bg-white/50 rounded-xl p-4 border border-white/60 shadow-sm leading-relaxed">{selectedApp.review_notes}</p>
                  </div>
                )}

                {/* Action Section */}
                {selectedApp.approval_status === 'pending' && (
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
                        onClick={() => handleAction(selectedApp.id, 'approve')}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5] rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Approve Application
                      </button>
                      <button
                        onClick={() => handleAction(selectedApp.id, 'reject')}
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
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <label className="block text-xs text-[#312f2c]/40 uppercase tracking-wider mb-1">{label}</label>
      <p className="text-sm text-[#312f2c] font-medium">{value}</p>
    </div>
  );
}
