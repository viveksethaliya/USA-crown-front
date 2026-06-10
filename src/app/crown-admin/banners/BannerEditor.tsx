"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./banners.module.css";
import adminStyles from "../admin.module.css";
import {
  FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiUpload, FiTrash2, FiRefreshCw, FiEye
} from "react-icons/fi";
import MediaPicker from "../../../components/media/MediaPicker";

interface BannerData {
  id?: string;
  title: string;
  heading1: string;
  heading2: string;
  paragraph: string;
  cta_text: string;
  cta_link: string;
  bg_image_desktop: string;
  bg_image_desktop_media_id?: string;
  bg_image_mobile: string;
  bg_image_mobile_media_id?: string;
  overlay_color: string;
  overlay_opacity: number;
  text_color: string;
  text_align: string;
  banner_height: string;
  padding_x: number;
  padding_y: number;
  is_active: boolean;
}

const defaultBanner: BannerData = {
  title: "",
  heading1: "",
  heading2: "",
  paragraph: "",
  cta_text: "",
  cta_link: "",
  bg_image_desktop: "",
  bg_image_desktop_media_id: "",
  bg_image_mobile: "",
  bg_image_mobile_media_id: "",
  overlay_color: "#000000",
  overlay_opacity: 40,
  text_color: "#FFFFFF",
  text_align: "center",
  banner_height: "large",
  padding_x: 40,
  padding_y: 60,
  is_active: false,
};

const heightMap: Record<string, string> = {
  small: "300px",
  medium: "450px",
  large: "600px",
  fullscreen: "100vh",
};

