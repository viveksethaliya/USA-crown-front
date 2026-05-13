"use client";

import { useEffect, useState, use } from "react";
import BlogEditor from "../../BlogEditor";
import styles from "../../../admin.module.css";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`https://usa-crown-back.vercel.appk.vercel.app/api/admin/blogs/${unwrappedParams.id}`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Blog not found");
        const data = await res.json();
        setBlog(data.blog);
      } catch (err) {
        setError("Failed to load blog.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [unwrappedParams.id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading blog data...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!blog) return <div className={styles.errorMessage}>Blog not found.</div>;

  return <BlogEditor isEdit={true} initialData={blog} />;
}
