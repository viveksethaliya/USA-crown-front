"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import styles from "./user-detail.module.css";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";

type Permission = {
  id: string;
  code: string;
  name: string;
  description: string;
};

interface SubUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  mobile: string;
  is_active: boolean;
  roles?: { name: string };
}

export default function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  interface UserAddress {
    id: string;
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
  }

  interface UserData {
    email: string;
    full_name: string;
    mobile: string;
    username: string;
    role_id: string;
    customer_group_id: string;
    is_active: boolean;
    allow_variant_discounts: boolean;
    allow_group_discounts: boolean;
    user_addresses?: UserAddress[];
    company_profiles?: {
      company_name: string;
      tax_id: string;
      industry: string;
    };
    parent_user_id?: string | null;
    parent_company?: {
      company_name: string;
      tax_id: string;
      industry: string;
    };
    parent_group?: {
      name: string;
    };
  }

  const [user, setUser] = useState<UserData | null>(null);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [groups, setGroups] = useState<{id: string, name: string}[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    username: "",
    role_id: "",
    customer_group_id: "",
    is_active: true,
    allow_variant_discounts: true,
    allow_group_discounts: true
  });

  const [companyFormData, setCompanyFormData] = useState({
    company_name: "",
    website: "",
    company_phone: "",
    tax_id: "",
    address_line_1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [isSubUserModalOpen, setIsSubUserModalOpen] = useState(false);
  const [subUserForm, setSubUserForm] = useState({
    first_name: "", last_name: "", email: "", mobile: "", password: "", role_id: ""
  });
  const [savingSubUser, setSavingSubUser] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${params.id}`).then(r => r.json()),
      fetch('/api/admin/roles').then(r => r.json()),
      fetch('/api/admin/customer-groups').then(r => r.json()),
      fetch('/api/admin/permissions').then(r => r.json()),
      fetch(`/api/admin/users/${params.id}/permissions`).then(r => r.json()),
      fetch(`/api/admin/users/${params.id}/sub-users`).then(r => r.json())
    ]).then(([userData, rolesData, groupsData, permsData, userPermsData, subUsersData]) => {
      setUser(userData);
      setRoles(rolesData || []);
      setGroups(groupsData || []);
      setPermissions(permsData || []);
      setUserPermissions(userPermsData || []);
      setSubUsers(subUsersData || []);
      
      if (userData) {
        const profile = userData.parent_user_id ? userData.parent_company : userData.company_profiles;
        const defaultAddress = userData.user_addresses?.find((a: any) => a.is_default_billing) || userData.user_addresses?.[0] || {};
        
        let fname = defaultAddress.first_name || '';
        let lname = defaultAddress.last_name || '';
        if (!fname && !lname && userData.full_name) {
          const parts = userData.full_name.split(' ');
          fname = parts[0] || '';
          lname = parts.slice(1).join(' ') || '';
        }

        setFormData({
          first_name: fname,
          last_name: lname,
          mobile: userData.mobile || "",
          username: userData.username || "",
          role_id: userData.role_id || "",
          customer_group_id: userData.customer_group_id || "",
          is_active: userData.is_active,
          allow_variant_discounts: userData.allow_variant_discounts !== undefined ? userData.allow_variant_discounts : true,
          allow_group_discounts: userData.allow_group_discounts !== undefined ? userData.allow_group_discounts : true
        });

        setCompanyFormData({
          company_name: profile?.company_name || "",
          website: profile?.website || "",
          company_phone: profile?.company_phone || "",
          tax_id: profile?.tax_id || "",
          address_line_1: defaultAddress.address_line_1 || "",
          city: defaultAddress.city || "",
          state: defaultAddress.state || "",
          postal_code: defaultAddress.postal_code || "",
          country: defaultAddress.country || "",
        });
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error("Failed to load user data.");
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          mobile: formData.mobile,
          username: formData.username,
          role_id: formData.role_id,
          customer_group_id: formData.customer_group_id || null,
          is_active: !!formData.is_active,
          allow_variant_discounts: formData.allow_variant_discounts,
          allow_group_discounts: formData.allow_group_discounts
        })
      });
      if (!res.ok) throw new Error("Failed to update user");
      toast.success("User updated successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyFormData)
      });
      if (!res.ok) throw new Error("Failed to update company profile");
      toast.success("Company profile updated successfully.");
      
      const updatedUserRes = await fetch(`/api/admin/users/${params.id}`);
      if (updatedUserRes.ok) {
        setUser(await updatedUserRes.json());
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPerms(true);

    try {
      const res = await fetch(`/api/admin/users/${params.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: userPermissions })
      });
      if (!res.ok) throw new Error("Failed to update user permissions");
      toast.success("User permission overrides updated successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPerms(false);
    }
  };

  const togglePermission = (permId: string) => {
    setUserPermissions(prev => {
      if (prev.includes(permId)) return prev.filter(id => id !== permId);
      return [...prev, permId];
    });
  };

  const handleSendReset = async () => {
    try {
      const res = await fetch(`/api/admin/users/${params.id}/send-reset-email`, { method: 'POST' });
      if (res.ok) {
        toast.success("Password reset link sent to user.");
      } else {
        toast.error("Failed to send reset link.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!confirm("Are you sure you want to manually overwrite this user's password?")) return;
    setSettingPassword(true);

    try {
      const res = await fetch(`/api/admin/users/${params.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (!res.ok) throw new Error("Failed to set new password");
      toast.success("Password manually updated successfully.");
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSettingPassword(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' });
      setFormData(prev => ({ ...prev, is_active: false }));
      toast.success("User deactivated.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSubUser(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/sub-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subUserForm)
      });
      if (!res.ok) throw new Error("Failed to add sub-user");
      
      const newSubUsers = await fetch(`/api/admin/users/${params.id}/sub-users`).then(r => r.json());
      setSubUsers(newSubUsers || []);
      setIsSubUserModalOpen(false);
      setSubUserForm({ full_name: "", email: "", mobile: "", password: "", role_id: "" });
      toast.success("Sub-user added successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSubUser(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!user) return <div className={styles.container}>User not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/crown-admin/users" className={styles.backBtn}><FiArrowLeft /></Link>
          <h1>Edit User: {user.email}</h1>
        </div>
        
        <button onClick={handleSendReset} className={styles.submitBtn} style={{ background: '#4b5563', marginRight: '1rem', marginTop: 0 }} type="button">
          Send Password Reset
        </button>
        <button onClick={handleDeactivate} className={styles.deleteBtn}>
          Deactivate User
        </button>
      </div>

      <div className={styles.card}>
        <h2>Profile Details</h2>
        {user.parent_user_id && (
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#3730a3' }}>
            <strong>Notice:</strong> This is a Sub-User. Role, Customer Group, Company Profile, and Addresses are inherited from the parent organization.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formData.first_name} 
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formData.last_name} 
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            <div className={styles.formGroup}>
              <label>Username</label>
              <input 
                required type="text" className={styles.input} 
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone *</label>
              <input 
                required type="tel" className={styles.input} 
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select 
                className={styles.input} 
                value={formData.is_active ? 'true' : 'false'} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            {!user.parent_user_id && (
              <>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select 
                    required className={styles.input} 
                    value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Customer Group</label>
                  <select 
                    className={styles.input} 
                    value={formData.customer_group_id} onChange={e => setFormData({...formData, customer_group_id: e.target.value})}
                  >
                    <option value="">None</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Variant Discounts</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.allow_variant_discounts} 
                      onChange={e => setFormData({...formData, allow_variant_discounts: e.target.checked})}
                    />
                    Allow User to Apply Variant Discounts
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Group Discounts</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.allow_group_discounts} 
                      onChange={e => setFormData({...formData, allow_group_discounts: e.target.checked})}
                    />
                    Allow User to Apply Group Discounts
                  </label>
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>


      <div className={styles.card}>
        <h2>Set User Password</h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Manually overwrite the user's password. They will be able to log in immediately with the new password.
        </p>
        <form onSubmit={handleSetPassword} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
            <label>New Password</label>
            <input 
              required 
              type="text" 
              className={styles.input} 
              placeholder="Minimum 6 characters"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>
          <button type="submit" disabled={settingPassword} className={styles.submitBtn} style={{ margin: 0 }}>
            {settingPassword ? "Setting..." : "Set Password"}
          </button>
        </form>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.card}>
          <h2>Addresses</h2>
          <ul className={styles.list}>
            {(user.parent_user_id ? user.parent_company : user.company_profiles) === undefined && user.user_addresses?.length === 0 && <p>No addresses found.</p>}
            {user.user_addresses?.map((a) => (
              <li key={a.id} className={styles.listItem}>
                <h4>{a.first_name} {a.last_name}</h4>
                <p>{a.address_line_1} {a.address_line_2}</p>
                <p>{a.city}, {a.state} {a.postal_code}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h2>Company Profile {user.parent_user_id && "(Inherited - Read Only)"}</h2>
          {user.parent_user_id ? (
            <div className={styles.listItem}>
              <h4>{user.parent_company?.company_name}</h4>
              <p>Tax ID: {user.parent_company?.tax_id || 'N/A'}</p>
              <p>Industry: {user.parent_company?.industry || 'N/A'}</p>
              {user.parent_group && (
                <p style={{marginTop: '0.5rem', color: '#4f46e5'}}><strong>Customer Group:</strong> {user.parent_group.name}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleCompanySubmit}>
              <div className={styles.formGroup}>
                <label>Company Name <span className={styles.req}>*</span></label>
                <input required type="text" className={styles.input} value={companyFormData.company_name} onChange={e => setCompanyFormData({...companyFormData, company_name: e.target.value})} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company Website</label>
                  <input type="text" className={styles.input} value={companyFormData.website} onChange={e => setCompanyFormData({...companyFormData, website: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone *</label>
                  <input required type="tel" className={styles.input} value={companyFormData.company_phone} onChange={e => setCompanyFormData({...companyFormData, company_phone: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Resale Tax ID *</label>
                <input required type="text" className={styles.input} value={companyFormData.tax_id} onChange={e => setCompanyFormData({...companyFormData, tax_id: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Address Line <span className={styles.req}>*</span></label>
                <input required type="text" className={styles.input} value={companyFormData.address_line_1} onChange={e => setCompanyFormData({...companyFormData, address_line_1: e.target.value})} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>City <span className={styles.req}>*</span></label>
                  <input required type="text" className={styles.input} value={companyFormData.city} onChange={e => setCompanyFormData({...companyFormData, city: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>State/Province <span className={styles.req}>*</span></label>
                  <input required type="text" className={styles.input} value={companyFormData.state} onChange={e => setCompanyFormData({...companyFormData, state: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Zip Code <span className={styles.req}>*</span></label>
                  <input required type="text" className={styles.input} value={companyFormData.postal_code} onChange={e => setCompanyFormData({...companyFormData, postal_code: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Country <span className={styles.req}>*</span></label>
                  <input required type="text" className={styles.input} value={companyFormData.country} onChange={e => setCompanyFormData({...companyFormData, country: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={savingCompany} className={styles.submitBtn}>
                {savingCompany ? "Saving..." : "Save Company Profile"}
              </button>
            </form>
          )}
        </div>
      </div>

      {!user.parent_user_id && (
        <div className={styles.card}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2>Sub-Users</h2>
          <button type="button" onClick={() => setIsSubUserModalOpen(true)} className={styles.submitBtn} style={{margin: 0, width: 'auto'}}>Add Sub User</button>
        </div>
        
        {subUsers.length === 0 ? (
          <p style={{color: '#666'}}>No sub-users found.</p>
        ) : (
          <table className={styles.table} style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
            <thead>
              <tr style={{textAlign: 'left', borderBottom: '1px solid #ddd'}}>
                <th style={{padding: '0.5rem'}}>First Name</th>
                <th style={{padding: '0.5rem'}}>Last Name</th>
                <th style={{padding: '0.5rem'}}>Email</th>
                <th style={{padding: '0.5rem'}}>Role</th>
                <th style={{padding: '0.5rem'}}>Status</th>
                <th style={{padding: '0.5rem'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {subUsers.map(su => (
                <tr key={su.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '0.5rem'}}>{su.full_name?.split(' ')[0] || ''}</td>
                  <td style={{padding: '0.5rem'}}>{su.full_name?.split(' ').slice(1).join(' ') || ''}</td>
                  <td style={{padding: '0.5rem'}}>{su.email}</td>
                  <td style={{padding: '0.5rem'}}>{su.roles?.name || 'Sub User'}</td>
                  <td style={{padding: '0.5rem'}}>{su.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={{padding: '0.5rem'}}>
                    <Link href={`/crown-admin/users/${su.id}`} style={{color: '#d4af37', textDecoration: 'none'}}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {isSubUserModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "500px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, fontWeight: "bold", color: "#111827" }}>Add Sub User</h2>
              <button onClick={() => setIsSubUserModalOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", lineHeight: 1, color: "#6b7280" }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddSubUser} style={{ overflowY: "auto", paddingRight: "5px" }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#374151" }}>First Name *</label>
                  <input required type="text" style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }} value={subUserForm.first_name} onChange={e => setSubUserForm({...subUserForm, first_name: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#374151" }}>Last Name *</label>
                  <input required type="text" style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }} value={subUserForm.last_name} onChange={e => setSubUserForm({...subUserForm, last_name: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#374151" }}>Email *</label>
                <input required type="email" style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }} value={subUserForm.email} onChange={e => setSubUserForm({...subUserForm, email: e.target.value})} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#374151" }}>Phone *</label>
                <input required type="tel" style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }} value={subUserForm.mobile} onChange={e => setSubUserForm({...subUserForm, mobile: e.target.value})} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#374151" }}>Password *</label>
                <input required type="password" minLength={6} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }} value={subUserForm.password} onChange={e => setSubUserForm({...subUserForm, password: e.target.value})} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px", paddingTop: "15px", borderTop: "1px solid #e5e7eb" }}>
                <button type="button" onClick={() => setIsSubUserModalOpen(false)} style={{ padding: "10px 16px", border: "1px solid #d1d5db", background: "white", color: "#374151", borderRadius: "4px", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
                <button type="submit" disabled={savingSubUser} style={{ padding: "10px 16px", border: "none", background: "#111827", color: "white", borderRadius: "4px", cursor: savingSubUser ? "not-allowed" : "pointer", opacity: savingSubUser ? 0.7 : 1, fontWeight: "500" }}>
                  {savingSubUser ? 'Saving...' : 'Save Sub User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
