"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../admin.module.css";
import { FiEye, FiCheck, FiX, FiUserX, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

type Registration = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  status: string;
  created_at: string;
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/registrations`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/admin/registrations`), {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch registrations");
        const data = await res.json();
        if (!cancelled) setRegistrations(data.registrations || []);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this application as ${status}?`)) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/registrations/${id}/status`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Refresh list
      setLoading(true);
      toast.success(`Application marked as ${status}`);
      fetchRegistrations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  if (loading) return <div className={styles.loader}>Loading Registrations...</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>User Registrations</h1>
      </div>

      <div className={styles.tableContainer}>
        {registrations.length === 0 ? (
          <div className={styles.emptyState}>No registrations found.</div>
        ) : (
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>{reg.id}</td>
                  <td>{reg.first_name}</td>
                  <td>{reg.last_name}</td>
                  <td>{reg.company_name}</td>
                  <td>{reg.email}</td>
                  <td>{new Date(reg.created_at).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${reg.status === "approved"
                        ? styles.badgePublished
                        : reg.status === "rejected"
                          ? styles.badgeDraft
                          : "" // pending or deactivated
                        }`}
                      style={{
                        backgroundColor: reg.status === 'approved' ? '#28a745' : reg.status === 'rejected' ? '#dc3545' : reg.status === 'deactivated' ? '#6c757d' : '#ffc107',
                        color: reg.status === 'pending' ? '#000' : '#fff'
                      }}
                    >
                      {reg.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <Link
                        href={`/crown-admin/registrations/${reg.id}`}
                        className={styles.tableBtn}
                        title="View Details"
                      >
                        <FiEye />
                      </Link>
                      {reg.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, "approved")}
                            className={styles.tableBtn}
                            style={{ color: '#28a745', borderColor: '#28a745' }}
                            title="Approve"
                          >
                            <FiCheck />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, "rejected")}
                            className={`${styles.tableBtn} ${styles.tableBtnDanger}`}
                            title="Reject"
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      {reg.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, "deactivated")}
                          className={styles.tableBtn}
                          style={{ color: '#6c757d', borderColor: '#6c757d' }}
                          title="Deactivate Account"
                        >
                          <FiUserX />
                        </button>
                      )}
                      {reg.status === 'deactivated' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, "approved")}
                          className={styles.tableBtn}
                          style={{ color: '#28a745', borderColor: '#28a745' }}
                          title="Reactivate Account"
                        >
                          <FiRefreshCw />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
