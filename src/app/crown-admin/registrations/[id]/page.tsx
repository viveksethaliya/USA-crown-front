"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../admin.module.css";
import { FiArrowLeft, FiCheck, FiX, FiDownload, FiUserX, FiRefreshCw } from "react-icons/fi";

type RegistrationDetail = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_website: string;
  address_line: string;
  city: string;
  state_province: string;
  zip_code: string;
  country: string;
  resale_tax_id: string;
  fax: string;
  hear_about: string;
  credit_app: boolean;
  certificate_urls: string[];
  status: string;
  created_at: string;
};

const hearAboutLabels: Record<string, string> = {
  google: "Google Search",
  referral: "Referral",
  tradeshow: "Trade Show",
  social: "Social Media",
  "diamond-district": "Diamond District Walk-in",
  other: "Other",
};

export default function RegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [reg, setReg] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://usa-crown-back.vercel.app/api/admin/registrations/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Registration not found");
          throw new Error("Failed to fetch details");
        }
        const data = await res.json();
        setReg(data.registration);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to mark this application as ${status}?`)) return;

    try {
      const res = await fetch(`https://usa-crown-back.vercel.app/api/admin/registrations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReg((prev) => prev ? { ...prev, status } : null);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  if (loading) return <div className={styles.loader}>Loading Details...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!reg) return <div className={styles.emptyState}>Registration not found</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/crown-admin/registrations" className={styles.btnSecondary} style={{ marginBottom: '1rem', border: 'none', padding: 0 }}>
            <FiArrowLeft /> Back to Registrations
          </Link>
          <h1 className={styles.pageTitle}>Application Details</h1>
        </div>
        <div>
          {reg.status === 'pending' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleUpdateStatus("approved")}
                className={styles.btnPrimary}
                style={{ backgroundColor: '#28a745' }}
              >
                <FiCheck /> Approve
              </button>
              <button
                onClick={() => handleUpdateStatus("rejected")}
                className={styles.btnDanger}
              >
                <FiX /> Reject
              </button>
            </div>
          )}
          {reg.status === 'approved' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span
                className={styles.badge}
                style={{
                  backgroundColor: '#28a745',
                  color: '#fff',
                  fontSize: '0.9rem',
                  padding: '0.5rem 1.5rem'
                }}
              >
                APPROVED
              </span>
              <button
                onClick={() => handleUpdateStatus("deactivated")}
                className={styles.btnSecondary}
                style={{ color: '#6c757d', borderColor: '#6c757d' }}
              >
                <FiUserX /> Deactivate
              </button>
            </div>
          )}
          {reg.status === 'deactivated' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span
                className={styles.badge}
                style={{
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  fontSize: '0.9rem',
                  padding: '0.5rem 1.5rem'
                }}
              >
                DEACTIVATED
              </span>
              <button
                onClick={() => handleUpdateStatus("approved")}
                className={styles.btnPrimary}
                style={{ backgroundColor: '#28a745' }}
              >
                <FiRefreshCw /> Reactivate
              </button>
            </div>
          )}
          {reg.status === 'rejected' && (
            <span
              className={styles.badge}
              style={{
                backgroundColor: '#dc3545',
                color: '#fff',
                fontSize: '0.9rem',
                padding: '0.5rem 1.5rem'
              }}
            >
              REJECTED
            </span>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div style={{
        backgroundColor: reg.status === 'approved' ? '#d4edda' : reg.status === 'rejected' ? '#f8d7da' : reg.status === 'deactivated' ? '#e2e3e5' : '#fff3cd',
        color: reg.status === 'approved' ? '#155724' : reg.status === 'rejected' ? '#721c24' : reg.status === 'deactivated' ? '#383d41' : '#856404',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        borderLeft: `4px solid ${reg.status === 'approved' ? '#28a745' : reg.status === 'rejected' ? '#dc3545' : reg.status === 'deactivated' ? '#6c757d' : '#ffc107'}`,
      }}>
        <strong>Status:</strong> {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)} &nbsp;|&nbsp;
        <strong>Applied:</strong> {new Date(reg.created_at).toLocaleString()} &nbsp;|&nbsp;
        <strong>ID:</strong> {reg.id}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* LEFT COLUMN: Personal + Company */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Personal Information */}
          <div style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Information
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <InfoRow label="Full Name" value={`${reg.first_name} ${reg.last_name}`} />
                <InfoRow label="Email" value={<a href={`mailto:${reg.email}`} style={{ color: '#1a1a2e', textDecoration: 'underline' }}>{reg.email}</a>} />
                <InfoRow label="Phone" value={reg.phone || "N/A"} />
                <InfoRow label="Fax" value={reg.fax || "N/A"} />
                <InfoRow label="How They Heard About Us" value={hearAboutLabels[reg.hear_about] || reg.hear_about || "N/A"} />
                <InfoRow label="Credit Application" value={reg.credit_app ? "Yes" : "No"} />
              </tbody>
            </table>
          </div>

          {/* Company Information */}
          <div style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company Information
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <InfoRow label="Company Name" value={reg.company_name} />
                <InfoRow label="Company Website" value={
                  reg.company_website ? (
                    <a href={reg.company_website.startsWith('http') ? reg.company_website : `https://${reg.company_website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a2e', textDecoration: 'underline' }}>
                      {reg.company_website}
                    </a>
                  ) : "N/A"
                } />
                <InfoRow label="Tax / Resale ID" value={reg.resale_tax_id} />
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT COLUMN: Address + Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Address */}
          <div style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Address
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <InfoRow label="Address Line" value={reg.address_line || "N/A"} />
                <InfoRow label="City" value={reg.city || "N/A"} />
                <InfoRow label="State / Province" value={reg.state_province || "N/A"} />
                <InfoRow label="Zip / Postal Code" value={reg.zip_code || "N/A"} />
                <InfoRow label="Country" value={reg.country || "N/A"} />
              </tbody>
            </table>
          </div>

          {/* Documents */}
          <div style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resale Certificates / Documents
            </h3>

            {reg.certificate_urls && reg.certificate_urls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reg.certificate_urls.map((url, index) => {
                  const fileName = decodeURIComponent(url.split('/').pop() || `Document ${index + 1}`);
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                        <strong>📄 {fileName}</strong>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnSecondary}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        <FiDownload /> View / Download
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666', border: '1px dashed #ccc' }}>
                No documents were uploaded with this application.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '0.75rem 1rem 0.75rem 0', fontWeight: 600, color: '#666', fontSize: '0.9rem', whiteSpace: 'nowrap', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0', width: '40%' }}>
        {label}
      </td>
      <td style={{ padding: '0.75rem 0', color: '#1a1a2e', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
        {value}
      </td>
    </tr>
  );
}
