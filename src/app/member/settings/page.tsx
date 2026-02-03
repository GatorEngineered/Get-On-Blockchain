"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MemberWalletConnect from "./MemberWalletConnect";

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
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "wallet" | "notifications" | "special-days" | "notes">("profile");

  // Member notes state
  const [merchantsList, setMerchantsList] = useState<Array<{ merchantId: string; businessName: string; note: string | null }>>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [memberNote, setMemberNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  // Special days (birthday/anniversary) state
  const [birthdayMonth, setBirthdayMonth] = useState<number | null>(null);
  const [birthdayDay, setBirthdayDay] = useState<number | null>(null);
  const [birthdayYear, setBirthdayYear] = useState<number | null>(null);
  const [birthdayLocked, setBirthdayLocked] = useState(false);
  const [anniversaryDate, setAnniversaryDate] = useState<string>("");
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [savingAnniversary, setSavingAnniversary] = useState(false);
  const [specialDaysError, setSpecialDaysError] = useState<string | null>(null);
  const [specialDaysSuccess, setSpecialDaysSuccess] = useState<string | null>(null);

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

  // Load special days data when switching to that tab
  useEffect(() => {
    if (activeTab === "special-days") {
      loadSpecialDays();
    }
  }, [activeTab]);

  async function loadSpecialDays() {
    try {
      const [birthdayRes, anniversaryRes] = await Promise.all([
        fetch("/api/member/profile/birthday"),
        fetch("/api/member/profile/anniversary"),
      ]);

      if (birthdayRes.ok) {
        const birthdayData = await birthdayRes.json();
        if (birthdayData.birthday) {
          setBirthdayMonth(birthdayData.birthday.month);
          setBirthdayDay(birthdayData.birthday.day);
          setBirthdayYear(birthdayData.birthday.year || null);
        }
        setBirthdayLocked(birthdayData.isLocked);
      }

      if (anniversaryRes.ok) {
        const anniversaryData = await anniversaryRes.json();
        if (anniversaryData.anniversaryDate) {
          setAnniversaryDate(anniversaryData.anniversaryDate.split("T")[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load special days:", err);
      setSpecialDaysError("Failed to load special days data");
    }
  }

  async function handleSaveBirthday() {
    if (!birthdayMonth || !birthdayDay || !birthdayYear) {
      setSpecialDaysError("Please select month, day, and year");
      return;
    }

    setSavingBirthday(true);
    setSpecialDaysError(null);
    setSpecialDaysSuccess(null);

    try {
      const res = await fetch("/api/member/profile/birthday", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: birthdayMonth, day: birthdayDay, year: birthdayYear }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save birthday");
      }

      setBirthdayLocked(true);
      setSpecialDaysSuccess("Birthday saved! This cannot be changed.");
      setTimeout(() => setSpecialDaysSuccess(null), 3000);
    } catch (err: any) {
      setSpecialDaysError(err.message);
    } finally {
      setSavingBirthday(false);
    }
  }

  async function handleSaveAnniversary() {
    setSavingAnniversary(true);
    setSpecialDaysError(null);
    setSpecialDaysSuccess(null);

    try {
      const res = await fetch("/api/member/profile/anniversary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anniversaryDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save anniversary");
      }

      setSpecialDaysSuccess("Relationship anniversary date updated!");
      setTimeout(() => setSpecialDaysSuccess(null), 3000);
    } catch (err: any) {
      setSpecialDaysError(err.message);
    } finally {
      setSavingAnniversary(false);
    }
  }

  // Load member notes when switching to notes tab
  useEffect(() => {
    if (activeTab === "notes" && merchantsList.length === 0) {
      loadMemberNotes();
    }
  }, [activeTab]);

  async function loadMemberNotes() {
    try {
      setLoadingNotes(true);
      setNoteError(null);

      const res = await fetch("/api/member/note");

      if (!res.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await res.json();
      setMerchantsList(data.merchants || []);

      // Select first merchant by default if any exist
      if (data.merchants && data.merchants.length > 0) {
        setSelectedMerchantId(data.merchants[0].merchantId);
        setMemberNote(data.merchants[0].note || "");
      }
    } catch (err: any) {
      console.error("Failed to load member notes:", err);
      setNoteError(err.message);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function handleSaveMemberNote() {
    if (!selectedMerchantId) return;

    setSavingNote(true);
    setNoteError(null);
    setNoteSuccess(null);

    try {
      const res = await fetch("/api/member/note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: selectedMerchantId,
          note: memberNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      // Update local state
      setMerchantsList((prev) =>
        prev.map((m) =>
          m.merchantId === selectedMerchantId ? { ...m, note: memberNote } : m
        )
      );

      setNoteSuccess("Note saved!");
      setTimeout(() => setNoteSuccess(null), 3000);
    } catch (err: any) {
      setNoteError(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  // Update note when merchant selection changes
  function handleMerchantChange(merchantId: string) {
    setSelectedMerchantId(merchantId);
    const merchant = merchantsList.find((m) => m.merchantId === merchantId);
    setMemberNote(merchant?.note || "");
    setNoteSuccess(null);
    setNoteError(null);
  }

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
          <button
            className={`tab ${activeTab === "special-days" ? "active" : ""}`}
            onClick={() => setActiveTab("special-days")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 003 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
            </svg>
            Special Days
          </button>
          <button
            className={`tab ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes
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
              <MemberWalletConnect
                currentWallet={profile.walletAddress}
                onWalletConnected={(address) => {
                  setProfile((prev) => prev ? { ...prev, walletAddress: address } : null);
                }}
              />
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

        {/* Special Days Tab */}
        {activeTab === "special-days" && (
          <div className="tab-content">
            <h2>Special Days</h2>
            <p className="tab-description">Set your birthday and anniversary for special rewards</p>

            {specialDaysError && <div className="message error">{specialDaysError}</div>}
            {specialDaysSuccess && <div className="message success">{specialDaysSuccess}</div>}

            {/* Birthday Section */}
            <div className="special-days-section">
              <div className="special-days-header">
                <div className="special-days-icon" style={{ background: "#fef3c7" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>Birthday</h3>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                    {birthdayLocked
                      ? "Your birthday is set and cannot be changed"
                      : "Set your birthday once to claim birthday rewards from participating merchants"}
                  </p>
                </div>
              </div>

              {birthdayLocked ? (
                <div className="special-days-locked">
                  <span className="locked-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked
                  </span>
                  <span className="locked-value">
                    {birthdayMonth && birthdayDay
                      ? `${new Date(2000, birthdayMonth - 1, birthdayDay).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                      : "Not set"}
                  </span>
                </div>
              ) : (
                <div className="special-days-form">
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="form-field">
                      <label>Month</label>
                      <select
                        value={birthdayMonth || ""}
                        onChange={(e) => setBirthdayMonth(parseInt(e.target.value) || null)}
                        className="form-select"
                      >
                        <option value="">Select month</option>
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ].map((month, i) => (
                          <option key={i} value={i + 1}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Day</label>
                      <select
                        value={birthdayDay || ""}
                        onChange={(e) => setBirthdayDay(parseInt(e.target.value) || null)}
                        className="form-select"
                      >
                        <option value="">Select day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Year</label>
                      <select
                        value={birthdayYear || ""}
                        onChange={(e) => setBirthdayYear(parseInt(e.target.value) || null)}
                        className="form-select"
                      >
                        <option value="">Select year</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.5rem 0 0.75rem" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Your birth year is private and never shared with merchants
                  </p>
                  <div className="special-days-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Warning: Once saved, your birthday cannot be changed.</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                      className="primary-button"
                      onClick={handleSaveBirthday}
                      disabled={savingBirthday || !birthdayMonth || !birthdayDay || !birthdayYear}
                    >
                      {savingBirthday ? "Saving..." : "Save Birthday"}
                    </button>
                    {specialDaysSuccess && specialDaysSuccess.includes("Birthday") && (
                      <span style={{ color: "#059669", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Saved!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Relationship Anniversary Section */}
            <div className="special-days-section">
              <div className="special-days-header">
                <div className="special-days-icon" style={{ background: "#fce7f3" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>Relationship Anniversary</h3>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                    Set your wedding or relationship anniversary to claim special rewards (can be changed anytime)
                  </p>
                </div>
              </div>

              <div className="special-days-form">
                <div className="form-field">
                  <label>Anniversary Date</label>
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    className="form-input"
                  />
                  <p className="field-hint">
                    Enter your wedding or relationship anniversary date
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", alignItems: "center" }}>
                  <button
                    className="primary-button"
                    onClick={handleSaveAnniversary}
                    disabled={savingAnniversary || !anniversaryDate}
                  >
                    {savingAnniversary ? "Saving..." : "Save Anniversary"}
                  </button>
                  {specialDaysSuccess && specialDaysSuccess.includes("anniversary") && (
                    <span style={{ color: "#059669", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Saved!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="info-box">
              <h4>About Special Days Rewards</h4>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                Participating merchants may offer bonus points on your birthday and relationship anniversary.
                Check each merchant's page to see if they offer these special rewards.
                Each reward can only be claimed once per year within the merchant's specified window.
              </p>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="tab-content">
            <h2>My Notes</h2>
            <p className="tab-description">
              Write a personal note for each business you're a member of. This helps merchants get to know you better.
            </p>

            {noteError && <div className="message error">{noteError}</div>}
            {noteSuccess && <div className="message success">{noteSuccess}</div>}

            {loadingNotes ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                Loading your memberships...
              </div>
            ) : merchantsList.length === 0 ? (
              <div className="no-wallet" style={{ marginTop: 0 }}>
                <div className="no-wallet-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3>No Memberships Yet</h3>
                <p>
                  You haven't joined any loyalty programs yet. Once you scan your QR code at a
                  participating business, you'll be able to write notes for them here.
                </p>
              </div>
            ) : (
              <div className="notes-section">
                <div className="form-field">
                  <label>Select Business</label>
                  <select
                    className="form-select"
                    value={selectedMerchantId || ""}
                    onChange={(e) => handleMerchantChange(e.target.value)}
                  >
                    {merchantsList.map((m) => (
                      <option key={m.merchantId} value={m.merchantId}>
                        {m.businessName} {m.note ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="field-hint">
                    Choose a business to write or update your note
                  </p>
                </div>

                <div className="form-field" style={{ marginTop: "1.5rem" }}>
                  <label>Your Note</label>
                  <textarea
                    className="form-textarea"
                    value={memberNote}
                    onChange={(e) => setMemberNote(e.target.value)}
                    maxLength={300}
                    rows={4}
                    placeholder="Tell the merchant a bit about yourself, your preferences, or what you like to order..."
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                    <p className="field-hint">
                      This note is visible to the merchant
                    </p>
                    <span style={{ fontSize: "0.8rem", color: memberNote.length > 280 ? "#dc2626" : "#6b7280" }}>
                      {memberNote.length}/300
                    </span>
                  </div>
                </div>

                <button
                  className="primary-button"
                  onClick={handleSaveMemberNote}
                  disabled={savingNote || !selectedMerchantId}
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            )}

            <div className="info-box" style={{ marginTop: "2rem" }}>
              <h4>About Notes</h4>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                Notes you write are specific to each business. For example, you might tell a coffee shop
                your favorite drink, or let a gym know your workout preferences. Each note can be up to
                300 characters and can be updated anytime.
              </p>
            </div>
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
    overflow: hidden;
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

  /* Special Days Styles */
  .special-days-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .special-days-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .special-days-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .special-days-form {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .special-days-locked {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .locked-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background: #e5e7eb;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
  }

  .locked-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .special-days-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef3c7;
    border-radius: 8px;
    margin: 1rem 0;
    color: #92400e;
    font-size: 0.875rem;
  }

  .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .form-select:focus {
    outline: none;
    border-color: #244b7a;
    box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
  }

  .form-input {
    width: 100%;
    max-width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  /* Fix date input picker icon overflow */
  .form-input[type="date"] {
    max-width: 250px;
  }

  .form-input:focus {
    outline: none;
    border-color: #244b7a;
    box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
  }

  .form-textarea {
    width: 100%;
    max-width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .form-textarea:focus {
    outline: none;
    border-color: #244b7a;
    box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
  }

  .form-textarea::placeholder {
    color: #9ca3af;
  }

  .notes-section {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    overflow: hidden;
    box-sizing: border-box;
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
