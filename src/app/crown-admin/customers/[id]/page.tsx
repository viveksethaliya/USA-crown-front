'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Save, X, Edit2, Trash2, Building2, Users, FileText, Eye, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const API = 'http://localhost:5000/api/admin';

const ROLES = [
  { id: 1, name: 'Admin', slug: 'admin' },
  { id: 4, name: 'Customer', slug: 'customer' },
  { id: 5, name: 'Employee', slug: 'employee' }
];

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isCreatingUser = id === 'new';

  const [isLoading, setIsLoading] = useState(!isCreatingUser);
  const [selectedUser, setSelectedUser] = useState<any | null>(isCreatingUser ? { id: 'new' } : null);
  const [formData, setFormData] = useState<any>({
    username: '', email: '', password: '', first_name: '', last_name: '', phone: '',
    how_did_you_hear_about_us: '', role_id: 4, status: 'pending',
    company_name: '', company_website: '', resale_tax_id_number: '', additional_company_details: '',
    fax: '', wants_credit_application: false, credit_application_status: 'not_applicable',
    parent_user_id: '', purchasing_permission: 'can_place_orders', spending_limit: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isCreatingUser);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  
  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API}/customers?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        setAllCustomers(json.data || []);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    };
    fetchAllCustomers();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('User not found');
      const user = await res.json();
      handleSetUser(user);
    } catch (error: any) {
      toast.error(error.message);
      router.push('/crown-admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCreatingUser) return;
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleSetUser = (user: any) => {
    setSelectedUser(user);
    const company = Array.isArray(user.user_company_details) ? user.user_company_details[0] : user.user_company_details;
    setFormData({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      how_did_you_hear_about_us: user.how_did_you_hear_about_us || '',
      role_id: user.roles?.id || 4,
      status: user.status || 'pending',
      password: '',

      company_name: company?.company_name || '',
      company_website: company?.company_website || '',
      resale_tax_id_number: company?.resale_tax_id_number || '',
      additional_company_details: company?.additional_company_details || '',
      fax: company?.fax || '',
      wants_credit_application: company?.wants_credit_application || false,
      credit_application_status: company?.credit_application_status || 'not_applicable',
      
      parent_user_id: user.parent_user_id || '',
      purchasing_permission: user.purchasing_permission || 'can_place_orders',
      spending_limit: user.spending_limit || ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value);
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setCertificateError("File size exceeds 2MB limit.");
        setCertificateFile(null);
      } else {
        setCertificateError(null);
        setCertificateFile(file);
      }
    } else {
      setCertificateFile(null);
      setCertificateError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = { ...formData };
      
      if (certificateFile) {
        const form = new FormData();
        form.append('file', certificateFile);
        form.append('folder', 'resale_certs');
        const uploadRes = await fetch(`${API}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
        if (!uploadRes.ok) throw new Error('Failed to upload certificate');
        const uploadData = await uploadRes.json();
        payload.resale_certificate_url = uploadData.url;
        payload.resale_certificate_name = certificateFile.name;
      }
      
      let res;
      if (isCreatingUser) {
        if (!payload.email || !payload.password || !payload.first_name || !payload.phone) {
          throw new Error('Email, password, first name, and phone are required.');
        }
        res = await fetch(`${API}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        if (!payload.password) delete payload.password;
        res = await fetch(`${API}/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      
      toast.success(isCreatingUser ? 'User created successfully' : 'Profile updated successfully');
      
      if (isCreatingUser) {
        router.push(`/crown-admin/customers/${json.id}`);
      } else {
        setIsEditing(false);
        setCertificateFile(null);
        await fetchUser(); // Refetch to get the latest documents and details
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete document');
      
      setSelectedUser((prev: any) => ({
        ...prev,
        user_documents: prev.user_documents.filter((d: any) => d.id !== docId)
      }));
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Error deleting document");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/crown-admin/customers" className="text-sm text-gray-500 hover:text-white transition-colors mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back to Customers
          </Link>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {isCreatingUser ? 'Create New User' : 'Edit Customer Details'}
          </h2>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSave} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {(selectedUser?.username || selectedUser?.first_name || selectedUser?.email)?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedUser?.username || selectedUser?.first_name || 'New User'}
                </h3>
                {!isCreatingUser && <p className="text-sm text-gray-400">ID: {selectedUser?.id}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm font-medium flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {/* Account Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Account Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCreatingUser && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email {isCreatingUser && '*'}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Password {isCreatingUser ? '*' : '(Leave blank to keep current)'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={isCreatingUser ? "Enter password" : "Enter new password..."}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                  <select name="role_id" value={formData.role_id} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                {Number(formData.role_id) === 5 && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Parent User {isCreatingUser && '*'}</label>
                    <select name="parent_user_id" value={formData.parent_user_id || ''} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">Select a Parent User</option>
                      {allCustomers.filter(c => c.roles?.slug !== 'admin' && c.roles?.slug !== 'sub-user').map(c => (
                        <option key={c.id} value={c.id}>{c.username || c.first_name} ({c.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-User Permissions */}
            {Number(formData.role_id) === 5 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2">Sub-User Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Purchasing Permissions</label>
                    <select name="purchasing_permission" value={formData.purchasing_permission} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="can_view_pricing">Can view pricing only</option>
                      <option value="can_place_orders">Can place orders</option>
                      <option value="view_only">View only (No Pricing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Spending Limit ($ per order)</label>
                    <input type="number" step="0.01" name="spending_limit" value={formData.spending_limit} onChange={handleInputChange} disabled={!isEditing} placeholder="Leave blank for no limit" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">First Name {isCreatingUser && '*'}</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Phone {isCreatingUser && '*'}</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
                {Number(formData.role_id) !== 5 && (
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">How did you hear about us?</label>
                    <input type="text" name="how_did_you_hear_about_us" value={formData.how_did_you_hear_about_us} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                )}
              </div>
            </div>

            {/* Company Details (Hidden for Sub-Users) */}
            {Number(formData.role_id) !== 5 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Company Name</label>
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Company Website</label>
                    <input type="text" name="company_website" value={formData.company_website} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Resale / Tax ID Number</label>
                    <input type="text" name="resale_tax_id_number" value={formData.resale_tax_id_number} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Upload Resale Certificate (Max 2MB)</label>
                    <input type="file" onChange={handleFileChange} disabled={!isEditing} accept=".pdf,image/*" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-1.5 text-gray-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
                    {certificateError && <p className="text-red-500 text-xs mt-1">{certificateError}</p>}
                    {certificateFile && <p className="text-emerald-500 text-xs mt-1">Ready to upload: {certificateFile.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Fax</label>
                    <input type="text" name="fax" value={formData.fax} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="wants_credit_application" checked={formData.wants_credit_application} onChange={handleInputChange} disabled={!isEditing} className="w-4 h-4 rounded border-gray-800 bg-gray-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed" id="wants_credit" />
                    <label htmlFor="wants_credit" className="text-sm text-gray-300">Wants Credit Application</label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Credit Application Status</label>
                    <select name="credit_application_status" value={formData.credit_application_status} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                      <option value="not_applicable">Not Applicable</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 uppercase mb-1">Additional Company Details</label>
                    <textarea name="additional_company_details" value={formData.additional_company_details} onChange={handleInputChange} rows={3} disabled={!isEditing} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

            {/* Child Sub-Users */}
            {!isCreatingUser && selectedUser?.sub_users && selectedUser.sub_users.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Child Sub-Users
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.sub_users.map((sub: any) => (
                    <div key={sub.id} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between shadow-inner">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-white truncate">{sub.username || sub.first_name}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{sub.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                          {sub.status || 'pending'}
                        </span>
                        <Link href={`/crown-admin/customers/${sub.id}`} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {!isCreatingUser && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-indigo-400 border-b border-gray-800 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents
              </h4>
              {selectedUser?.user_documents && selectedUser.user_documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.user_documents.map((doc: any) => (
                    <div key={doc.id} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between shadow-inner">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-white truncate" title={doc.original_filename}>{doc.original_filename}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{doc.document_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors" title="View Document">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="Delete Document">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 text-center">
                  <p className="text-gray-500 text-sm">No documents uploaded for this user.</p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="p-6 border-t border-gray-800 bg-gray-900 rounded-b-2xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isCreatingUser) {
                    router.push('/crown-admin/customers');
                  } else {
                    setIsEditing(false);
                    handleSetUser(selectedUser); // Reset
                  }
                }}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : (isCreatingUser ? 'Create User' : 'Save Changes')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
