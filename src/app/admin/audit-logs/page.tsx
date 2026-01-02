"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityTypeFilter, offset]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (actionFilter) params.append("action", actionFilter);
      if (entityTypeFilter) params.append("entityType", entityTypeFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  if (error) {
    return (
      <div className="admin-card">
        <p className="error-text">{error}</p>
        <p style={{ marginTop: "12px", color: "#666" }}>
          Note: Audit logs are only accessible to Super Admins.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="admin-card-title" style={{ margin: 0 }}>
            Audit Logs ({totalCount})
          </h2>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setOffset(0);
            }}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "200px",
            }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EDIT_MERCHANT">Edit Merchant</option>
            <option value="CREATE_STAFF">Create Staff</option>
            <option value="EDIT_STAFF">Edit Staff</option>
            <option value="DELETE_STAFF">Delete Staff</option>
            <option value="CREATE_BLOG_POST">Create Blog Post</option>
            <option value="EDIT_BLOG_POST">Edit Blog Post</option>
            <option value="DELETE_BLOG_POST">Delete Blog Post</option>
            <option value="SEND_PASSWORD_RESET">Send Password Reset</option>
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setOffset(0);
            }}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "150px",
            }}
          >
            <option value="">All Entity Types</option>
            <option value="Auth">Auth</option>
            <option value="Merchant">Merchant</option>
            <option value="Staff">Staff</option>
            <option value="BlogPost">Blog Post</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Results Info */}
        <p style={{ marginBottom: "12px", color: "#666", fontSize: "14px" }}>
          Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount} logs
        </p>

        {isLoading ? (
          <p>Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p>No audit logs found.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>IP Address</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <strong>{log.admin.fullName}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {log.admin.email}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 500,
                            background: getActionColor(log.action),
                            color: "white",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entityType}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "13px" }}>
                        {log.ipAddress || "—"}
                      </td>
                      <td>
                        {log.changes ? (
                          <details>
                            <summary style={{ cursor: "pointer", fontSize: "13px" }}>
                              View Changes
                            </summary>
                            <pre style={{
                              fontSize: "11px",
                              background: "#f9f9f9",
                              padding: "8px",
                              borderRadius: "4px",
                              marginTop: "8px",
                              maxWidth: "300px",
                              overflow: "auto",
                            }}>
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
              <button
                onClick={handlePrevious}
                disabled={offset === 0}
                className="admin-btn admin-btn-secondary"
              >
                Previous
              </button>
              <span style={{ color: "#666", fontSize: "14px" }}>
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(totalCount / limit)}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasMore}
                className="admin-btn admin-btn-secondary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getActionColor(action: string): string {
  if (action.includes("DELETE")) return "#dc2626";
  if (action.includes("CREATE")) return "#10b981";
  if (action.includes("EDIT") || action.includes("UPDATE")) return "#f59e0b";
  if (action.includes("LOGIN")) return "#2563eb";
  return "#6b7280";
}