export default function BannerEditor({
  initialData,
  isEdit = false,
}: {
  initialData?: any;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BannerData>({
    ...defaultBanner,
    ...initialData,
    overlay_opacity: initialData?.overlay_opacity ?? 40,
    padding_x: initialData?.padding_x ?? 40,
    padding_y: initialData?.padding_y ?? 60,
    is_active: initialData?.is_active ?? false,
  });

  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>(
    initialData?.bg_image_desktop || ""
  );
  const [mobilePreview, setMobilePreview] = useState<string>(
    initialData?.bg_image_mobile || ""
  );
  const [isDesktopPickerOpen, setIsDesktopPickerOpen] = useState(false);
  const [isMobilePickerOpen, setIsMobilePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateField = useCallback(
    (field: keyof BannerData, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ── Collection link integration ──────────────────────
  interface CollectionItem {
    id: string;
    name: string;
    slug: string;
  }

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [linkType, setLinkType] = useState<"collection" | "custom">(
    initialData?.cta_link?.startsWith("/collections/") ? "collection" : "custom"
  );

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch(
          `/api/admin/collections`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      }
    };
    fetchCollections();
  }, []);

  const handleDesktopFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDesktopFile(file);
      setDesktopPreview(URL.createObjectURL(file));
    }
  };

  const handleMobileFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMobileFile(file);
      setMobilePreview(URL.createObjectURL(file));
    }
  };

  const removeDesktopImage = () => {
    setDesktopFile(null);
    setDesktopPreview("");
    updateField("bg_image_desktop", "");
    updateField("bg_image_desktop_media_id", "");
    if (desktopInputRef.current) desktopInputRef.current.value = "";
  };

  const removeMobileImage = () => {
    setMobileFile(null);
    setMobilePreview("");
    updateField("bg_image_mobile", "");
    updateField("bg_image_mobile_media_id", "");
    if (mobileInputRef.current) mobileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("heading1", form.heading1);
      data.append("heading2", form.heading2);
      data.append("paragraph", form.paragraph);
      data.append("cta_text", form.cta_text);
      data.append("cta_link", form.cta_link);
      data.append("overlay_color", form.overlay_color);
      data.append("overlay_opacity", String(form.overlay_opacity));
      data.append("text_color", form.text_color);
      data.append("text_align", form.text_align);
      data.append("banner_height", form.banner_height);
      data.append("padding_x", String(form.padding_x));
      data.append("padding_y", String(form.padding_y));
      data.append("is_active", String(form.is_active));

      if (desktopFile) {
        data.append("bg_image_desktop", desktopFile);
      } else if (form.bg_image_desktop) {
        data.append("existing_bg_desktop", form.bg_image_desktop);
      }
      if (form.bg_image_desktop_media_id) {
        data.append("bg_image_desktop_media_id", form.bg_image_desktop_media_id);
      }

      if (mobileFile) {
        data.append("bg_image_mobile", mobileFile);
      } else if (form.bg_image_mobile) {
        data.append("existing_bg_mobile", form.bg_image_mobile);
      }
      if (form.bg_image_mobile_media_id) {
        data.append("bg_image_mobile_media_id", form.bg_image_mobile_media_id);
      }

      const url = isEdit
        ? `/api/admin/banners/${initialData.id}`
        : `/api/admin/banners`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: data,
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok) {
        router.push("/crown-admin/banners");
      } else {
        setError(result.error || "Failed to save banner");
      }
    } catch {
      setError("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview height computation
  const previewHeight = heightMap[form.banner_height] || "600px";

  return (
    <>
      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>
          {isEdit ? "Edit Banner" : "Create New Banner"}
        </h1>
      </div>

      {error && <div className={adminStyles.errorMessage}>{error}</div>}
      {successMsg && (
        <div style={{ background: "#d4edda", color: "#155724", padding: "1rem", marginBottom: "1.5rem", borderLeft: "4px solid #28a745" }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.editorLayout}>
          {/* ─── Left Panel: Content ─────────────────── */}
          <div className={styles.editorPanel}>
            <h3>Banner Content</h3>

            <div className={styles.field}>
              <label>Internal Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Summer Sale 2026"
                required
              />
              <div className={styles.fieldHint}>For admin reference only — not displayed on the website</div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Heading 1 (Primary)</label>
                <input
                  type="text"
                  value={form.heading1}
                  onChange={(e) => updateField("heading1", e.target.value)}
                  placeholder="e.g. SUMMER COLLECTION"
                />
              </div>
              <div className={styles.field}>
                <label>Heading 2 (Secondary)</label>
                <input
                  type="text"
                  value={form.heading2}
                  onChange={(e) => updateField("heading2", e.target.value)}
                  placeholder="e.g. Up to 30% Off"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Paragraph Text</label>
              <textarea
                value={form.paragraph}
                onChange={(e) => updateField("paragraph", e.target.value)}
                placeholder="Promotional message or description..."
                rows={3}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>CTA Button Text</label>
                <input
                  type="text"
                  value={form.cta_text}
                  onChange={(e) => updateField("cta_text", e.target.value)}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div className={styles.field}>
                <label>CTA Button Link</label>
                <div className={styles.linkTypeToggle}>
                  <button
                    type="button"
                    className={`${styles.linkTypeBtn} ${linkType === "collection" ? styles.active : ""}`}
                    onClick={() => {
                      setLinkType("collection");
                      updateField("cta_link", "");
                    }}
                  >
                    Collection
                  </button>
                  <button
                    type="button"
                    className={`${styles.linkTypeBtn} ${linkType === "custom" ? styles.active : ""}`}
                    onClick={() => {
                      setLinkType("custom");
                      updateField("cta_link", "");
                    }}
                  >
                    Custom Link
                  </button>
                </div>
                {linkType === "collection" ? (
                  <>
                    <select
                      value={form.cta_link}
                      onChange={(e) => updateField("cta_link", e.target.value)}
                    >
                      <option value="">— Select a collection —</option>
                      {collections.map((col) => (
                        <option key={col.id} value={`/collections/${col.slug}`}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                    {form.cta_link && (
                      <div className={styles.fieldHint}>
                        Link: {form.cta_link}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    value={form.cta_link}
                    onChange={(e) => updateField("cta_link", e.target.value)}
                    placeholder="e.g. /products or https://..."
                  />
                )}
              </div>
            </div>

            {/* Desktop Image Upload */}
            <div className={styles.field}>
              <label>Desktop Background Image</label>
              <input
                ref={desktopInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleDesktopFile}
                style={{ display: "none" }}
              />
              {desktopPreview ? (
                <>
                  <div
                    className={`${styles.imageUploadZone} ${styles.hasImage}`}
                  >
                    <img
                      src={desktopPreview}
                      alt="Desktop preview"
                      className={styles.imagePreview}
                    />
                  </div>
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className={styles.imageActionBtn}
                      onClick={() => desktopInputRef.current?.click()}
                    >
                      <FiRefreshCw style={{ marginRight: 4 }} /> Replace File
                    </button>
                    <button
                      type="button"
                      className={styles.imageActionBtn}
                      onClick={() => setIsDesktopPickerOpen(true)}
                    >
                      Choose from Library
                    </button>
                    <button
                      type="button"
                      className={`${styles.imageActionBtn} ${styles.imageActionBtnDanger}`}
                      onClick={removeDesktopImage}
                    >
                      <FiTrash2 style={{ marginRight: 4 }} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                  <div
                    className={styles.imageUploadZone}
                    onClick={() => desktopInputRef.current?.click()}
                    style={{ flex: 1 }}
                  >
                    <div className={styles.imageUploadIcon}>
                      <FiUpload />
                    </div>
                    <div className={styles.imageUploadText}>
                      <strong>Click to upload</strong> desktop background image
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDesktopPickerOpen(true)}
                    style={{
                      padding: '0 1.25rem',
                      background: '#1a1a2e',
                      color: '#d4af37',
                      border: '1px solid #d4af37',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Choose from Library
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Image Upload */}
            <div className={styles.field}>
              <label>Mobile Background Image (Optional)</label>
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMobileFile}
                style={{ display: "none" }}
              />
              {mobilePreview ? (
                <>
                  <div
                    className={`${styles.imageUploadZone} ${styles.hasImage}`}
                  >
                    <img
                      src={mobilePreview}
                      alt="Mobile preview"
                      className={styles.imagePreview}
                    />
                  </div>
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className={styles.imageActionBtn}
                      onClick={() => mobileInputRef.current?.click()}
                    >
                      <FiRefreshCw style={{ marginRight: 4 }} /> Replace File
                    </button>
                    <button
                      type="button"
                      className={styles.imageActionBtn}
                      onClick={() => setIsMobilePickerOpen(true)}
                    >
                      Choose from Library
                    </button>
                    <button
                      type="button"
                      className={`${styles.imageActionBtn} ${styles.imageActionBtnDanger}`}
                      onClick={removeMobileImage}
                    >
                      <FiTrash2 style={{ marginRight: 4 }} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                  <div
                    className={styles.imageUploadZone}
                    onClick={() => mobileInputRef.current?.click()}
                    style={{ flex: 1 }}
                  >
                    <div className={styles.imageUploadIcon}>
                      <FiUpload />
                    </div>
                    <div className={styles.imageUploadText}>
                      <strong>Click to upload</strong> mobile-optimized image
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobilePickerOpen(true)}
                    style={{
                      padding: '0 1.25rem',
                      background: '#1a1a2e',
                      color: '#d4af37',
                      border: '1px solid #d4af37',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Choose from Library
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Panel: Styling Controls ────────── */}
          <div className={styles.controlsPanel}>
            <h3>Styling Controls</h3>

            {/* Active Toggle */}
            <div className={styles.statusToggle}>
              <div
                className={`${styles.toggleSwitch} ${form.is_active ? styles.active : ""}`}
                onClick={() => updateField("is_active", !form.is_active)}
              />
              <div>
                <div className={styles.toggleLabel}>
                  {form.is_active ? "Active" : "Inactive"}
                </div>
                <div className={styles.toggleHint}>
                  {form.is_active
                    ? "Banner is visible on the homepage"
                    : "Banner is hidden from homepage"}
                </div>
              </div>
            </div>

            {/* Text Alignment */}
            <div className={styles.field}>
              <label>Text Alignment</label>
              <div className={styles.alignmentGroup}>
                <button
                  type="button"
                  className={`${styles.alignBtn} ${form.text_align === "left" ? styles.active : ""}`}
                  onClick={() => updateField("text_align", "left")}
                >
                  <FiAlignLeft /> Left
                </button>
                <button
                  type="button"
                  className={`${styles.alignBtn} ${form.text_align === "center" ? styles.active : ""}`}
                  onClick={() => updateField("text_align", "center")}
                >
                  <FiAlignCenter /> Center
                </button>
                <button
                  type="button"
                  className={`${styles.alignBtn} ${form.text_align === "right" ? styles.active : ""}`}
                  onClick={() => updateField("text_align", "right")}
                >
                  <FiAlignRight /> Right
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div className={styles.field}>
              <label>Text Color</label>
              <div className={styles.colorField}>
                <div className={styles.colorSwatch}>
                  <input
                    type="color"
                    value={form.text_color}
                    onChange={(e) => updateField("text_color", e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className={styles.colorHex}
                  value={form.text_color}
                  onChange={(e) => updateField("text_color", e.target.value)}
                  maxLength={7}
                />
              </div>
            </div>

            <hr className={styles.controlDivider} />

            {/* Overlay Color */}
            <div className={styles.field}>
              <label>Overlay Color</label>
              <div className={styles.colorField}>
                <div className={styles.colorSwatch}>
                  <input
                    type="color"
                    value={form.overlay_color}
                    onChange={(e) =>
                      updateField("overlay_color", e.target.value)
                    }
                  />
                </div>
                <input
                  type="text"
                  className={styles.colorHex}
                  value={form.overlay_color}
                  onChange={(e) =>
                    updateField("overlay_color", e.target.value)
                  }
                  maxLength={7}
                />
              </div>
            </div>

            {/* Overlay Opacity */}
            <div className={styles.field}>
              <label>Overlay Opacity</label>
              <div className={styles.sliderField}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.overlay_opacity}
                  onChange={(e) =>
                    updateField("overlay_opacity", parseInt(e.target.value))
                  }
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>
                  {form.overlay_opacity}%
                </span>
              </div>
            </div>

            <hr className={styles.controlDivider} />

            {/* Banner Height */}
            <div className={styles.field}>
              <label>Banner Height</label>
              <div className={styles.heightOptions}>
                {(["small", "medium", "large", "fullscreen"] as const).map(
                  (h) => (
                    <button
                      key={h}
                      type="button"
                      className={`${styles.heightOption} ${form.banner_height === h ? styles.active : ""}`}
                      onClick={() => updateField("banner_height", h)}
                    >
                      {h === "fullscreen"
                        ? "Full"
                        : h.charAt(0).toUpperCase() + h.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Padding */}
            <div className={styles.field}>
              <label>Padding (px)</label>
              <div className={styles.paddingGrid}>
                <div className={styles.paddingField}>
                  <label>Horizontal</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={form.padding_x}
                    onChange={(e) =>
                      updateField("padding_x", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className={styles.paddingField}>
                  <label>Vertical</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={form.padding_y}
                    onChange={(e) =>
                      updateField("padding_y", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Live Preview ──────────────────────────── */}
        <div className={styles.previewSection}>
          <h3>
            <FiEye /> Live Preview
          </h3>
          <div className={styles.previewContainer}>
            {desktopPreview || form.heading1 || form.heading2 || form.paragraph ? (
              <div
                className={styles.previewBanner}
                style={{
                  backgroundImage: desktopPreview
                    ? `url(${desktopPreview})`
                    : "none",
                  backgroundColor: desktopPreview ? undefined : "#1a1a2e",
                  minHeight: previewHeight === "100vh" ? "500px" : previewHeight,
                  justifyContent:
                    form.text_align === "left"
                      ? "flex-start"
                      : form.text_align === "right"
                        ? "flex-end"
                        : "center",
                }}
              >
                <div
                  className={styles.previewOverlay}
                  style={{
                    backgroundColor: form.overlay_color,
                    opacity: form.overlay_opacity / 100,
                  }}
                />
                <div
                  className={styles.previewContent}
                  style={{
                    color: form.text_color,
                    textAlign: form.text_align as any,
                    padding: `${form.padding_y}px ${form.padding_x}px`,
                  }}
                >
                  {form.heading1 && (
                    <div className={styles.previewHeading1}>
                      {form.heading1}
                    </div>
                  )}
                  {form.heading2 && (
                    <div className={styles.previewHeading2}>
                      {form.heading2}
                    </div>
                  )}
                  {form.paragraph && (
                    <p
                      className={styles.previewParagraph}
                      style={{
                        margin:
                          form.text_align === "center"
                            ? "0 auto 1.5rem auto"
                            : form.text_align === "right"
                              ? "0 0 1.5rem auto"
                              : "0 0 1.5rem 0",
                      }}
                    >
                      {form.paragraph}
                    </p>
                  )}
                  {form.cta_text && (
                    <span
                      className={styles.previewCta}
                      style={{
                        color: form.text_color,
                        borderColor: form.text_color,
                      }}
                    >
                      {form.cta_text}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.previewPlaceholder}>
                Start filling in the banner content to see a live preview
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit ────────────────────────────────── */}
        <div className={styles.actionBar}>
          <button
            type="submit"
            className={adminStyles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Update Banner"
                : "Create Banner"}
          </button>
          <button
            type="button"
            className={adminStyles.btnSecondary}
            onClick={() => router.push("/crown-admin/banners")}
          >
            Cancel
          </button>
        </div>
      </form>

      <MediaPicker
        isOpen={isDesktopPickerOpen}
        onClose={() => setIsDesktopPickerOpen(false)}
        onSelect={(selected) => {
          if (selected.length > 0) {
            setDesktopFile(null);
            setDesktopPreview(selected[0].url);
            updateField("bg_image_desktop", selected[0].url);
            updateField("bg_image_desktop_media_id", selected[0].mediaId);
          }
        }}
        selectedUrls={desktopPreview ? [desktopPreview] : []}
      />

      <MediaPicker
        isOpen={isMobilePickerOpen}
        onClose={() => setIsMobilePickerOpen(false)}
        onSelect={(selected) => {
          if (selected.length > 0) {
            setMobileFile(null);
            setMobilePreview(selected[0].url);
            updateField("bg_image_mobile", selected[0].url);
            updateField("bg_image_mobile_media_id", selected[0].mediaId);
          }
        }}
        selectedUrls={mobilePreview ? [mobilePreview] : []}
      />
    </>
  );
}
