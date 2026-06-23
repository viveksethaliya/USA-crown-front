"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

export default function AdminBlogsList() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const fetchBlogs = async (status = 'all') => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/blogs?status=${status}`), {
        credentials: "include"
      });
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(filter);
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/blogs/${id}`), {
        method: 'DELETE',
        credentials: "include"
      });
      if (res.ok) {
        setBlogs(blogs.filter(b => b.id !== id));
        toast.success("Blog deleted successfully.");
      } else {
        toast.error("Failed to delete blog.");
      }
    } catch (err) {
      toast.error("Error deleting blog.");
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manage Blogs</h1>
        <Link href="/crown-admin/blogs/new" className={styles.btnPrimary}>
          Create New Blog
        </Link>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? styles.btnPrimary : styles.btnSecondary}
        >
          All
        </button>
        <button
          onClick={() => setFilter('published')}
          className={filter === 'published' ? styles.btnPrimary : styles.btnSecondary}
        >
          Published
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={filter === 'draft' ? styles.btnPrimary : styles.btnSecondary}
        >
          Drafts
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No blogs found.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td style={{ fontWeight: 600 }}>{blog.title}</td>
                    <td>{blog.author}</td>
                    <td>
                      <span className={`${styles.badge} ${blog.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td>{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <Link href={`/crown-admin/blogs/${blog.id}/edit`} className={styles.tableBtn}>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className={`${styles.tableBtn} ${styles.tableBtnDanger}`}
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
