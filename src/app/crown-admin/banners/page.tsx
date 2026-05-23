"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import adminStyles from "../admin.module.css";
import styles from "./banners.module.css";

interface Banner {
  id: string;
  title: string;
  heading1: string;
  bg_image_desktop: string;
  is_active: boolean;
  banner_height: string;
  created_at: string;
}

export default function AdminBannersList() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchBanners = async (status = "all") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/banners?status=${status}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      console.error("Failed to fetch banners", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(filter);
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(
        `/api/admin/banners/${id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
      } else {
        alert("Failed to delete banner.");
      }
    } catch {
      alert("Error deleting banner.");
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(
        `/api/admin/banners/${id}/toggle`,
        { method: "PATCH", credentials: "include" }
      );
      if (res.ok) {
        // Refresh list to reflect deactivation of other banners
        await fetchBanners(filter);
      } else {
        alert("Failed to toggle banner.");
      }
    } catch {
      alert("Error toggling banner.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>Manage Banners</h1>
        <Link href="/crown-admin/banners/new" className={adminStyles.btnPrimary}>
          Create New Banner
        </Link>
      </div>

      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <button
          onClick={() => setFilter("all")}
          className={filter === "all" ? adminStyles.btnPrimary : adminStyles.btnSecondary}
        >
          All
        </button>
        <button
          onClick={() => setFilter("active")}
          className={filter === "active" ? adminStyles.btnPrimary : adminStyles.btnSecondary}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={filter === "inactive" ? adminStyles.btnPrimary : adminStyles.btnSecondary}
        >
          Inactive
        </button>
      </div>

      <div className={adminStyles.tableContainer}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
        ) : (
          <table className={adminStyles.adminTable}>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Heading</th>
                <th>Status</th>
                <th>Height</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    No banners found. Create one to get started!
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      {banner.bg_image_desktop ? (
                        <img
                          src={banner.bg_image_desktop}
                          alt={banner.title}
                          className={styles.bannerThumb}
                        />
                      ) : (
                        <div className={styles.bannerThumbPlaceholder}>
                          No image
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{banner.title}</td>
                    <td style={{ color: "#666", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {banner.heading1 || "—"}
                    </td>
                    <td>
                      <span className={banner.is_active ? styles.badgeActive : styles.badgeInactive}>
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {banner.banner_height}
                    </td>
                    <td>
                      {new Date(banner.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        <Link
                          href={`/crown-admin/banners/${banner.id}/edit`}
                          className={adminStyles.tableBtn}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggle(banner.id)}
                          disabled={togglingId === banner.id}
                          className={`${styles.toggleBtn} ${banner.is_active ? styles.toggleBtnOff : ""}`}
                        >
                          {togglingId === banner.id
                            ? "..."
                            : banner.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className={`${adminStyles.tableBtn} ${adminStyles.tableBtnDanger}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
