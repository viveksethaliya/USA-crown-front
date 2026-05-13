"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface BlogData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  tags: string; // We'll keep it as a comma-separated string for the form
  category: string;
  meta_description: string;
  cover_image?: string;
}

export default function BlogEditor({ initialData, isEdit = false }: { initialData?: any, isEdit?: boolean }) {
  const router = useRouter();
  const quillRef = useRef<any>(null);

  const [formData, setFormData] = useState<BlogData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    status: initialData?.status || "draft",
    tags: initialData?.tags ? initialData.tags.join(', ') : "",
    category: initialData?.category || "",
    meta_description: initialData?.meta_description || "",
    cover_image: initialData?.cover_image || "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category suggestions
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  useEffect(() => {
    // Fetch existing categories for suggestions
    async function fetchCategories() {
      try {
        const res = await fetch("http://localhost:5000/api/blogs/categories");
        if (res.ok) {
          const data = await res.json();
          setExistingCategories(data.categories || []);
        }
      } catch {
        // silent fail
      }
    }
    fetchCategories();
  }, []);

  const filteredCategories = existingCategories.filter(
    (cat) => cat.toLowerCase().includes(formData.category.toLowerCase()) && cat.toLowerCase() !== formData.category.toLowerCase()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Custom Image Handler for Quill
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch("http://localhost:5000/api/admin/upload-image", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          router.push("/crown-admin/login");
          return;
        }

        const data = await res.json();

        if (res.ok && data.url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", data.url);
          }
        } else {
          alert(data.error || "Image upload failed");
        }
      } catch (err) {
        console.error("Upload error", err);
        alert("Image upload failed");
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("slug", formData.slug);
      data.append("excerpt", formData.excerpt);
      data.append("content", formData.content);
      data.append("status", formData.status);
      data.append("tags", formData.tags);
      data.append("category", formData.category);
      data.append("meta_description", formData.meta_description);

      if (coverFile) {
        data.append("cover_image", coverFile);
      } else if (formData.cover_image) {
        data.append("existing_cover", formData.cover_image);
      }

      const url = isEdit 
        ? `http://localhost:5000/api/admin/blogs/${initialData.id}` 
        : "http://localhost:5000/api/admin/blogs";
      
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: data,
        credentials: "include"
      });

      const result = await res.json();

      if (res.ok) {
        router.push("/crown-admin/blogs");
      } else {
        setError(result.error || "Failed to save blog");
      }
    } catch (err) {
      setError("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isEdit ? "Edit Blog" : "Create New Blog"}</h1>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Title *</label>
            <input 
              type="text" 
              name="title" 
              className={styles.formControl} 
              value={formData.title} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Slug (Leave blank to auto-generate)</label>
            <input 
              type="text" 
              name="slug" 
              className={styles.formControl} 
              value={formData.slug} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Cover Image (Required for new blogs)</label>
          <input 
            type="file" 
            name="cover_image" 
            accept="image/jpeg, image/png, image/webp" 
            className={styles.formControl} 
            onChange={handleFileChange} 
            required={!isEdit && !formData.cover_image}
          />
          {coverPreview && (
            <img src={coverPreview} alt="Cover Preview" className={styles.coverImagePreview} />
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Excerpt / Short Description</label>
          <textarea 
            name="excerpt" 
            className={styles.formControl} 
            rows={3} 
            value={formData.excerpt} 
            onChange={handleChange}
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label>Content *</label>
          <div className={styles.editorContainer}>
            {/* @ts-expect-error - next/dynamic does not pass ref types correctly */}
            <ReactQuill 
              ref={quillRef}
              theme="snow" 
              value={formData.content} 
              onChange={handleContentChange} 
              modules={modules}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Category</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                name="category"
                className={styles.formControl}
                value={formData.category}
                onChange={handleChange}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                placeholder="Type to search or create new..."
                autoComplete="off"
              />
              {showCategorySuggestions && (filteredCategories.length > 0 || (existingCategories.length > 0 && formData.category === "")) && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #dcdcdc",
                  borderTop: "none",
                  maxHeight: "180px",
                  overflowY: "auto",
                  zIndex: 20,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                }}>
                  {(formData.category === "" ? existingCategories : filteredCategories).map((cat) => (
                    <div
                      key={cat}
                      style={{
                        padding: "0.6rem 0.75rem",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        borderBottom: "1px solid #f0f0f0",
                        transition: "background 0.15s"
                      }}
                      onMouseDown={() => {
                        setFormData({ ...formData, category: cat });
                        setShowCategorySuggestions(false);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small style={{ color: "#888", marginTop: "0.25rem", display: "block" }}>
              Select an existing category or type a new one
            </small>
          </div>
          <div className={styles.formGroup}>
            <label>Tags (Comma separated)</label>
            <input 
              type="text" 
              name="tags" 
              className={styles.formControl} 
              placeholder="e.g. Rings, Fashion, Tips"
              value={formData.tags} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Status</label>
            <select 
              name="status" 
              className={styles.formControl} 
              value={formData.status} 
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>SEO Meta Description</label>
            <input 
              type="text" 
              name="meta_description" 
              className={styles.formControl} 
              value={formData.meta_description} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update Blog" : "Publish Blog"}
          </button>
        </div>
      </form>
    </>
  );
}
