"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MemberData = {
  id: string;
  email: string;
  points: number;
  tier: string;
  businesses: {
    businessId: string;
    businessName: string;
    points: number;
    walletAddress: string | null;
    payoutEligible: boolean;
    payoutAmount: number;
    milestonePoints: number;
  }[];
};

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadMemberData();
  }, []);

  async function loadMemberData() {
    try {
      const res = await fetch("/api/member/me");

      if (res.status === 401) {
        // Not logged in, redirect to login
        router.push("/member/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load member data");
      }

      const data = await res.json();
      setMember(data);
    } catch (err: any) {
      console.error("Failed to load member data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimPayout(businessId: string) {
    if (!member) return;

    setClaiming(businessId);
    setError(null);

    try {
      const res = await fetch("/api/rewards/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim payout");
      }

      alert(`Success! $${data.amount} USDC sent to your wallet!\n\nTransaction: ${data.txHash.slice(0, 20)}...`);

      // Reload member data
      await loadMemberData();
    } catch (err: any) {
      console.error("Payout claim failed:", err);
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <main className="member-dashboard">
        <div className="member-dashboard-container">
          <div className="member-dashboard-header">
            <h1>💎 My Rewards</h1>
          </div>
          <p className="member-dashboard-loading">Loading your rewards...</p>
        </div>
      </main>
    );
  }

  if (error && !member) {
    return (
      <main className="member-dashboard">
        <div className="member-dashboard-container">
          <div className="member-dashboard-header">
            <h1>💎 My Rewards</h1>
          </div>
          <div className="member-dashboard-error">
            <p>{error}</p>
            <button onClick={loadMemberData} className="member-button">
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!member) {
    return null; // Will redirect to login
  }

  const totalPoints = member.businesses.reduce((sum, b) => sum + b.points, 0);

  return (
    <main className="member-dashboard">
      <div className="member-dashboard-container">
        {/* Header */}
        <div className="member-dashboard-header">
          <div>
            <h1>💎 My Rewards</h1>
            <p className="member-email">{member.email}</p>
          </div>
          <div className="member-total-points">
            <div className="member-points-value">{totalPoints}</div>
            <div className="member-points-label">Total Points</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="member-dashboard-error">
            <p>{error}</p>
          </div>
        )}

        {/* Business Cards */}
        {member.businesses.length === 0 ? (
          <div className="member-empty-state">
            <h2>👋 Welcome!</h2>
            <p>You haven't earned any rewards yet.</p>
            <p>Visit participating businesses and scan QR codes to start earning!</p>
          </div>
        ) : (
          <div className="member-businesses">
            {member.businesses.map((business) => (
              <div key={business.businessId} className="member-business-card">
                <div className="member-business-header">
                  <h3>{business.businessName}</h3>
                  <div className="member-business-points">
                    {business.points} pts
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="member-progress">
                  <div className="member-progress-bar">
                    <div
                      className="member-progress-fill"
                      style={{
                        width: `${Math.min((business.points / business.milestonePoints) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="member-progress-label">
                    {business.points} / {business.milestonePoints} points to ${business.payoutAmount} USDC
                  </div>
                </div>

                {/* Wallet Info */}
                {business.walletAddress && (
                  <div className="member-wallet-info">
                    <div className="member-wallet-label">Your Wallet:</div>
                    <code className="member-wallet-address">
                      {business.walletAddress.slice(0, 10)}...{business.walletAddress.slice(-8)}
                    </code>
                  </div>
                )}

                {/* Claim Button */}
                {business.payoutEligible ? (
                  <button
                    onClick={() => claimPayout(business.businessId)}
                    disabled={claiming === business.businessId}
                    className="member-claim-button"
                  >
                    {claiming === business.businessId
                      ? "Claiming..."
                      : `🎉 Claim $${business.payoutAmount} USDC`}
                  </button>
                ) : (
                  <div className="member-not-eligible">
                    {!business.walletAddress ? (
                      <>
                        <p>⚠️ No wallet connected</p>
                        <small>Visit the business to connect your wallet</small>
                      </>
                    ) : (
                      <>
                        <p>Keep earning!</p>
                        <small>
                          {business.milestonePoints - business.points} more points needed
                        </small>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="member-dashboard-footer">
          <p>
            <strong>How it works:</strong> Earn points at participating businesses.
            When you reach {member.businesses[0]?.milestonePoints || 100} points, claim your USDC payout!
          </p>
          <button
            onClick={() => {
              document.cookie = "gob_member_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
              router.push("/");
            }}
            className="member-logout-button"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
