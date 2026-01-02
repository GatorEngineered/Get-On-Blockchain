"use client";

import { useState, useEffect } from "react";

type Admin = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export default function StaffManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/staff", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch admins");
      }

      const data = await res.json();
      setAdmins(data.admins);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (admin: Admin) => {
    try {
      const res = await fetch(`/api/admin/staff/${admin.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update admin");
      }

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update admin");
    }
  };

  const changeRole = async (admin: Admin, newRole: string) => {
    if (newRole === admin.role) return;

    try {
      const res = await fetch(`/api/admin/staff/${admin.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading staff...</div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0 }}>Staff Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-btn admin-btn-primary"
          >
            Create New Admin
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fee", borderRadius: "6px", marginBottom: "20px", color: "#c00" }}>
            {error}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Last Login</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                <td style={{ padding: "12px" }}>{admin.fullName}</td>
                <td style={{ padding: "12px" }}>{admin.email}</td>
                <td style={{ padding: "12px" }}>
                  <select
                    value={admin.role}
                    onChange={(e) => changeRole(admin, e.target.value)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #e5e5e5",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                </td>
                <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>
                  {admin.lastLoginAt
                    ? new Date(admin.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: admin.isActive ? "#d1fae5" : "#fee",
                      color: admin.isActive ? "#065f46" : "#c00",
                    }}
                  >
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => toggleActive(admin)}
                    className="admin-btn admin-btn-secondary"
                    style={{ fontSize: "13px", padding: "6px 12px" }}
                  >
                    {admin.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAdmins();
          }}
        />
      )}
    </div>
  );
}

function CreateAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "EDITOR">("ADMIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create admin");
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "32px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: "24px" }}>Create New Admin User</h2>

        {error && (
          <div style={{ padding: "12px", background: "#fee", borderRadius: "6px", marginBottom: "16px", color: "#c00" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Full Name <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Email <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Password <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0 0" }}>
              Minimum 8 characters
            </p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
