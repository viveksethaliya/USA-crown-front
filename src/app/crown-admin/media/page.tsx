"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./media.module.css";
import { FiSearch, FiUploadCloud, FiTrash2, FiSave, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface MediaItem {
  id: string;
  url: string;
  storage_path: string;
  file_name: string;
  alt_text: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

interface Usages {
  product_images?: { product_id: number; variation_id: number | null }[];
  categories?: { id: number; name: string }[];
  collections?: { id: string; name: string }[];
  blogs?: { id: string; title: string }[];
  banners?: { id: string; title: string }[];
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  // Metadata editor inputs
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAltText, setMetaAltText] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [usages, setUsages] = useState<Usages | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (pageNumber = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const url = `/api/admin/media?page=${pageNumber}&limit=24&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setMedia(data.media || []);
        setTotalCount(data.totalCount || 0);
        setPages(data.pages || 1);
        setPage(data.page || 1);
      }
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMedia(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMedia(1, search);
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Sync details inputs when active item changes
  useEffect(() => {
    if (activeItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMetaTitle(activeItem.title || "");
      setMetaAltText(activeItem.alt_text || "");
      setDeleteError(null);
      setUsages(null);
    } else {
      setMetaTitle("");
      setMetaAltText("");
      setDeleteError(null);
      setUsages(null);
    }
  }, [activeItem]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("image", e.target.files[0]);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();

      if (res.ok && data.media) {
        setMedia(prev => [data.media, ...prev]);
        setActiveItem(data.media);
        setTotalCount(prev => prev + 1);
        toast.success("File uploaded successfully");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveMeta = async () => {
    if (!activeItem) return;
    setSavingMeta(true);

    try {
      const res = await fetch(`/api/admin/media/${activeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: metaTitle, alt_text: metaAltText }),
        credentials: "include"
      });
      const data = await res.json();

      if (res.ok && data.media) {
        setMedia(prev => prev.map(m => m.id === activeItem.id ? { ...m, title: metaTitle, alt_text: metaAltText } : m));
        setActiveItem(data.media);
        toast.success("Metadata saved!");
      } else {
        toast.error(data.error || "Failed to save metadata");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving metadata");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    setDeleteError(null);
    setUsages(null);

    if (!window.confirm("Are you sure you want to permanently delete this media item? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/media/${activeItem.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Media item deleted successfully.");
        setMedia(prev => prev.filter(m => m.id !== activeItem.id));
        setActiveItem(null);
        setTotalCount(prev => prev - 1);
      } else {
        if (data.inUse) {
          setDeleteError(data.error || "Cannot delete media because it is in use.");
          setUsages(data.usages || null);
        } else {
          toast.error(data.error || "Failed to delete media item");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting media item");
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Media Library</h1>
        <div className={styles.uploadWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleUpload}
          />
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FiUploadCloud /> {uploading ? "Uploading..." : "Upload New"}
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        {/* Main Panel */}
        <div className={styles.mainPanel}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search media by filename, title..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.gridScroller}>
            {loading ? (
              <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>Loading media assets...</div>
            ) : (
              <div className={styles.grid}>
                {media.length === 0 ? (
                  <div className={styles.noMedia}>No media items found. Upload some images to begin!</div>
                ) : (
                  media.map((item) => {
                    const isActive = activeItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                        onClick={() => setActiveItem(item)}
                      >
                        <img src={item.url} alt={item.alt_text || item.title || "Media item"} />
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.pagination}>
              <button
                className={styles.pagerBtn}
                onClick={() => fetchMedia(page - 1, search)}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>
              <span className={styles.pagerInfo}>
                Page {page} of {pages} ({totalCount} items)
              </span>
              <button
                className={styles.pagerBtn}
                onClick={() => fetchMedia(page + 1, search)}
                disabled={page >= pages || loading}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className={styles.sidebar}>
          <h2>Attachment Details</h2>
          {activeItem ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className={styles.previewWrapper}>
                <img src={activeItem.url} alt={activeItem.alt_text} />
              </div>

              <div className={styles.metaInfo}>
                <strong>File name:</strong> {activeItem.file_name}
                <br />
                <strong>File type:</strong> {activeItem.mime_type}
                <br />
                <strong>File size:</strong> {formatBytes(activeItem.size_bytes)}
                <br />
                <strong>Uploaded:</strong> {new Date(activeItem.created_at).toLocaleString()}
                <br />
                <a
                  href={activeItem.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#d4af37", textDecoration: "underline", marginTop: "0.25rem", display: "inline-block" }}
                >
                  View original file
                </a>
              </div>

              <div className={styles.fieldGroup}>
                <label>Title</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Alternative Text</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={metaAltText}
                  onChange={(e) => setMetaAltText(e.target.value)}
                />
              </div>

              <div className={styles.metaActions}>
                <button
                  onClick={handleSaveMeta}
                  className={styles.saveBtn}
                  disabled={savingMeta}
                >
                  <FiSave style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                  {savingMeta ? "Saving..." : "Save Changes"}
                </button>

                <button onClick={handleDelete} className={styles.deleteBtn}>
                  <FiTrash2 style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                  Delete Permanently
                </button>
              </div>

              {/* Usage Warning Message */}
              {deleteError && (
                <div className={styles.warningBox}>
                  <h5>
                    <FiAlertCircle style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
                    In-Use Error
                  </h5>
                  <p style={{ fontSize: "0.75rem", margin: "0 0 0.5rem 0", color: "#78350f" }}>
                    {deleteError}
                  </p>
                  
                  {usages && (
                    <ul>
                      {usages.product_images && usages.product_images.length > 0 && (
                        <li>Used in {usages.product_images.length} Product{usages.product_images.length > 1 ? "s" : ""}</li>
                      )}
                      {usages.categories && usages.categories.length > 0 && (
                        <li>
                          Used in Category:{" "}
                          {usages.categories.map((c, i) => (
                            <span key={c.id}>
                              {c.name}
                              {i < usages.categories!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </li>
                      )}
                      {usages.collections && usages.collections.length > 0 && (
                        <li>
                          Used in Collection:{" "}
                          {usages.collections.map((col, i) => (
                            <span key={col.id}>
                              {col.name}
                              {i < usages.collections!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </li>
                      )}
                      {usages.blogs && usages.blogs.length > 0 && (
                        <li>
                          Used in Blog:{" "}
                          {usages.blogs.map((b, i) => (
                            <span key={b.id}>
                              {b.title}
                              {i < usages.blogs!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </li>
                      )}
                      {usages.banners && usages.banners.length > 0 && (
                        <li>
                          Used in Banner:{" "}
                          {usages.banners.map((b, i) => (
                            <span key={b.id}>
                              {b.title}
                              {i < usages.banners!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiUploadCloud style={{ fontSize: "2.5rem" }} />
              Select an image from the grid to view details, update alt text, or delete it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
