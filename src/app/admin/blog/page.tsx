"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string;
  readTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

export default function BlogPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/admin/blog", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch blog posts");
        }
        const data = await res.json();
        setPosts(data.posts);
        setFilteredPosts(data.posts);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts based on search and status
  useEffect(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    setFilteredPosts(filtered);
  }, [searchQuery, statusFilter, posts]);

  if (isLoading) {
    return (
      <div className="admin-card">
        <p>Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="admin-card-title" style={{ margin: 0 }}>
            Blog Posts ({posts.length})
          </h2>
          <Link href="/admin/blog/new" className="admin-btn admin-btn-primary">
            Create New Post
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by title, description, slug, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "150px",
            }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Results Count */}
        {searchQuery || statusFilter !== "ALL" ? (
          <p style={{ marginBottom: "12px", color: "#666", fontSize: "14px" }}>
            Showing {filteredPosts.length} of {posts.length} posts
          </p>
        ) : null}

        {filteredPosts.length === 0 ? (
          <p>No blog posts found. Create your first post!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <strong>{post.title}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        /{post.slug}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: getStatusColor(post.status),
                          color: "white",
                        }}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td>{post.category}</td>
                    <td>
                      {post.author.fullName}
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {post.author.role}
                      </span>
                    </td>
                    <td>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : "Not published"}
                    </td>
                    <td>{new Date(post.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="admin-btn admin-btn-primary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "DRAFT":
      return "#6b7280";
    case "PUBLISHED":
      return "#10b981";
    case "ARCHIVED":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}
