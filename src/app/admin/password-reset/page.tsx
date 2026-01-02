"use client";

import { useState } from "react";

type UserType = "MERCHANT" | "STAFF" | "ADMIN";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("MERCHANT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setNewPassword(null);

    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password");
      }

      const data = await res.json();
      setNewPassword(data.tempPassword);
      setSuccess(`Password reset successful for ${email}`);
      setEmail("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="admin-card">
        <h2 style={{ margin: 0, marginBottom: "8px" }}>Manual Password Reset</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Reset password for merchants, staff members, or admins. A temporary password will be generated.
        </p>

        {error && (
          <div style={{ padding: "12px", background: "#fee", borderRadius: "6px", marginBottom: "20px", color: "#c00" }}>
            {error}
          </div>
        )}

        {success && newPassword && (
          <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "6px", marginBottom: "20px", border: "1px solid #10b981" }}>
            <p style={{ margin: 0, marginBottom: "12px", color: "#065f46", fontWeight: 600 }}>
              {success}
            </p>
            <div style={{ background: "white", padding: "12px", borderRadius: "4px", border: "1px solid #d1fae5" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Temporary Password:
              </p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 600, fontFamily: "monospace", color: "#059669" }}>
                {newPassword}
              </p>
            </div>
            <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "#065f46" }}>
              ⚠️ Copy this password and share it with the user. They should change it after logging in.
            </p>
          </div>
        )}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              User Type
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="MERCHANT">Merchant</option>
              <option value="STAFF">Staff Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: "24px" }}>
        <h3 style={{ margin: 0, marginBottom: "12px" }}>How It Works</h3>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Enter the user's email address and select their type</li>
          <li>A temporary password will be generated (8-12 characters, alphanumeric)</li>
          <li>Copy the password and share it with the user securely</li>
          <li>The user should change this password immediately after logging in</li>
          <li>This action will be logged in the audit trail</li>
        </ul>
      </div>
    </div>
  );
}
