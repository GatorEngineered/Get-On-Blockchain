"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Merchant = {
  id: string;
  slug: string;
  name: string;
  loginEmail: string;
  plan: string;
  businessCount: number;
  memberCount: number;
  eventCount: number;
  totalPointsDistributed: number;
  lastActivity: string | null;
  createdAt: string;
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await fetch("/api/admin/merchants", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch merchants");
        }
        const data = await res.json();
        setMerchants(data.merchants);
        setFilteredMerchants(data.merchants);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load merchants");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // Filter merchants based on search and plan filter
  useEffect(() => {
    let filtered = merchants;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (merchant) =>
          merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          merchant.loginEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          merchant.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply plan filter
    if (planFilter !== "ALL") {
      filtered = filtered.filter((merchant) => merchant.plan === planFilter);
    }

    setFilteredMerchants(filtered);
  }, [searchQuery, planFilter, merchants]);

  if (isLoading) {
    return (
      <div className="admin-card">
        <p>Loading merchants...</p>
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
            All Merchants ({merchants.length})
          </h2>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by name, email, or slug..."
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
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "150px",
            }}
          >
            <option value="ALL">All Plans</option>
            <option value="STARTER">Starter</option>
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="GROWTH">Growth</option>
            <option value="PRO">Pro</option>
          </select>
        </div>

        {/* Results Count */}
        {searchQuery || planFilter !== "ALL" ? (
          <p style={{ marginBottom: "12px", color: "#666", fontSize: "14px" }}>
            Showing {filteredMerchants.length} of {merchants.length} merchants
          </p>
        ) : null}

        {filteredMerchants.length === 0 ? (
          <p>No merchants found matching your filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Locations</th>
                  <th>Members</th>
                  <th>Points Distributed</th>
                  <th>Events</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>
                      <strong>{merchant.name}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        /{merchant.slug}
                      </span>
                    </td>
                    <td>{merchant.loginEmail}</td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: getPlanColor(merchant.plan),
                          color: "white",
                        }}
                      >
                        {merchant.plan}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>{merchant.businessCount}</td>
                    <td style={{ textAlign: "center" }}>{merchant.memberCount}</td>
                    <td style={{ textAlign: "center" }}>
                      {merchant.totalPointsDistributed.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center" }}>{merchant.eventCount}</td>
                    <td>
                      {merchant.lastActivity
                        ? new Date(merchant.lastActivity).toLocaleDateString()
                        : "No activity"}
                    </td>
                    <td>
                      <Link
                        href={`/admin/merchants/${merchant.id}`}
                        className="admin-btn admin-btn-primary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        View Details
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

function getPlanColor(plan: string): string {
  switch (plan) {
    case "STARTER":
      return "#6b7280";
    case "BASIC":
      return "#3b82f6";
    case "PREMIUM":
      return "#8b5cf6";
    case "GROWTH":
      return "#f59e0b";
    case "PRO":
      return "#10b981";
    default:
      return "#6b7280";
  }
}
