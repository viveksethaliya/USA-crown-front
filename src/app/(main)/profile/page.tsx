'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';
import { FiDownload, FiShoppingBag, FiPlus } from 'react-icons/fi';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  created_at: string;
  roles: { name: string }[];
}

interface CompanyProfile {
  company_name: string;
  company_address: string;
  company_phone: string;
  website: string;
  tax_id: string;
  resale_certificate_url: string;
}

interface SubUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  is_active: boolean;
  created_at: string;
  roles: { name: string }[];
}

export default function ProfilePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'subusers'>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Personal Form
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Company Form
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Sub-users
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [newSubUserName, setNewSubUserName] = useState('');
  const [newSubUserEmail, setNewSubUserEmail] = useState('');
  const [newSubUserMobile, setNewSubUserMobile] = useState('');
  const [newSubUserPassword, setNewSubUserPassword] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, companyRes, usersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/profile`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/company`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/users`, { credentials: 'include' }).catch(() => null)
        ]);

        if (profileRes.status === 401) {
          router.push('/login');
          return;
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setFullName(data.full_name || '');
          setMobile(data.mobile || '');
          setEmail(data.email || '');
        }

        if (companyRes.ok) {
          const cData = await companyRes.json();
          setCompany(cData);
          setCompanyName(cData.company_name || '');
          setCompanyWebsite(cData.website || '');
          setCompanyAddress(cData.company_address || '');
          setCompanyPhone(cData.company_phone || '');
        }

        if (usersRes && usersRes.ok) {
          const uData = await usersRes.json();
          if (Array.isArray(uData)) setSubUsers(uData);
        }

      } catch (err: any) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, mobile }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          website: companyWebsite,
          company_address: companyAddress,
          company_phone: companyPhone
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update company. Sub-users cannot update company profile.');
      setSuccess('Company info updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newSubUserName,
          email: newSubUserEmail,
          mobile: newSubUserMobile,
          password: newSubUserPassword
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create sub-user. Sub-users cannot create other users.');
      const data = await res.json();
      setSubUsers([...subUsers, data]);
      setSuccess('Sub-user created successfully!');
      setNewSubUserName(''); setNewSubUserEmail(''); setNewSubUserMobile(''); setNewSubUserPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubUser = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
        credentials: 'include',
      });
      if (res.ok) {
        setSubUsers(subUsers.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ textAlign: 'center', padding: '4rem', fontWeight: 600 }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>My Account</h1>
            <p className={styles.subtitle}>Manage your details, company, and team.</p>
          </div>
          <Link href="/orders" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#000', color: '#fff', padding: '0.5rem 1rem',
            borderRadius: '4px', textDecoration: 'none', fontWeight: 600
          }}>
            <FiShoppingBag /> My Orders
          </Link>
        </div>

        {error && <div className={styles.alert} style={{ backgroundColor: '#f8d7da', color: '#721c24', borderLeftColor: '#dc3545' }}>{error}</div>}
        {success && <div className={styles.alert} style={{ backgroundColor: '#d4edda', color: '#155724', borderLeftColor: '#28a745' }}>{success}</div>}

        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${activeTab === 'personal' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('personal')}>Personal Profile</button>
          <button className={`${styles.tabBtn} ${activeTab === 'company' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('company')}>Company Info</button>
          <button className={`${styles.tabBtn} ${activeTab === 'subusers' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('subusers')}>Team / Sub-Users</button>
        </div>

        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonal} className={styles.form}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Details</h2>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <input type="email" value={email} className={styles.inputReadonly} disabled />
                <span className={styles.hint}>Email cannot be changed. Contact support to update.</span>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mobile <span className={styles.req}>*</span></label>
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className={styles.input} required />
              </div>
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}

        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompany} className={styles.form}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Company Information</h2>
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Company Name <span className={styles.req}>*</span></label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Company Website</label>
                  <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={styles.input} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Company Address <span className={styles.req}>*</span></label>
                <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Company Phone</label>
                  <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tax ID</label>
                  <input type="text" value={company?.tax_id || ''} className={styles.inputReadonly} disabled />
                  <span className={styles.hint}>Tax ID cannot be changed. Contact support to update.</span>
                </div>
              </div>

              {company?.resale_certificate_url && (
                <div className={styles.docList} style={{ marginTop: '1rem' }}>
                  <div className={styles.docItem}>
                    <span className={styles.docName}>📄 Resale Certificate</span>
                    <a href={company.resale_certificate_url} target="_blank" rel="noopener noreferrer" className={styles.docDownload}>
                      <FiDownload /> View
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}

        {activeTab === 'subusers' && (
          <div className={styles.form}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Team Members</h2>
              {subUsers.length === 0 ? (
                <p className={styles.noDocText}>You do not have any sub-users. Add team members below.</p>
              ) : (
                <div className={styles.subUserList}>
                  {subUsers.map(user => (
                    <div key={user.id} className={styles.subUserCard}>
                      <div className={styles.subUserInfo}>
                        <div className={styles.subUserName}>{user.full_name} ({user.username})</div>
                        <div className={styles.subUserEmail}>{user.email} | {user.mobile}</div>
                        <div style={{ fontSize: '0.8rem', color: user.is_active ? 'green' : 'red', fontWeight: 600 }}>
                          Status: {user.is_active ? 'Active' : 'Deactivated'}
                        </div>
                      </div>
                      <div className={styles.subUserActions}>
                        <button 
                          className={`${styles.btnSmall} ${user.is_active ? styles.btnSmallDanger : ''}`} 
                          onClick={() => handleToggleSubUser(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Add New Team Member</h2>
              <form onSubmit={handleAddSubUser} className={styles.row}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                  <input type="text" value={newSubUserName} onChange={(e) => setNewSubUserName(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email <span className={styles.req}>*</span></label>
                  <input type="email" value={newSubUserEmail} onChange={(e) => setNewSubUserEmail(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Mobile <span className={styles.req}>*</span></label>
                  <input type="tel" value={newSubUserMobile} onChange={(e) => setNewSubUserMobile(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Password <span className={styles.req}>*</span></label>
                  <input type="password" value={newSubUserPassword} onChange={(e) => setNewSubUserPassword(e.target.value)} className={styles.input} required minLength={8} />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? 'Creating...' : <><FiPlus /> Create User</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
