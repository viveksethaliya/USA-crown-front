'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { FiDownload } from 'react-icons/fi';

const hearAboutLabels: Record<string, string> = {
  google: 'Google Search',
  referral: 'Referral',
  tradeshow: 'Trade Show',
  social: 'Social Media',
  'diamond-district': 'Diamond District Walk-in',
  other: 'Other',
};

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  fax: string;
  company_name: string;
  company_website: string;
  address_line: string;
  city: string;
  state_province: string;
  zip_code: string;
  country: string;
  resale_tax_id: string;
  hear_about: string;
  credit_app: boolean;
  certificate_urls: string[];
  status: string;
  created_at: string;
  newsletter_subscribed: boolean;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterSaving, setNewsletterSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
          credentials: 'include',
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        const u = data.user;
        setProfile(u);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setFax(u.fax || '');
        setCompanyName(u.company_name || '');
        setCompanyWebsite(u.company_website || '');
        setAddressLine(u.address_line || '');
        setCity(u.city || '');
        setStateProvince(u.state_province || '');
        setZipCode(u.zip_code || '');
        setCountry(u.country || '');
        setNewsletterSubscribed(u.newsletter_subscribed || false);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, phone, fax,
          companyName, companyWebsite, addressLine,
          city, stateProvince, zipCode, country,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      window.dispatchEvent(new Event('user-auth-change'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        <div className={styles.header}>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>
            Manage your account details and company information.
          </p>
        </div>

        {/* Account Status Banner */}
        {profile && (
          <div className={styles.statusBanner} style={{
            backgroundColor: profile.status === 'approved' ? '#d4edda' : profile.status === 'rejected' ? '#f8d7da' : '#fff3cd',
            color: profile.status === 'approved' ? '#155724' : profile.status === 'rejected' ? '#721c24' : '#856404',
            borderLeftColor: profile.status === 'approved' ? '#28a745' : profile.status === 'rejected' ? '#dc3545' : '#ffc107',
          }}>
            <strong>Account Status:</strong> {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)} &nbsp;|&nbsp;
            <strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}

        {error && <div className={styles.alert} style={{ backgroundColor: '#f8d7da', color: '#721c24', borderLeftColor: '#dc3545' }}>{error}</div>}
        {success && <div className={styles.alert} style={{ backgroundColor: '#d4edda', color: '#155724', borderLeftColor: '#28a745' }}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Personal Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>First Name <span className={styles.req}>*</span></label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Last Name <span className={styles.req}>*</span></label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={styles.input} required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" value={email} className={styles.inputReadonly} disabled />
              <span className={styles.hint}>Email cannot be changed. Contact support if needed.</span>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone <span className={styles.req}>*</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Fax</label>
                <input type="tel" value={fax} onChange={(e) => setFax(e.target.value)} className={styles.input} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>How did you hear about us?</label>
              <input
                type="text"
                value={profile ? (hearAboutLabels[profile.hear_about] || profile.hear_about || 'N/A') : ''}
                className={styles.inputReadonly}
                disabled
              />
            </div>
          </div>

          {/* Company Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Company Information</h2>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Company Name <span className={styles.req}>*</span></label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Company Website</label>
                <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={styles.input} placeholder="https://" />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Resale / Tax ID</label>
                <input
                  type="text"
                  value={profile?.resale_tax_id || 'N/A'}
                  className={styles.inputReadonly}
                  disabled
                />
                <span className={styles.hint}>Tax ID cannot be changed. Contact support to update.</span>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Credit Application</label>
                <input
                  type="text"
                  value={profile?.credit_app ? 'Yes — Applied for credit' : 'No'}
                  className={styles.inputReadonly}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Address</h2>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Address Line <span className={styles.req}>*</span></label>
              <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className={styles.input} required />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>City <span className={styles.req}>*</span></label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>State / Province <span className={styles.req}>*</span></label>
                <input type="text" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} className={styles.input} required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Zip / Postal Code <span className={styles.req}>*</span></label>
                <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Country <span className={styles.req}>*</span></label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={styles.input} required />
              </div>
            </div>
          </div>

          {/* Uploaded Documents (Read-only) */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Resale Certificates / Documents</h2>

            {profile?.certificate_urls && profile.certificate_urls.length > 0 ? (
              <div className={styles.docList}>
                {profile.certificate_urls.map((url, index) => {
                  const fileName = decodeURIComponent(url.split('/').pop() || `Document ${index + 1}`);
                  return (
                    <div key={index} className={styles.docItem}>
                      <span className={styles.docName}>📄 {fileName}</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.docDownload}
                      >
                        <FiDownload /> View / Download
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noDocText}>No documents on file. Contact support to upload certificates.</p>
            )}
          </div>

          {/* Newsletter Preferences */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Newsletter Preferences</h2>
            <div className={styles.newsletterToggleRow}>
              <div className={styles.newsletterInfo}>
                <span className={styles.newsletterLabel}>Email Newsletter</span>
                <span className={styles.hint}>
                  {newsletterSubscribed
                    ? 'You are receiving updates on new arrivals, metal prices, and deals.'
                    : 'Subscribe to get exclusive updates on new arrivals and wholesale deals.'}
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${newsletterSubscribed ? styles.toggleActive : ''}`}
                disabled={newsletterSaving}
                onClick={async () => {
                  setNewsletterSaving(true);
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/newsletter`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscribed: !newsletterSubscribed }),
                      credentials: 'include',
                    });
                    if (!res.ok) throw new Error('Failed to update');
                    setNewsletterSubscribed(!newsletterSubscribed);
                    setSuccess(newsletterSubscribed ? 'Unsubscribed from newsletter.' : 'Subscribed to newsletter!');
                    setError('');
                  } catch {
                    setError('Failed to update newsletter preference.');
                  } finally {
                    setNewsletterSaving(false);
                  }
                }}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
