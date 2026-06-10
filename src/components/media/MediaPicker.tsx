"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./MediaPicker.module.css";
import { FiSearch, FiUploadCloud, FiX, FiLoader } from "react-icons/fi";

export interface MediaItem {
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

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: { url: string; mediaId: string; alt_text?: string; title?: string }[]) => void;
  multiSelect?: boolean;
  selectedUrls?: string[];
}

export default function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false
}: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [sidebarItem, setSidebarItem] = useState<MediaItem | null>(null);
  
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAltText, setMetaAltText] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

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
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMedia(1, search);
      setSelectedItems([]);
      setSidebarItem(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (isOpen) {
      const delayDebounce = setTimeout(() => {
        fetchMedia(1, search);
      }, 350);
      return () => clearTimeout(delayDebounce);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Update sidebar metadata inputs when highlighted item changes
  useEffect(() => {
    if (sidebarItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMetaTitle(sidebarItem.title || "");
      setMetaAltText(sidebarItem.alt_text || "");
    } else {
      setMetaTitle("");
      setMetaAltText("");
    }
  }, [sidebarItem]);

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
        // Refresh page 1 and select the newly uploaded media item
        await fetchMedia(1, search);
        setSelectedItems(prev => multiSelect ? [...prev, data.media] : [data.media]);
        setSidebarItem(data.media);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectThumb = (item: MediaItem) => {
    if (multiSelect) {
      const exists = selectedItems.find(i => i.id === item.id);
      if (exists) {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
      setSidebarItem(item);
    } else {
      setSelectedItems([item]);
      setSidebarItem(item);
    }
  };

  const handleSaveMeta = async () => {
    if (!sidebarItem) return;
    setSavingMeta(true);

    try {
      const res = await fetch(`/api/admin/media/${sidebarItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: metaTitle, alt_text: metaAltText }),
        credentials: "include"
      });
      const data = await res.json();

      if (res.ok && data.media) {
        // Update item in local list
        setMedia(prev => prev.map(m => m.id === sidebarItem.id ? { ...m, title: metaTitle, alt_text: metaAltText } : m));
        setSidebarItem(data.media);
        alert("Metadata saved!");
      } else {
        alert(data.error || "Failed to save metadata");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving metadata");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) return;
    
    const formatted = selectedItems.map(item => ({
      url: item.url,
      mediaId: item.id,
      alt_text: item.alt_text,
      title: item.title
    }));
    
    onSelect(formatted);
    onClose();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Media Library</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <div className={styles.content}>
          {/* Library grid panel */}
          <div className={styles.libraryPane}>
            <div className={styles.toolbar}>
              <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search media by filename, title..."
                  className={styles.searchInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.uploadSection}>
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
                  {uploading ? (
                    <>
                      <FiLoader className="spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud /> Upload Image
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.gridWrapper}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                  <FiLoader className="spin" style={{ fontSize: "2rem", color: "#d4af37" }} />
                </div>
              ) : (
                <div className={styles.grid}>
                  {media.length === 0 ? (
                    <div className={styles.noMedia}>No media items found. Upload some images to begin!</div>
                  ) : (
                    media.map((item) => {
                      const isSelected = !!selectedItems.find(i => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className={`${styles.thumb} ${isSelected ? styles.thumbSelected : ""}`}
                          onClick={() => handleSelectThumb(item)}
                        >
                          <img src={item.url} alt={item.alt_text || item.title || "Library image"} />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar item metadata/preview panel */}
          <div className={styles.sidebar}>
            <h4>Attachment Details</h4>
            {sidebarItem ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className={styles.previewWrapper}>
                  <img src={sidebarItem.url} alt={sidebarItem.alt_text} />
                </div>

                <div className={styles.metaInfo}>
                  <strong>File name:</strong> {sidebarItem.file_name}
                  <br />
                  <strong>File type:</strong> {sidebarItem.mime_type}
                  <br />
                  <strong>File size:</strong> {formatBytes(sidebarItem.size_bytes)}
                  <br />
                  <strong>Uploaded:</strong> {new Date(sidebarItem.created_at).toLocaleDateString()}
                </div>

                <div className={styles.metaField}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                </div>

                <div className={styles.metaField}>
                  <label>Alternative Text</label>
                  <input
                    type="text"
                    value={metaAltText}
                    onChange={(e) => setMetaAltText(e.target.value)}
                  />
                </div>

                <div className={styles.metaActions}>
                  <button
                    onClick={handleSaveMeta}
                    className={styles.saveMetaBtn}
                    disabled={savingMeta}
                  >
                    {savingMeta ? "Saving..." : "Save Metadata"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptySelection}>
                <FiUploadCloud style={{ fontSize: "2rem" }} />
                Select an image to view details and edit metadata.
              </div>
            )}
          </div>
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

          <div className={styles.footerActions}>
            <button className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.btnSelect}
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
            >
              Select Image{selectedItems.length > 1 ? "s" : ""} ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
