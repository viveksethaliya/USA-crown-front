'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Save, Edit2, Trash2, Building2, Users, FileText, Eye, ChevronLeft, MapPin, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

import { ADMIN_API as API } from '@/lib/config';
const ROLES = [
  { id: 1, name: 'Admin', slug: 'admin' },
  { id: 4, name: 'Customer', slug: 'customer' },
  { id: 5, name: 'Sub-User', slug: 'sub-user' }
];

const inputCls = "w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f0ede5]";
const labelCls = "block text-xs font-medium text-[#312f2c]/55 uppercase tracking-wide mb-1";
const sectionHeadCls = "text-sm font-semibold text-[#d1a054] border-b border-[#312f2c]/10 pb-2 flex items-center gap-2";

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

  // Address Management
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressForm, setAddressForm] = useState<any>({});
  const [isEditingAddress, setIsEditingAddress] = useState<number | 'new' | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API}/customers?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        setAllCustomers(json.data || []);
      } catch (err) { console.error(err); }
    };
    fetchAllCustomers();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/addresses`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setAddresses(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('User not found');
      handleSetUser(await res.json());
      await fetchAddresses();
    } catch (error: any) {
      toast.error(error.message);
      router.push('/crown-admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (!isCreatingUser) fetchUser(); }, [id]);

  const handleSetUser = (user: any) => {
    setSelectedUser(user);
    const company = Array.isArray(user.user_company_details) ? user.user_company_details[0] : user.user_company_details;
    setFormData({
      username: user.username || '', email: user.email || '',
      first_name: user.first_name || '', last_name: user.last_name || '',
      phone: user.phone || '', how_did_you_hear_about_us: user.how_did_you_hear_about_us || '',
      role_id: user.roles?.id || 4, status: user.status || 'pending', password: '',
      company_name: company?.company_name || '', company_website: company?.company_website || '',
      resale_tax_id_number: company?.resale_tax_id_number || '',
      additional_company_details: company?.additional_company_details || '',
      fax: company?.fax || '', wants_credit_application: company?.wants_credit_application || false,
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
      if (file.size > 2 * 1024 * 1024) { setCertificateError("File size exceeds 2MB limit."); setCertificateFile(null); }
      else { setCertificateError(null); setCertificateFile(file); }
    } else { setCertificateFile(null); setCertificateError(null); }
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
        const uploadRes = await fetch(`${API}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
        if (!uploadRes.ok) throw new Error('Failed to upload certificate');
        const uploadData = await uploadRes.json();
        payload.resale_certificate_url = uploadData.url;
        payload.resale_certificate_name = certificateFile.name;
      }
      let res;
      if (isCreatingUser) {
        if (!payload.email || !payload.password || !payload.first_name || !payload.phone) throw new Error('Email, password, first name, and phone are required.');
        res = await fetch(`${API}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      } else {
        if (!payload.password) delete payload.password;
        res = await fetch(`${API}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      toast.success(isCreatingUser ? 'User created successfully' : 'Profile updated successfully');
      if (isCreatingUser) router.push(`/crown-admin/customers/${json.id}`);
      else { setIsEditing(false); setCertificateFile(null); await fetchUser(); }
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
      const res = await fetch(`${API}/customers/${id}/documents/${docId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete document');
      setSelectedUser((prev: any) => ({ ...prev, user_documents: prev.user_documents.filter((d: any) => d.id !== docId) }));
      toast.success("Document deleted successfully");
    } catch { toast.error("Error deleting document"); }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      const token = localStorage.getItem('adminToken');
      const method = isEditingAddress === 'new' ? 'POST' : 'PUT';
      const url = isEditingAddress === 'new'
        ? `${API}/customers/${id}/addresses`
        : `${API}/customers/${id}/addresses/${isEditingAddress}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressForm)
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save address');
      }
      toast.success('Address saved successfully');
      await fetchAddresses();
      setIsEditingAddress(null);
      setAddressForm({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/customers/${id}/addresses/${addressId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete address');
      toast.success("Address deleted successfully");
      await fetchAddresses();
    } catch { toast.error("Error deleting address"); }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d1a054] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <Link href="/crown-admin/customers" className="text-sm text-[#312f2c]/50 hover:text-[#312f2c] transition-colors mb-2 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <h2 className="text-2xl font-bold text-[#312f2c]">
          {isCreatingUser ? 'Create New User' : 'Edit Customer Details'}
        </h2>
      </div>

      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl overflow-hidden">
        <form onSubmit={handleSave} className="flex flex-col h-full">
          {/* Card Header */}
          <div className="p-6 border-b border-[#312f2c]/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d1a054]/15 flex items-center justify-center text-[#d1a054] font-bold text-lg border border-[#d1a054]/20">
                {(selectedUser?.username || selectedUser?.first_name || selectedUser?.email)?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#312f2c]">
                  {selectedUser?.username || selectedUser?.first_name || 'New User'}
                </h3>
                {!isCreatingUser && <p className="text-sm text-[#312f2c]/45">ID: {selectedUser?.id}</p>}
              </div>
            </div>
            {!isEditing && (
              <button type="button" onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg hover:bg-[#d1a054]/20 transition-colors text-sm font-medium flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {/* Account Settings */}
            <div className="space-y-4">
              <h4 className={sectionHeadCls}><FileText className="w-4 h-4" /> Account Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCreatingUser && (
                  <div>
                    <label className={labelCls}>Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Email {isCreatingUser && '*'}</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password {isCreatingUser ? '*' : '(Leave blank to keep current)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} disabled={!isEditing} className={inputCls} placeholder={isCreatingUser ? "Enter password" : "Enter new password..."} />
                </div>
                <div>
                  <label className={labelCls}>Role</label>
                  <select name="role_id" value={formData.role_id} onChange={handleInputChange} disabled={!isEditing} className={inputCls}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} disabled={!isEditing} className={inputCls}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                {Number(formData.role_id) === 5 && (
                  <div className="md:col-span-2">
                    <label className={labelCls}>Parent User {isCreatingUser && '*'}</label>
                    <select name="parent_user_id" value={formData.parent_user_id || ''} onChange={handleInputChange} disabled={!isEditing} className={inputCls}>
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
                <h4 className={sectionHeadCls}>Sub-User Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Purchasing Permissions</label>
                    <select name="purchasing_permission" value={formData.purchasing_permission} onChange={handleInputChange} disabled={!isEditing} className={inputCls}>
                      <option value="can_view_pricing">Can view pricing only</option>
                      <option value="can_place_orders">Can place orders</option>
                      <option value="view_only">View only (No Pricing)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Spending Limit ($ per order)</label>
                    <input type="number" step="0.01" name="spending_limit" value={formData.spending_limit} onChange={handleInputChange} disabled={!isEditing} placeholder="Leave blank for no limit" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4">
              <h4 className={sectionHeadCls}><Users className="w-4 h-4" /> Personal Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelCls}>First Name {isCreatingUser && '*'}</label><input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                <div><label className={labelCls}>Last Name</label><input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                <div><label className={labelCls}>Phone {isCreatingUser && '*'}</label><input type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                {Number(formData.role_id) !== 5 && (
                  <div><label className={labelCls}>How did you hear about us?</label><input type="text" name="how_did_you_hear_about_us" value={formData.how_did_you_hear_about_us} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                )}
              </div>
            </div>

            {/* Company Details */}
            {Number(formData.role_id) !== 5 && (
              <div className="space-y-4">
                <h4 className={sectionHeadCls}><Building2 className="w-4 h-4" /> Company Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Company Name</label><input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                  <div><label className={labelCls}>Company Website</label><input type="text" name="company_website" value={formData.company_website} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                  <div><label className={labelCls}>Resale / Tax ID Number</label><input type="text" name="resale_tax_id_number" value={formData.resale_tax_id_number} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Upload Resale Certificate (Max 2MB)</label>
                    <input type="file" onChange={handleFileChange} disabled={!isEditing} accept=".pdf,image/*"
                      className="w-full bg-white border border-[#312f2c]/12 rounded-lg p-1.5 text-[#312f2c]/60 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#d1a054]/10 file:text-[#d1a054] hover:file:bg-[#d1a054]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
                    {certificateError && <p className="text-red-500 text-xs mt-1">{certificateError}</p>}
                    {certificateFile && <p className="text-[#d1a054] text-xs mt-1">Ready to upload: {certificateFile.name}</p>}
                  </div>
                  <div><label className={labelCls}>Fax</label><input type="text" name="fax" value={formData.fax} onChange={handleInputChange} disabled={!isEditing} className={inputCls} /></div>
                  <div className="flex items-center gap-3 mt-2">
                    <input type="checkbox" name="wants_credit_application" checked={formData.wants_credit_application} onChange={handleInputChange} disabled={!isEditing} className="w-4 h-4 rounded border-[#312f2c]/20 accent-[#d1a054] disabled:opacity-50 disabled:cursor-not-allowed" id="wants_credit" />
                    <label htmlFor="wants_credit" className="text-sm text-[#312f2c]/70">Wants Credit Application</label>
                  </div>
                  <div>
                    <label className={labelCls}>Credit Application Status</label>
                    <select name="credit_application_status" value={formData.credit_application_status} onChange={handleInputChange} disabled={!isEditing} className={inputCls}>
                      <option value="not_applicable">Not Applicable</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Additional Company Details</label>
                    <textarea name="additional_company_details" value={formData.additional_company_details} onChange={handleInputChange} rows={3} disabled={!isEditing} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Child Sub-Users */}
            {!isCreatingUser && selectedUser?.sub_users && selectedUser.sub_users.length > 0 && (
              <div className="space-y-4">
                <h4 className={sectionHeadCls}><Users className="w-4 h-4" /> Child Sub-Users</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.sub_users.map((sub: any) => (
                    <div key={sub.id} className="bg-white/60 p-4 rounded-xl border border-[#312f2c]/10 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-[#312f2c] truncate">{sub.username || sub.first_name}</p>
                        <p className="text-xs text-[#312f2c]/45 mt-1 truncate">{sub.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${sub.status === 'approved' ? 'bg-[#d1a054]/10 text-[#d1a054] border-[#d1a054]/20' : 'bg-[#312f2c]/6 text-[#312f2c]/50 border-[#312f2c]/10'}`}>
                          {sub.status || 'pending'}
                        </span>
                        <Link href={`/crown-admin/customers/${sub.id}`} className="p-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg hover:bg-[#d1a054]/20 transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            {!isCreatingUser && Number(formData.role_id) !== 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#312f2c]/10 pb-2">
                  <h4 className="text-sm font-semibold text-[#d1a054] flex items-center gap-2"><MapPin className="w-4 h-4" /> Addresses</h4>
                  {!isEditingAddress && (
                    <button type="button" onClick={() => { setIsEditingAddress('new'); setAddressForm({}); }} className="px-3 py-1.5 bg-[#312f2c] text-white text-xs rounded-lg hover:bg-[#312f2c]/85 transition-colors flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> Add Address
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="bg-white/60 p-5 rounded-xl border border-[#312f2c]/10 relative">
                    <h5 className="font-semibold text-[#312f2c] mb-4">{isEditingAddress === 'new' ? 'New Address' : 'Edit Address'}</h5>
                    <div className="bg-white/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Type</label>
                        <select value={addressForm.type || 'shipping'} onChange={e => setAddressForm({ ...addressForm, type: e.target.value })} className={inputCls}>
                          <option value="shipping">Shipping</option>
                          <option value="billing">Billing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[#312f2c]">
                          <input type="checkbox" checked={addressForm.is_default || false} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="w-4 h-4 rounded border-[#312f2c]/20 accent-[#d1a054]" />
                          Set as default for this type
                        </label>
                      </div>
                      <div>
                        <label className={labelCls}>Address Line 1 *</label>
                        <input type="text" value={addressForm.address_line1 || ''} onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>Address Line 2</label>
                        <input type="text" value={addressForm.address_line2 || ''} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>City *</label>
                        <input type="text" value={addressForm.city || ''} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>State/Province *</label>
                        <input type="text" value={addressForm.state || ''} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>Zip/Postal Code *</label>
                        <input type="text" value={addressForm.postal_code || ''} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>Country *</label>
                        <input type="text" value={addressForm.country || ''} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input type="text" value={addressForm.phone || ''} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Fax</label>
                        <input type="text" value={addressForm.fax || ''} onChange={e => setAddressForm({ ...addressForm, fax: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button type="button" onClick={() => setIsEditingAddress(null)} className="px-4 py-2 text-sm text-[#312f2c]/60 hover:text-[#312f2c] transition-colors">Cancel</button>
                      <button type="button" onClick={handleSaveAddress} disabled={isSavingAddress} className="px-4 py-2 bg-[#d1a054] text-white text-sm font-medium rounded-lg hover:bg-[#d1a054]/90 transition-colors flex items-center gap-2">
                        {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Address
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {addresses.length === 0 ? (
                      <div className="bg-white/60 p-6 rounded-xl border border-[#312f2c]/10 text-center">
                        <p className="text-[#312f2c]/40 text-sm">No addresses saved.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr: any) => (
                          <div key={addr.id} className="bg-white/60 p-4 rounded-xl border border-[#312f2c]/10 relative group">
                            {addr.is_default && <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-[#d1a054]/10 text-[#d1a054] px-2 py-0.5 rounded-full">Default {addr.type}</span>}
                            <h5 className="font-semibold text-[#312f2c] text-sm capitalize mb-1">{addr.type} Address</h5>
                            <div className="text-sm text-[#312f2c]/70 leading-relaxed mb-4">
                              <p>{addr.address_line1}</p>
                              {addr.address_line2 && <p>{addr.address_line2}</p>}
                              <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                              <p>{addr.country}</p>
                              {addr.phone && <p className="mt-1">Phone: {addr.phone}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { setAddressForm(addr); setIsEditingAddress(addr.id); }} className="p-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg hover:bg-[#d1a054]/20 transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Documents */}
            {!isCreatingUser && (
              <div className="space-y-4">
                <h4 className={sectionHeadCls}><FileText className="w-4 h-4" /> Documents</h4>
                {selectedUser?.user_documents && selectedUser.user_documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.user_documents.map((doc: any) => (
                      <div key={doc.id} className="bg-white/60 p-4 rounded-xl border border-[#312f2c]/10 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-medium text-[#312f2c] truncate" title={doc.original_filename}>{doc.original_filename}</p>
                          <p className="text-xs text-[#312f2c]/40 mt-1 uppercase tracking-wider">{doc.document_type.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg hover:bg-[#d1a054]/20 transition-colors" title="View Document">
                            <Eye className="w-4 h-4" />
                          </a>
                          <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors" title="Delete Document">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/40 p-6 rounded-xl border border-[#312f2c]/10 text-center">
                    <p className="text-[#312f2c]/40 text-sm">No documents uploaded for this user.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="p-6 border-t border-[#312f2c]/10 flex justify-end gap-3">
              <button type="button"
                onClick={() => { if (isCreatingUser) router.push('/crown-admin/customers'); else { setIsEditing(false); handleSetUser(selectedUser); } }}
                className="px-6 py-2.5 text-[#312f2c]/55 hover:text-[#312f2c] hover:bg-[#312f2c]/8 font-medium rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSaving}
                className="px-6 py-2.5 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
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
