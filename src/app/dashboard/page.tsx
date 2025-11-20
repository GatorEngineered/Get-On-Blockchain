"use client";

import { useEffect, useState } from "react";

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
    <main className="section">
      <div className="container">
        <h1 style={{ color: "#244B7A", marginBottom: "1rem" }}>
          Blockchain Reward & Loyalty
        </h1>
        <p className="section-sub">
          Quick view of merchants, members, and events. This is your internal
          cockpit for v1.
        </p>

        <div style={{ marginTop: "2rem", overflowX: "auto" }}>
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
      </div>
    </main>
  );
}
