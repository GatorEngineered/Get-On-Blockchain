"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MemberProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  walletAddress: string | null;
  createdAt: string;
};

type EmailPreferences = {
  // System notifications
  payoutNotifications: boolean;
  magicLinkEnabled: boolean;
  securityAlerts: boolean;
  // Merchant notifications
  merchantPromotional: boolean;
  merchantPointsUpdates: boolean;
  merchantAnnouncements: boolean;
};

export default function MemberSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "wallet" | "notifications">("profile");

  // Email preferences state
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesSuccess, setPreferencesSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const token = localStorage.getItem("member_token");
      if (!token) {
        router.push("/member/login?returnTo=/member/settings");
        return;
      }

      const res = await fetch("/api/member/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/member/login?returnTo=/member/settings");
          return;
        }
        throw new Error("Failed to load profile");
      }

      const data = await res.json();
      setProfile(data.member);
      setFirstName(data.member.firstName || "");
      setLastName(data.member.lastName || "");
      setPhone(data.member.phone || "");
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmailPreferences() {
    try {
      const res = await fetch("/api/member/email-preferences");

      if (!res.ok) {
        throw new Error("Failed to load email preferences");
      }

      const data = await res.json();
      setEmailPreferences(data.preferences);
    } catch (err: any) {
      console.error("Failed to load email preferences:", err);
      setPreferencesError(err.message);
    }
  }

  async function handleUpdatePreference(key: keyof EmailPreferences, value: boolean) {
    setSavingPreferences(true);
    setPreferencesError(null);
    setPreferencesSuccess(null);

    // Optimistically update UI
    if (emailPreferences) {
      setEmailPreferences({ ...emailPreferences, [key]: value });
    }

    try {
      const res = await fetch("/api/member/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Revert on error
        if (emailPreferences) {
          setEmailPreferences({ ...emailPreferences, [key]: !value });
        }
        throw new Error(data.error || "Failed to update preference");
      }

      setEmailPreferences(data.preferences);
      setPreferencesSuccess("Preference updated!");
      setTimeout(() => setPreferencesSuccess(null), 2000);
    } catch (err: any) {
      setPreferencesError(err.message);
    } finally {
      setSavingPreferences(false);
    }
  }

  // Load email preferences when switching to notifications tab
  useEffect(() => {
    if (activeTab === "notifications" && !emailPreferences) {
      loadEmailPreferences();
    }
  }, [activeTab, emailPreferences]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("member_token");
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data.member);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setChangingPassword(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      setChangingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem("member_token");
      const res = await fetch("/api/member/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p>Loading settings...</p>
          </div>
        </div>
        <style jsx>{pageStyles}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <h1>Unable to load settings</h1>
            <p>{error || "Please try logging in again."}</p>
            <button
              onClick={() => router.push("/member/login")}
              className="primary-button"
            >
              Go to Login
            </button>
          </div>
        </div>
        <style jsx>{pageStyles}</style>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div>
            <h1>Account Settings</h1>
            <p>Manage your profile, password, and wallet</p>
          </div>
          <Link href="/member/dashboard" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          <button
            className={`tab ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password
          </button>
          <button
            className={`tab ${activeTab === "wallet" ? "active" : ""}`}
            onClick={() => setActiveTab("wallet")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Wallet
          </button>
          <button
            className={`tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <h2>Profile Information</h2>
            <p className="tab-description">Update your personal information</p>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            <form onSubmit={handleUpdateProfile} className="form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="disabled-input"
                />
                <p className="field-hint">Email cannot be changed</p>
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone Number (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  disabled={saving}
                />
              </div>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <div className="info-section">
              <p className="info-label">Member Since</p>
              <p className="info-value">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="tab-content">
            <h2>Change Password</h2>
            <p className="tab-description">Update your password to keep your account secure</p>

            {passwordError && <div className="message error">{passwordError}</div>}
            {passwordSuccess && <div className="message success">{passwordSuccess}</div>}

            <form onSubmit={handleChangePassword} className="form">
              <div className="form-field">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-wrapper">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-wrapper">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="field-hint">Must be at least 8 characters</p>
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="field-error">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
              >
                {changingPassword ? "Changing Password..." : "Change Password"}
              </button>
            </form>

            <div className="security-tip">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                Use a strong password with a mix of letters, numbers, and special characters.
                Never share your password with anyone.
              </p>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="tab-content">
            <h2>Wallet Settings</h2>
            <p className="tab-description">Manage your cryptocurrency wallet for USDC payouts</p>

            <div className="wallet-section">
              {profile.walletAddress ? (
                <>
                  <div className="wallet-connected">
                    <div className="wallet-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="wallet-label">Connected Wallet</p>
                      <code className="wallet-address">{profile.walletAddress}</code>
                    </div>
                  </div>
                  <p className="wallet-hint">
                    This wallet address is used for USDC payout claims. To change your wallet,
                    you'll need to disconnect and reconnect with a new wallet.
                  </p>
                </>
              ) : (
                <div className="no-wallet">
                  <div className="no-wallet-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3>No Wallet Connected</h3>
                  <p>
                    Connect a cryptocurrency wallet to receive USDC payouts from merchants
                    that offer real money rewards.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => router.push("/member/login?method=wallet")}
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            <div className="info-box">
              <h4>About USDC Payouts</h4>
              <ul>
                <li>USDC is a stablecoin pegged to the US dollar</li>
                <li>Payouts are sent on the Polygon network for low fees</li>
                <li>You'll need a compatible wallet (MetaMask, Coinbase, etc.)</li>
                <li>Payouts are processed instantly once claimed</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="tab-content">
            <h2>Email Notifications</h2>
            <p className="tab-description">Manage what emails you receive from us and merchants</p>

            {preferencesError && <div className="message error">{preferencesError}</div>}
            {preferencesSuccess && <div className="message success">{preferencesSuccess}</div>}

            {!emailPreferences ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                Loading preferences...
              </div>
            ) : (
              <>
                {/* System Notifications Section */}
                <div className="notification-section">
                  <h3 className="section-title">System Notifications</h3>
                  <p className="section-description">Emails from Get On Blockchain platform</p>

                  <div className="toggle-list">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Payout Confirmations</span>
                        <span className="toggle-description">
                          Get notified when you receive USDC payouts
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.payoutNotifications}
                          onChange={(e) => handleUpdatePreference("payoutNotifications", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Magic Link Emails</span>
                        <span className="toggle-description">
                          Receive passwordless login links (requires password if disabled)
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.magicLinkEnabled}
                          onChange={(e) => handleUpdatePreference("magicLinkEnabled", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Security Alerts</span>
                        <span className="toggle-description">
                          Important account security notifications
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.securityAlerts}
                          onChange={(e) => handleUpdatePreference("securityAlerts", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Merchant Notifications Section */}
                <div className="notification-section">
                  <h3 className="section-title">Merchant Notifications</h3>
                  <p className="section-description">Emails from businesses you're a member of</p>

                  <div className="toggle-list">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Promotional Offers</span>
                        <span className="toggle-description">
                          Special deals and discounts from merchants
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.merchantPromotional}
                          onChange={(e) => handleUpdatePreference("merchantPromotional", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Points & Tier Updates</span>
                        <span className="toggle-description">
                          Notifications about points earned and tier changes
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.merchantPointsUpdates}
                          onChange={(e) => handleUpdatePreference("merchantPointsUpdates", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <span className="toggle-label">Business Announcements</span>
                        <span className="toggle-description">
                          News and updates from businesses you support
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={emailPreferences.merchantAnnouncements}
                          onChange={(e) => handleUpdatePreference("merchantAnnouncements", e.target.checked)}
                          disabled={savingPreferences}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="info-box">
                  <h4>Note About Critical Emails</h4>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                    Some emails cannot be disabled, including account verification, password resets,
                    and critical security alerts. These are essential for protecting your account.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <style jsx>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .settings-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 2rem;
  }

  .settings-container {
    max-width: 700px;
    margin: 0 auto;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .settings-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .settings-header p {
    color: #6b7280;
    margin: 0;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .back-link:hover {
    color: #1f2937;
    background: #f3f4f6;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .tab.active {
    background: #244b7a;
    color: white;
  }

  .tab-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .tab-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .tab-description {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    font-size: 0.9rem;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-field label {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  .form-field input {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .form-field input:focus {
    outline: none;
    border-color: #244b7a;
    box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
  }

  .form-field input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  .disabled-input {
    background: #f3f4f6 !important;
    color: #6b7280;
  }

  .field-hint {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0;
  }

  .field-error {
    font-size: 0.8rem;
    color: #dc2626;
    margin: 0;
  }

  .password-wrapper {
    position: relative;
    display: flex;
  }

  .password-wrapper input {
    flex: 1;
    padding-right: 4rem;
  }

  .toggle-password {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #244b7a;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .toggle-password:hover {
    color: #1e3a5f;
  }

  .primary-button {
    padding: 0.875rem 1.5rem;
    background: linear-gradient(to right, #244b7a, #8bbcff);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .primary-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(36, 75, 122, 0.3);
  }

  .primary-button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
  }

  .secondary-button {
    padding: 0.75rem 1.5rem;
    background: white;
    color: #244b7a;
    border: 2px solid #244b7a;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .secondary-button:hover {
    background: #244b7a;
    color: white;
  }

  .info-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .info-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    font-weight: 600;
  }

  .info-value {
    font-size: 1rem;
    color: #1f2937;
    margin: 0;
  }

  .security-tip {
    display: flex;
    gap: 0.75rem;
    margin-top: 2rem;
    padding: 1rem;
    background: #eff6ff;
    border-radius: 8px;
    color: #1e40af;
    font-size: 0.875rem;
  }

  .security-tip svg {
    flex-shrink: 0;
  }

  .security-tip p {
    margin: 0;
    line-height: 1.5;
  }

  .wallet-section {
    margin-bottom: 2rem;
  }

  .wallet-connected {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: #d1fae5;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .wallet-icon {
    width: 48px;
    height: 48px;
    background: #10b981;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .wallet-label {
    font-size: 0.875rem;
    color: #065f46;
    margin: 0 0 0.25rem 0;
    font-weight: 600;
  }

  .wallet-address {
    font-size: 0.85rem;
    color: #047857;
    word-break: break-all;
    background: rgba(255,255,255,0.5);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .wallet-hint {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .no-wallet {
    text-align: center;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 12px;
    border: 2px dashed #d1d5db;
  }

  .no-wallet-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    background: #e5e7eb;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }

  .no-wallet h3 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
  }

  .no-wallet p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    font-size: 0.9rem;
  }

  .info-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .info-box h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: #374151;
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .info-box li {
    margin-bottom: 0.5rem;
  }

  .info-box li:last-child {
    margin-bottom: 0;
  }

  /* Notification Settings Styles */
  .notification-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .section-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1rem 0;
  }

  .toggle-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: #f9fafb;
    border-radius: 12px;
    overflow: hidden;
  }

  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
  }

  .toggle-item:last-child {
    border-bottom: none;
  }

  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .toggle-label {
    font-weight: 500;
    color: #1f2937;
    font-size: 0.9rem;
  }

  .toggle-description {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d1d5db;
    transition: 0.3s;
    border-radius: 26px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch input:checked + .toggle-slider {
    background-color: #10b981;
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }

  .toggle-switch input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .settings-page {
      padding: 1rem;
    }

    .settings-header {
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .tabs {
      flex-wrap: wrap;
    }

    .tab {
      flex: none;
      min-width: calc(50% - 0.25rem);
    }

    .tab-content {
      padding: 1.5rem;
    }
  }
`;
