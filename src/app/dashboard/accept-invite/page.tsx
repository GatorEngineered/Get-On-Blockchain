"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface InviteData {
  valid: boolean;
  staffName: string;
  staffEmail: string;
  merchantName: string;
  permissions: {
    canManageMembers: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
  };
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("No invite token provided");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/staff/accept-invite?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid invitation");
          setErrorCode(data.code || null);
          setLoading(false);
          return;
        }

        setInviteData(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to validate invitation");
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/staff/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/dashboard/login");
      }, 3000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="accept-invite-page">
        <div className="accept-invite-container">
          <div className="accept-invite-loading">
            <div className="spinner" aria-label="Loading"></div>
            <p>Validating your invitation...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error && !inviteData) {
    return (
      <div className="accept-invite-page">
        <div className="accept-invite-container">
          <div className="accept-invite-card error-card">
            <div className="error-icon" aria-hidden="true">
              {errorCode === "ALREADY_ACCEPTED" ? "✓" : "⚠"}
            </div>
            <h1>
              {errorCode === "ALREADY_ACCEPTED"
                ? "Already Accepted"
                : errorCode === "EXPIRED"
                ? "Invitation Expired"
                : "Invalid Invitation"}
            </h1>
            <p className="error-message">{error}</p>
            {errorCode === "ALREADY_ACCEPTED" && (
              <Link href="/dashboard/login" className="primary-btn">
                Go to Login
              </Link>
            )}
            {errorCode === "EXPIRED" && (
              <p className="help-text">
                Please contact your manager to request a new invitation.
              </p>
            )}
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="accept-invite-page">
        <div className="accept-invite-container">
          <div className="accept-invite-card success-card">
            <div className="success-icon" aria-hidden="true">✓</div>
            <h1>Account Created!</h1>
            <p>
              Welcome to <strong>{inviteData?.merchantName}</strong>! Your staff
              account has been set up successfully.
            </p>
            <p className="redirect-text">
              Redirecting to login page...
            </p>
            <Link href="/dashboard/login" className="primary-btn">
              Go to Login Now
            </Link>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  // Main form
  return (
    <div className="accept-invite-page">
      <div className="accept-invite-container">
        <div className="accept-invite-card">
          <div className="card-header">
            <Image
              src="/getonblockchain-favicon-resized.png"
              alt=""
              width={48}
              height={48}
              className="logo"
              aria-hidden="true"
            />
            <h1>Join {inviteData?.merchantName}</h1>
            <p className="subtitle">
              Set up your staff account to get started
            </p>
          </div>

          <div className="invite-details">
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{inviteData?.staffName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{inviteData?.staffEmail}</span>
            </div>
            <div className="detail-row">
              <span className="label">Business:</span>
              <span className="value">{inviteData?.merchantName}</span>
            </div>
          </div>

          <div className="permissions-section">
            <h3>Your Permissions</h3>
            <ul className="permissions-list" role="list">
              {inviteData?.permissions.canManageMembers && (
                <li>
                  <span className="check" aria-hidden="true">✓</span>
                  Manage members and points
                </li>
              )}
              {inviteData?.permissions.canViewReports && (
                <li>
                  <span className="check" aria-hidden="true">✓</span>
                  View reports and analytics
                </li>
              )}
              {inviteData?.permissions.canManageSettings && (
                <li>
                  <span className="check" aria-hidden="true">✓</span>
                  Manage business settings
                </li>
              )}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="password-form">
            <h3>Create Your Password</h3>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                minLength={8}
                required
                aria-describedby="password-hint"
              />
              <span id="password-hint" className="hint">
                At least 8 characters
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="expiry-notice">
            This invitation expires on{" "}
            {inviteData?.expiresAt
              ? new Date(inviteData.expiresAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"}
          </p>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .accept-invite-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .accept-invite-container {
    width: 100%;
    max-width: 480px;
  }

  .accept-invite-loading {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .accept-invite-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  .error-card,
  .success-card {
    text-align: center;
    padding: 3rem 2rem;
  }

  .error-icon,
  .success-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1.5rem;
  }

  .error-icon {
    background: #fef2f2;
    color: #ef4444;
  }

  .success-icon {
    background: #f0fdf4;
    color: #22c55e;
  }

  .error-card h1,
  .success-card h1 {
    font-size: 1.5rem;
    color: #111827;
    margin: 0 0 1rem;
  }

  .error-message {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .help-text {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .redirect-text {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .primary-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .primary-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .card-header {
    text-align: center;
    padding: 2rem 2rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .card-header .logo {
    margin-bottom: 1rem;
  }

  .card-header h1 {
    font-size: 1.5rem;
    color: #111827;
    margin: 0 0 0.5rem;
  }

  .card-header .subtitle {
    color: #6b7280;
    margin: 0;
  }

  .invite-details {
    padding: 1.5rem 2rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  .detail-row .label {
    color: #6b7280;
    font-weight: 500;
  }

  .detail-row .value {
    color: #111827;
    font-weight: 600;
  }

  .permissions-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .permissions-section h3 {
    font-size: 0.875rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem;
  }

  .permissions-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .permissions-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    color: #15803d;
  }

  .permissions-list .check {
    width: 20px;
    height: 20px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .password-form {
    padding: 1.5rem 2rem;
  }

  .password-form h3 {
    font-size: 1rem;
    color: #111827;
    margin: 0 0 1rem;
  }

  .form-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group .hint {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .submit-btn {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .expiry-notice {
    padding: 1rem 2rem;
    background: #fef3c7;
    color: #92400e;
    font-size: 0.875rem;
    text-align: center;
    margin: 0;
  }

  @media (max-width: 480px) {
    .accept-invite-page {
      padding: 1rem;
    }

    .card-header,
    .invite-details,
    .permissions-section,
    .password-form {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }
`;
