"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface DashboardData {
  stats: {
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
  };
  recentBlogs: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("https://usa-crown-back.vercel.app/api/admin/dashboard", {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        <Link href="/crown-admin/blogs/new" className={styles.btnPrimary}>
          Create New Blog
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>Total Blogs</div>
          <div className={styles.statCardValue}>{data?.stats.totalBlogs || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>Published</div>
          <div className={styles.statCardValue}>{data?.stats.publishedBlogs || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>Drafts</div>
          <div className={styles.statCardValue}>{data?.stats.draftBlogs || 0}</div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1a1a2e' }}>Recent Blogs</h2>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentBlogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No blogs found. Create one to get started!
                  </td>
                </tr>
              ) : (
                data?.recentBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td style={{ fontWeight: 600 }}>{blog.title}</td>
                    <td>
                      <span className={`${styles.badge} ${blog.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/crown-admin/blogs/${blog.id}/edit`} className={styles.tableBtn}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
