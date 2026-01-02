"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Import TiptapEditor dynamically to avoid SSR issues
const TiptapEditor = dynamic(() => import("../../components/TiptapEditor"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string;
  readTimeMinutes: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Marketing");
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [currentStatus, setCurrentStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // Fetch existing post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch blog post");
        }
        const data = await res.json();
        const fetchedPost = data.post;

        setPost(fetchedPost);
        setTitle(fetchedPost.title);
        setSlug(fetchedPost.slug);
        setDescription(fetchedPost.description);
        setContent(fetchedPost.content);
        setCategory(fetchedPost.category);
        setReadTimeMinutes(fetchedPost.readTimeMinutes);
        setMetaTitle(fetchedPost.metaTitle || "");
        setMetaDescription(fetchedPost.metaDescription || "");
        setMetaKeywords(fetchedPost.metaKeywords || "");
        setCurrentStatus(fetchedPost.status);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const handleUpdate = async (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/blog/${params.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          content,
          category,
          readTimeMinutes,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || description,
          metaKeywords,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update post");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/blog/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-card">
        <p>Loading blog post...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="admin-card">
        <p className="error-text">{error}</p>
        <button onClick={() => router.push("/admin/blog")} className="admin-btn admin-btn-secondary" style={{ marginTop: "12px" }}>
          Back to Blog Posts
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0 }}>Edit Blog Post</h2>
            <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
              Status: <strong>{currentStatus}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="admin-btn admin-btn-danger"
            >
              {isDeleting ? "Deleting..." : "Delete Post"}
            </button>
            <button
              onClick={() => router.push("/admin/blog")}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fee", borderRadius: "6px", marginBottom: "20px", color: "#c00" }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Title and Slug */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Slug <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Description <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Category and Read Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="Marketing">Marketing</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Guide">Guide</option>
                <option value="Case Study">Case Study</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Read Time (minutes)
              </label>
              <input
                type="number"
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(parseInt(e.target.value))}
                min={1}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* Content Editor */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Content <span style={{ color: "red" }}>*</span>
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Write your blog post content here..."
            />
          </div>

          {/* SEO Metadata Section */}
          <details style={{ marginBottom: "24px" }} open>
            <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: "12px" }}>
              SEO Metadata (Optional)
            </summary>
            <div style={{ paddingLeft: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Meta Title
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Leave empty to use post title"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Leave empty to use post description"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Meta Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="loyalty program, rewards, customer retention"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
          </details>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            {currentStatus === "PUBLISHED" && (
              <button
                onClick={() => handleUpdate("ARCHIVED")}
                disabled={isSubmitting || !title || !slug || !description || !content}
                className="admin-btn admin-btn-secondary"
              >
                {isSubmitting ? "Archiving..." : "Archive"}
              </button>
            )}
            {currentStatus !== "DRAFT" && (
              <button
                onClick={() => handleUpdate("DRAFT")}
                disabled={isSubmitting || !title || !slug || !description || !content}
                className="admin-btn admin-btn-secondary"
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </button>
            )}
            <button
              onClick={() => handleUpdate(currentStatus === "DRAFT" ? "DRAFT" : currentStatus)}
              disabled={isSubmitting || !title || !slug || !description || !content}
              className="admin-btn admin-btn-secondary"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            {currentStatus !== "PUBLISHED" && (
              <button
                onClick={() => handleUpdate("PUBLISHED")}
                disabled={isSubmitting || !title || !slug || !description || !content}
                className="admin-btn admin-btn-primary"
              >
                {isSubmitting ? "Publishing..." : "Publish Now"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
