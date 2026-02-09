"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type MerchantDetail = {
  merchant: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    loginEmail: string;
    plan: string;
    welcomePoints: number;
    earnPerVisit: number;
    vipThreshold: number;
    primaryColor: string | null;
    accentColor: string | null;
    payoutEnabled: boolean;
    payoutMilestonePoints: number;
    payoutAmountUSD: number;
    payoutNetwork: string;
    usdcBalance: number | null;
    lowBalanceThreshold: number;
    notificationEmail: string | null;
    createdAt: string;
    updatedAt: string;
  };
  businesses: Array<{
    id: string;
    name: string;
    locationNickname: string | null;
    address: string;
    _count: {
      members: number;
      rewardTransactions: number;
    };
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    createdAt: string;
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    createdAt: string;
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    business: {
      id: string;
      name: string;
      locationNickname: string | null;
    };
  }>;
  kpis: {
    totalMembers: number;
    totalLocations: number;
    totalEvents: number;
    totalTransactions: number;
    totalPointsDistributed: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalPayouts: number;
    avgPointsPerMember: number;
  };
};

type MemberData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  walletAddress: string | null;
  tier: string;
  createdAt: string;
  businesses: Array<{
    businessId: string;
    businessName: string;
    locationNickname: string | null;
    points: number;
    tier: string;
  }>;
  stats: {
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    totalTransactions: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    createdAt: string;
    business: {
      name: string;
      locationNickname: string | null;
    };
  }>;
};

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<MerchantDetail | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "members" | "events" | "transactions">("overview");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    tagline: "",
    plan: "",
    welcomePoints: 0,
    earnPerVisit: 0,
    vipThreshold: 0,
    primaryColor: "",
    accentColor: "",
    payoutEnabled: false,
    payoutMilestonePoints: 0,
    payoutAmountUSD: 0,
    payoutNetwork: "",
    lowBalanceThreshold: 0,
    notificationEmail: "",
  });

  useEffect(() => {
    const fetchMerchantDetail = async () => {
      try {
        const res = await fetch(`/api/admin/merchants/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch merchant details");
        }
        const merchantData = await res.json();
        setData(merchantData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load merchant");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchMerchantDetail();
    }
  }, [params.id]);

  // Fetch members when members tab is selected
  useEffect(() => {
    const fetchMembers = async () => {
      if (activeTab !== "members" || !params.id) return;

      setIsMembersLoading(true);
      try {
        const res = await fetch(`/api/admin/merchants/${params.id}/members`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch members");
        }
        const membersData = await res.json();
        setMembers(membersData.members);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setIsMembersLoading(false);
      }
    };

    fetchMembers();
  }, [activeTab, params.id]);

  const handleEditClick = () => {
    if (!data) return;
    // Populate form with current data
    setEditForm({
      name: data.merchant.name,
      tagline: data.merchant.tagline || "",
      plan: data.merchant.plan,
      welcomePoints: data.merchant.welcomePoints,
      earnPerVisit: data.merchant.earnPerVisit,
      vipThreshold: data.merchant.vipThreshold,
      primaryColor: data.merchant.primaryColor || "",
      accentColor: data.merchant.accentColor || "",
      payoutEnabled: data.merchant.payoutEnabled,
      payoutMilestonePoints: data.merchant.payoutMilestonePoints,
      payoutAmountUSD: data.merchant.payoutAmountUSD,
      payoutNetwork: data.merchant.payoutNetwork,
      lowBalanceThreshold: data.merchant.lowBalanceThreshold,
      notificationEmail: data.merchant.notificationEmail || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!params.id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/merchants/${params.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update merchant");
      }

      const updatedData = await res.json();

      // Refresh the page data
      const refreshRes = await fetch(`/api/admin/merchants/${params.id}`, {
        credentials: "include",
      });
      if (refreshRes.ok) {
        const merchantData = await refreshRes.json();
        setData(merchantData);
      }

      setIsEditing(false);
      alert("Merchant updated successfully!");
    } catch (err) {
      console.error("Error saving merchant:", err);
      alert(err instanceof Error ? err.message : "Failed to save merchant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!params.id || !data) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/merchants/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete merchant");
      }

      alert(`Merchant "${data.merchant.name}" has been deleted.`);
      router.push("/admin/merchants");
    } catch (err) {
      console.error("Error deleting merchant:", err);
      alert(err instanceof Error ? err.message : "Failed to delete merchant");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-card">
        <p>Loading merchant details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-card">
        <p className="error-text">{error || "Merchant not found"}</p>
        <button onClick={() => router.push("/admin/merchants")} className="admin-btn admin-btn-secondary" style={{ marginTop: "12px" }}>
          Back to Merchants
        </button>
      </div>
    );
  }

  const { merchant, businesses, recentEvents, recentTransactions, kpis } = data;

  return (
    <div>
      {/* Header */}
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "28px" }}>{merchant.name}</h2>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: "#2563eb",
                  color: "white",
                }}
              >
                {merchant.plan}
              </span>
            </div>
            <p style={{ margin: "4px 0", color: "#666" }}>/{merchant.slug}</p>
            <p style={{ margin: "4px 0", color: "#666" }}>{merchant.loginEmail}</p>
            {merchant.tagline && <p style={{ margin: "8px 0", fontStyle: "italic" }}>{merchant.tagline}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="admin-btn admin-btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="admin-btn admin-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditClick}
                  className="admin-btn admin-btn-primary"
                >
                  Edit Merchant
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="admin-btn"
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                  }}
                >
                  Delete
                </button>
                <Link href="/admin/merchants" className="admin-btn admin-btn-secondary">
                  Back to List
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <KPICard label="Total Members" value={kpis.totalMembers} />
        <KPICard label="Locations" value={kpis.totalLocations} />
        <KPICard label="Points Earned" value={kpis.totalPointsEarned.toLocaleString()} />
        <KPICard label="Points Redeemed" value={kpis.totalPointsRedeemed.toLocaleString()} />
        <KPICard label="Total Events" value={kpis.totalEvents} />
        <KPICard label="Transactions" value={kpis.totalTransactions} />
        <KPICard label="Avg Points/Member" value={kpis.avgPointsPerMember} />
        <KPICard label="Payouts" value={kpis.totalPayouts} />
      </div>

      {/* Tabs */}
      <div className="admin-card">
        <div style={{ borderBottom: "1px solid #e5e5e5", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <TabButton label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <TabButton label={`Businesses (${businesses.length})`} active={activeTab === "businesses"} onClick={() => setActiveTab("businesses")} />
            <TabButton label={`Members (${kpis.totalMembers})`} active={activeTab === "members"} onClick={() => setActiveTab("members")} />
            <TabButton label="Recent Events" active={activeTab === "events"} onClick={() => setActiveTab("events")} />
            <TabButton label="Recent Transactions" active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} />
          </div>
        </div>

        {activeTab === "overview" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            {isEditing ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <FormField
                  label="Merchant Name"
                  value={editForm.name}
                  onChange={(value) => setEditForm({ ...editForm, name: value })}
                />
                <FormField
                  label="Tagline"
                  value={editForm.tagline}
                  onChange={(value) => setEditForm({ ...editForm, tagline: value })}
                />
                <FormField
                  label="Plan"
                  type="select"
                  value={editForm.plan}
                  onChange={(value) => setEditForm({ ...editForm, plan: value })}
                  options={["FREE", "BASIC", "PRO", "ENTERPRISE"]}
                />
                <FormField
                  label="Welcome Points"
                  type="number"
                  value={editForm.welcomePoints.toString()}
                  onChange={(value) => setEditForm({ ...editForm, welcomePoints: parseInt(value) || 0 })}
                />
                <FormField
                  label="Points Per Visit"
                  type="number"
                  value={editForm.earnPerVisit.toString()}
                  onChange={(value) => setEditForm({ ...editForm, earnPerVisit: parseInt(value) || 0 })}
                />
                <FormField
                  label="VIP Threshold"
                  type="number"
                  value={editForm.vipThreshold.toString()}
                  onChange={(value) => setEditForm({ ...editForm, vipThreshold: parseInt(value) || 0 })}
                />
                <FormField
                  label="Primary Color"
                  value={editForm.primaryColor}
                  onChange={(value) => setEditForm({ ...editForm, primaryColor: value })}
                  placeholder="#244B7A"
                />
                <FormField
                  label="Accent Color"
                  value={editForm.accentColor}
                  onChange={(value) => setEditForm({ ...editForm, accentColor: value })}
                  placeholder="#7DD3FC"
                />
                <FormField
                  label="Payout Enabled"
                  type="checkbox"
                  value={editForm.payoutEnabled ? "true" : "false"}
                  onChange={(value) => setEditForm({ ...editForm, payoutEnabled: value === "true" })}
                />
                <FormField
                  label="Payout Milestone (points)"
                  type="number"
                  value={editForm.payoutMilestonePoints.toString()}
                  onChange={(value) => setEditForm({ ...editForm, payoutMilestonePoints: parseInt(value) || 0 })}
                />
                <FormField
                  label="Payout Amount (USD)"
                  type="number"
                  value={editForm.payoutAmountUSD.toString()}
                  onChange={(value) => setEditForm({ ...editForm, payoutAmountUSD: parseFloat(value) || 0 })}
                />
                <FormField
                  label="Payout Network"
                  type="select"
                  value={editForm.payoutNetwork}
                  onChange={(value) => setEditForm({ ...editForm, payoutNetwork: value })}
                  options={["BASE", "POLYGON", "ETHEREUM"]}
                />
                <FormField
                  label="Low Balance Threshold"
                  type="number"
                  value={editForm.lowBalanceThreshold.toString()}
                  onChange={(value) => setEditForm({ ...editForm, lowBalanceThreshold: parseFloat(value) || 0 })}
                />
                <FormField
                  label="Notification Email"
                  value={editForm.notificationEmail}
                  onChange={(value) => setEditForm({ ...editForm, notificationEmail: value })}
                  placeholder="notifications@example.com"
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <SettingRow label="Welcome Points" value={merchant.welcomePoints} />
                <SettingRow label="Points Per Visit" value={merchant.earnPerVisit} />
                <SettingRow label="VIP Threshold" value={merchant.vipThreshold} />
                <SettingRow label="Primary Color" value={merchant.primaryColor || "Not set"} />
                <SettingRow label="Accent Color" value={merchant.accentColor || "Not set"} />
                <SettingRow label="Payout Enabled" value={merchant.payoutEnabled ? "Yes" : "No"} />
                <SettingRow label="Payout Milestone" value={`${merchant.payoutMilestonePoints} points`} />
                <SettingRow label="Payout Amount" value={`$${merchant.payoutAmountUSD}`} />
                <SettingRow label="Payout Network" value={merchant.payoutNetwork} />
                <SettingRow label="USDC Balance" value={merchant.usdcBalance ? `$${merchant.usdcBalance}` : "Not checked"} />
              </div>
            )}
          </div>
        )}

        {activeTab === "businesses" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Locations</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Address</th>
                  <th>Members</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td>{business.name}</td>
                    <td>{business.locationNickname || "—"}</td>
                    <td>{business.address}</td>
                    <td style={{ textAlign: "center" }}>{business._count.members}</td>
                    <td style={{ textAlign: "center" }}>{business._count.rewardTransactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <h3 style={{ marginTop: 0 }}>All Members</h3>
            {isMembersLoading ? (
              <p>Loading members...</p>
            ) : members.length === 0 ? (
              <p>No members found for this merchant.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Current Points</th>
                    <th>Total Earned</th>
                    <th>Total Redeemed</th>
                    <th>Transactions</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.firstName} {member.lastName}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          Tier: {member.tier}
                        </span>
                      </td>
                      <td>{member.email}</td>
                      <td>{member.phone || "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "#2563eb" }}>
                        {member.stats.currentPoints}
                      </td>
                      <td style={{ textAlign: "center", color: "#10b981" }}>
                        {member.stats.totalEarned.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "center", color: "#f59e0b" }}>
                        {member.stats.totalRedeemed.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "center" }}>{member.stats.totalTransactions}</td>
                      <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="admin-btn admin-btn-primary"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Recent Events</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Member</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.type}</td>
                    <td>
                      {event.member
                        ? `${event.member.firstName} ${event.member.lastName} (${event.member.email})`
                        : "—"}
                    </td>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Member</th>
                  <th>Business</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          background: tx.type === "EARN" ? "#10b981" : tx.type === "REDEEM" ? "#f59e0b" : "#6b7280",
                          color: "white",
                        }}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td>{`${tx.member.firstName} ${tx.member.lastName}`}</td>
                    <td>
                      {tx.business.name}
                      {tx.business.locationNickname && ` - ${tx.business.locationNickname}`}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{tx.amount}</td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="admin-card"
            style={{
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedMember.firstName} {selectedMember.lastName}</h2>
                <p style={{ margin: "4px 0", color: "#666" }}>{selectedMember.email}</p>
                {selectedMember.phone && <p style={{ margin: "4px 0", color: "#666" }}>{selectedMember.phone}</p>}
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>

            {/* Member Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: "6px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Current Points</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: 600, color: "#2563eb" }}>
                  {selectedMember.stats.currentPoints}
                </p>
              </div>
              <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "6px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Earned</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: 600, color: "#10b981" }}>
                  {selectedMember.stats.totalEarned.toLocaleString()}
                </p>
              </div>
              <div style={{ padding: "12px", background: "#fffbeb", borderRadius: "6px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Redeemed</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: 600, color: "#f59e0b" }}>
                  {selectedMember.stats.totalRedeemed.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Businesses */}
            <h3 style={{ marginTop: 0 }}>Associated Businesses</h3>
            <table className="admin-table" style={{ marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Points</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {selectedMember.businesses.map((business) => (
                  <tr key={business.businessId}>
                    <td>
                      {business.businessName}
                      {business.locationNickname && ` - ${business.locationNickname}`}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{business.points}</td>
                    <td>{business.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Recent Transactions */}
            {selectedMember.recentTransactions && selectedMember.recentTransactions.length > 0 && (
              <>
                <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
                <table className="admin-table" style={{ marginBottom: "20px" }}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Business</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              background: tx.type === "EARN" ? "#10b981" : tx.type === "REDEEM" ? "#f59e0b" : "#6b7280",
                              color: "white",
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          {tx.business.name}
                          {tx.business.locationNickname && ` - ${tx.business.locationNickname}`}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{tx.amount}</td>
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Member since</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                {new Date(selectedMember.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="admin-card"
            style={{
              maxWidth: "450px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#991b1b" }}>Delete Merchant</h3>
            <p style={{ margin: "0 0 8px", color: "#666" }}>
              Are you sure you want to delete <strong>{merchant.name}</strong>?
            </p>
            <p style={{ margin: "0 0 24px", color: "#991b1b", fontSize: "14px" }}>
              This will permanently delete the merchant, all {kpis.totalLocations} locations, {kpis.totalMembers} member relationships, and all associated data. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="admin-btn admin-btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="admin-btn"
                disabled={isDeleting}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Merchant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card" style={{ textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: "14px", color: "#666", marginBottom: "8px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "32px", fontWeight: 600, color: "#1a1a1a" }}>{value}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px" }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#666", marginBottom: "4px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "16px", fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 0",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
        color: active ? "#2563eb" : "#666",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      {label}
    </button>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  options = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "select" | "checkbox";
  placeholder?: string;
  options?: string[];
}) {
  return (
    <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px" }}>
      <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "6px" }}>
        {label}
      </label>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #d4d4d4",
            fontSize: "14px",
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          style={{
            width: "20px",
            height: "20px",
            cursor: "pointer",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #d4d4d4",
            fontSize: "14px",
          }}
        />
      )}
    </div>
  );
}
