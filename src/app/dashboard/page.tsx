"use client";

import { useEffect, useState } from "react";
import BusinessDashboard from "@/app/components/BusinessDahboard";

type Merchant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

type DashboardData = {
  merchants: Merchant[];
  membersByMerchant: Record<string, number>;
  eventsByMerchant: Record<
    string,
    {
      total: number;
      SCAN: number;
      CONNECT_WALLET: number;
      CREATE_EMAIL: number;
      REWARD_EARNED: number;
      REWARD_REDEEMED: number;
    }
  >;
  error?: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard-summary");
        const json = await res.json();

        if (!res.ok || json.error) {
          setError(json.error || "Failed to load dashboard data.");
        } else {
          setData(json);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <h1 style={{ color: "#244B7A", marginBottom: "1rem" }}>
            Blockchain Reward & Loyalty Dashboard
          </h1>
          <p className="section-sub">Loading stats…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="section">
        <div className="container">
          <h1 style={{ color: "#244B7A", marginBottom: "1rem" }}>
            Blockchain Reward & Loyalty
          </h1>
          <p className="section-sub">
            {error ||
              "The dashboard is currently unavailable. Check your Supabase connection and try again."}
          </p>
        </div>
      </main>
    );
  }

  const { merchants, membersByMerchant, eventsByMerchant } = data;

  return (
    <main style={{ background: "linear-gradient(180deg, #f9fbff 0%, #ffffff 100%)", minHeight: "100vh", padding: 0 }}>
      {/* Business Dashboard with Real Data */}
      <BusinessDashboard
        merchants={merchants}
        membersByMerchant={membersByMerchant}
        eventsByMerchant={eventsByMerchant}
      />

      {/* Original Data Table (collapsed below mockup) */}
      <div className="section">
        <div className="container">
          <details style={{ marginTop: "2rem" }}>
            <summary style={{
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#244B7A",
              padding: "1rem",
              background: "white",
              borderRadius: "0.8rem",
              border: "1px solid rgba(148, 163, 184, 0.2)"
            }}>
              📊 View Raw Data Table
            </summary>
            <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Plan</th>
                    <th>Members</th>
                    <th>Total Events</th>
                    <th>Scans</th>
                    <th>Wallet Connects</th>
                    <th>Email Signups</th>
                    <th>Rewards Earned</th>
                    <th>Rewards Redeemed</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((m) => {
                    const stats =
                      eventsByMerchant[m.id] || {
                        total: 0,
                        SCAN: 0,
                        CONNECT_WALLET: 0,
                        CREATE_EMAIL: 0,
                        REWARD_EARNED: 0,
                        REWARD_REDEEMED: 0,
                      };

                    return (
                      <tr key={m.id}>
                        <td>
                          <strong>{m.name}</strong>
                          <br />
                          <span className="dashboard-slug">{m.slug}</span>
                        </td>
                        <td>{m.plan}</td>
                        <td>{membersByMerchant[m.id] ?? 0}</td>
                        <td>{stats.total}</td>
                        <td>{stats.SCAN}</td>
                        <td>{stats.CONNECT_WALLET}</td>
                        <td>{stats.CREATE_EMAIL}</td>
                        <td>{stats.REWARD_EARNED}</td>
                        <td>{stats.REWARD_REDEEMED}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}