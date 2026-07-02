'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Clock, CheckCircle2, XCircle, Loader2,
  ChevronLeft, ChevronRight, Search, FileText, Globe, Phone, Mail
} from 'lucide-react';
import { B2BApplication, Pagination } from '@/types/admin';

const API = 'http://localhost:5000/api/admin';

const STATUS_TABS = [
  { id: '', label: 'All Applications' },
  { id: 'pending', label: 'Pending', color: 'text-amber-400' },
  { id: 'approved', label: 'Approved', color: 'text-emerald-400' },
  { id: 'rejected', label: 'Rejected', color: 'text-red-400' },
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

      const res = await fetch(`${API}/b2b?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      if (res.ok) {
        setSelectedApp(null);
        setActionNotes('');
        fetchApplications(pagination.page);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActioning(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (status === 'rejected') return 'bg-red-500/10 text-red-400 border border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Approvals
        </h2>
        <p className="text-gray-400 text-sm mt-1">Review and approve business registration requests</p>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-gray-800 gap-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setSelectedApp(null); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Applications list */}
        <div className="lg:col-span-1 space-y-3">
          {/* Search */}
          <div className="flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl">
            <Search className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white px-3 py-1 w-full outline-none text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No applications found</p>
            </div>
          ) : (
            filteredApps.map(app => (
              <button
                key={app.id}
                onClick={() => { setSelectedApp(app); setActionNotes(''); }}
                className={`w-full text-left p-4 bg-gray-900 border rounded-xl transition-all ${
                  selectedApp?.id === app.id
                    ? 'border-indigo-500/50 shadow-lg shadow-indigo-900/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{app.company_name || 'Unnamed Company'}</p>
                      <p className="text-xs text-gray-500 truncate">{app.first_name} {app.last_name}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusBadge(app.approval_status)}`}>
                    {statusIcon(app.approval_status)}
                    {app.approval_status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 ml-10">
                  {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-2">
          {!selectedApp ? (
            <div className="h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-600">
              <div>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select an application</p>
                <p className="text-sm mt-1">Click any application on the left to review the details</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              {/* Detail Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedApp.company_name || 'Unnamed Company'}</h3>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium inline-flex w-fit ${statusBadge(selectedApp.approval_status)}`}>
                      {statusIcon(selectedApp.approval_status)}
                      {selectedApp.approval_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Fields */}
              <div className="p-6 space-y-6">
                
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="First Name" value={selectedApp.first_name || '—'} />
                    <InfoField label="Last Name" value={selectedApp.last_name || '—'} />
                    <InfoField label="Email" value={selectedApp.email || '—'} />
                    <InfoField label="Phone" value={selectedApp.phone || '—'} />
                    <InfoField label="How did you hear about us" value={(selectedApp as any).how_did_you_hear_about_us || '—'} />
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h4 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Company Name" value={selectedApp.company_name || '—'} />
                    <InfoField label="Company Website" value={selectedApp.company_website || '—'} />
                    <InfoField label="Resale / Tax ID Number" value={selectedApp.resale_tax_id_number || '—'} />
                    <InfoField label="Fax" value={selectedApp.fax || '—'} />
                    <InfoField label="Wants Credit Application" value={selectedApp.wants_credit_application || '—'} />
                  </div>
                  {selectedApp.additional_company_details && (
                    <div className="mt-4">
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Additional Company Details</label>
                      <p className="text-sm text-gray-300 bg-gray-950 rounded-lg p-3 border border-gray-800">{selectedApp.additional_company_details}</p>
                    </div>
                  )}
                </div>

                {/* Address Details */}
                <div>
                  <h4 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 mb-3">Address Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Address Line" value={selectedApp.address_line1 || '—'} />
                    <InfoField label="City" value={selectedApp.city || '—'} />
                    <InfoField label="State / Province" value={selectedApp.state || '—'} />
                    <InfoField label="Postal / Zip Code" value={selectedApp.postal_code || '—'} />
                    <InfoField label="Country" value={selectedApp.country || '—'} />
                  </div>
                </div>

                {/* Documents */}
                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 mb-3">Uploaded Certificates</h4>
                    <div className="flex gap-3 flex-wrap">
                      {selectedApp.documents.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg hover:border-indigo-500/50 transition-colors text-sm text-indigo-400"
                        >
                          <FileText className="w-4 h-4" />
                          {doc.original_filename || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.review_notes && (
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Admin Review Notes</label>
                    <p className="text-sm text-gray-400 bg-gray-950 rounded-lg p-3 border border-gray-800">{selectedApp.review_notes}</p>
                  </div>
                )}

                {/* Action Section — only show if still pending */}
                {selectedApp.approval_status === 'pending' && (
                  <div className="pt-4 border-t border-gray-800 space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Review Notes (optional)</label>
                    <textarea
                      rows={3}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Add notes that will be saved with this decision..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(selectedApp.id, 'approve')}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                      >
                        {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Approve Application
                      </button>
                      <button
                        onClick={() => handleAction(selectedApp.id, 'reject')}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-300 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Reject Application
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value }: { icon?: any, label: string, value: any }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <p className="text-sm text-gray-200 font-medium">{value}</p>
    </div>
  );
}
