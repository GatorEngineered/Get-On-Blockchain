"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Import TiptapEditor dynamically to avoid SSR issues
const TiptapEditor = dynamic(() => import("../../components/TiptapEditor"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug) {
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(autoSlug);
    }
  };

  // Sanitize slug when manually edited
  const handleSlugChange = (newSlug: string) => {
    const sanitizedSlug = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(sanitizedSlug);
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
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
        throw new Error(data.error || "Failed to create post");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0 }}>Create New Blog Post</h2>
          <button
            onClick={() => router.push("/admin/blog")}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
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
                onChange={(e) => handleTitleChange(e.target.value)}
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
                onChange={(e) => handleSlugChange(e.target.value)}
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
          <details style={{ marginBottom: "24px" }}>
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
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting || !title || !slug || !description || !content}
              className="admin-btn admin-btn-secondary"
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isSubmitting || !title || !slug || !description || !content}
              className="admin-btn admin-btn-primary"
            >
              {isSubmitting ? "Publishing..." : "Publish Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
