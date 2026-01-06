"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/dashboard-mockups.module.css";

type MerchantMember = {
  id: string;
  merchantId: string;
  merchant: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    payoutEnabled: boolean;
    payoutMilestonePoints: number;
    payoutAmountUSD: number;
    businesses: {
      id: string;
      slug: string;
      name: string;
      locationNickname: string | null;
      address: string;
      city: string | null;
      state: string | null;
    }[];
  };
  walletAddress: string | null;
  walletNetwork: string | null;
  isCustodial: boolean | null;
  points: number; // Aggregated across all merchant locations
  tier: string;
  locations: {
    id: string;
    slug: string;
    name: string;
    locationNickname: string | null;
    address: string;
    city: string | null;
    state: string | null;
    visitCount: number;
    lastVisitAt: string | null;
    firstVisitAt: string | null;
  }[];
};

type Member = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress: string | null;
  tier: string;
  merchants: MerchantMember[]; // Changed from businesses
};

type RewardTransaction = {
  id: string;
  type: string;
  amount: number;
  pointsDeducted: number | null;
  usdcAmount: number | null;
  status: string;
  txHash: string | null;
  createdAt: string;
  reason: string | null;
  business: {
    name: string;
  };
};

type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: 'TRADITIONAL' | 'USDC_PAYOUT';
  usdcAmount: number | null;
};

type MerchantRewards = {
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  rewards: Reward[];
  memberPoints: number;
};

export default function MemberDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [merchantRewards, setMerchantRewards] = useState<MerchantRewards[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claimingPayout, setClaimingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    loadMemberData();
  }, []);

  async function loadMemberData() {
    try {
      const token = localStorage.getItem("member_token");
      if (!token) {
        router.push("/member/login?returnTo=/member/dashboard");
        return;
      }

      const res = await fetch("/api/member/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/member/login?returnTo=/member/dashboard");
          return;
        }
        throw new Error("Failed to load dashboard");
      }

      const data = await res.json();
      setMember(data.member);
      setTransactions(data.transactions || []);

      // Fetch rewards for each merchant the member is connected to
      if (data.member?.merchants?.length > 0) {
        const rewardsPromises = data.member.merchants.map(async (mm: MerchantMember) => {
          try {
            const rewardsRes = await fetch(`/api/merchant/${mm.merchant.slug}/rewards`);
            if (rewardsRes.ok) {
              const rewardsData = await rewardsRes.json();
              return {
                merchantId: mm.merchantId,
                merchantName: mm.merchant.name,
                merchantSlug: mm.merchant.slug,
                rewards: rewardsData.rewards || [],
                memberPoints: mm.points,
              };
            }
          } catch (e) {
            console.error(`Failed to fetch rewards for ${mm.merchant.slug}:`, e);
          }
          return {
            merchantId: mm.merchantId,
            merchantName: mm.merchant.name,
            merchantSlug: mm.merchant.slug,
            rewards: [],
            memberPoints: mm.points,
          };
        });

        const allRewards = await Promise.all(rewardsPromises);
        setMerchantRewards(allRewards);
      }
    } catch (err: any) {
      console.error("Failed to load member data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("member_token");
    router.push("/member/login");
  }

  async function handleClaimPayout(merchantId: string) {
    try {
      setClaimingPayout(true);
      setPayoutError(null);
      setPayoutSuccess(null);

      const res = await fetch("/api/member/claim-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim payout");
      }

      setPayoutSuccess(`Successfully claimed $${data.payout.amount} USDC! Transaction: ${data.payout.txHash?.slice(0, 10)}...`);

      // Reload member data to update points
      await loadMemberData();
    } catch (err: any) {
      console.error("Payout claim error:", err);
      setPayoutError(err.message);
    } finally {
      setClaimingPayout(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.mockupContainer}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h1>Loading your rewards...</h1>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={styles.mockupContainer}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h1>Unable to load dashboard</h1>
          <p>{error || "Please try logging in again."}</p>
          <button
            onClick={() => router.push("/member/login")}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(to right, #244b7a, #8bbcff)",
              color: "white",
              border: "none",
              borderRadius: "999px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Calculate total points across all merchants
  const totalPoints = member.merchants.reduce((sum, mm) => sum + mm.points, 0);

  // Find next reward milestone from all merchant rewards
  const allRewards = merchantRewards.flatMap((mr) => mr.rewards);
  const sortedRewards = [...allRewards].sort((a, b) => a.pointsCost - b.pointsCost);
  const nextRewardMilestone = sortedRewards.find((r) => r.pointsCost > totalPoints);
  const nextReward = nextRewardMilestone || sortedRewards[sortedRewards.length - 1];
  const progressPercentage = nextReward ? (totalPoints / nextReward.pointsCost) * 100 : 100;

  // Get tier level (using the highest tier across all merchants)
  const tierLevel = member.merchants.reduce((highest, mm) => {
    if (mm.tier === "SUPER") return "SUPER";
    if (mm.tier === "VIP" && highest !== "SUPER") return "VIP";
    return highest;
  }, "BASE");

  // Format transactions for display
  const formattedTransactions = transactions.slice(0, 6).map((t) => ({
    id: t.id,
    description: t.reason || `${t.type} Transaction`,
    points: t.type === "EARN" ? t.amount : -t.amount,
    date: new Date(t.createdAt).toLocaleDateString(),
    location: t.business.name,
  }));

  return (
    <div className={styles.mockupContainer}>
      {/* Header with Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div className={styles.customerWelcome}>
          <h1>Welcome back, {member.firstName}!</h1>
          <p className={styles.tierBadge}>
            <span className={styles.tierIcon}>★</span> {tierLevel} Member
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          Logout
        </button>
      </div>

      {/* Points Balance Card */}
      <div className={styles.pointsCard}>
        <div className={styles.pointsCardContent}>
          <div className={styles.pointsBalance}>
            <p className={styles.pointsLabel}>Your Total Points</p>
            <h2 className={styles.pointsNumber}>{totalPoints}</h2>
          </div>

          {nextReward ? (
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progress to next reward</span>
                <span className={styles.progressPoints}>
                  {totalPoints} / {nextReward.pointsCost}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <p className={styles.pointsRemaining}>
                {totalPoints >= nextReward.pointsCost
                  ? "You've reached the highest reward!"
                  : `${nextReward.pointsCost - totalPoints} points until ${nextReward.name}`}
              </p>
            </div>
          ) : (
            <div className={styles.progressSection}>
              <p className={styles.pointsRemaining}>
                No rewards available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Success Message */}
      {payoutSuccess && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>
              Payout Successful!
            </p>
            <p style={{ fontSize: '0.875rem', color: '#047857' }}>
              {payoutSuccess}
            </p>
          </div>
          <button
            onClick={() => setPayoutSuccess(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#047857',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Payout Error Message */}
      {payoutError && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.25rem' }}>
              Payout Failed
            </p>
            <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
              {payoutError}
            </p>
          </div>
          <button
            onClick={() => setPayoutError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* USDC Payout Section */}
      {member.merchants.some((mm) => mm.merchant.payoutEnabled) && (
        <div style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af', margin: 0 }}>
                Earn Real Money
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#3b82f6', margin: 0 }}>
                Convert your points to USDC cryptocurrency
              </p>
            </div>
          </div>

          {member.walletAddress && (
            <div style={{
              padding: '0.875rem',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '8px',
              marginBottom: '1.25rem'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>
                Your Wallet Address
              </p>
              <code style={{ fontSize: '0.85rem', color: '#1e3a8a', wordBreak: 'break-all' }}>
                {member.walletAddress}
              </code>
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {member.merchants
              .filter((mm) => mm.merchant.payoutEnabled)
              .map((mm) => {
                const canClaim = mm.points >= mm.merchant.payoutMilestonePoints;
                const pointsNeeded = mm.merchant.payoutMilestonePoints - mm.points;
                const locationCount = mm.merchant.businesses.length;

                return (
                  <div
                    key={mm.id}
                    style={{
                      background: 'white',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: canClaim ? '2px solid #10b981' : '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                          {mm.merchant.name}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {mm.points} / {mm.merchant.payoutMilestonePoints} points • {locationCount} location{locationCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#3b82f6' }}>
                          ${mm.merchant.payoutAmountUSD}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>USDC</div>
                      </div>
                    </div>

                    {canClaim ? (
                      <button
                        onClick={() => handleClaimPayout(mm.merchantId)}
                        disabled={claimingPayout}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: claimingPayout
                            ? '#9ca3af'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '700',
                          cursor: claimingPayout ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {claimingPayout ? (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin 1s linear infinite' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Claim ${mm.merchant.payoutAmountUSD} USDC Now
                          </>
                        )}
                      </button>
                    ) : (
                      <div style={{
                        padding: '0.875rem',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: 0 }}>
                          <strong>{pointsNeeded}</strong> more points needed to claim
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* Available Rewards - Per Merchant */}
      {merchantRewards.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Available Rewards</h3>
          {merchantRewards.map((mr) => (
            <div key={mr.merchantId} style={{ marginBottom: "1.5rem" }}>
              {merchantRewards.length > 1 && (
                <h4 style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  {mr.merchantName}
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "9999px"
                  }}>
                    {mr.memberPoints} pts
                  </span>
                </h4>
              )}
              {mr.rewards.length > 0 ? (
                <div className={styles.rewardsGrid}>
                  {mr.rewards.map((reward) => {
                    const canRedeem = mr.memberPoints >= reward.pointsCost;
                    return (
                      <div
                        key={reward.id}
                        className={`${styles.rewardCard} ${
                          canRedeem ? styles.rewardCardActive : styles.rewardCardInactive
                        }`}
                      >
                        <div className={styles.rewardHeader}>
                          <h4 className={styles.rewardName}>{reward.name}</h4>
                          <span className={styles.rewardPoints}>{reward.pointsCost} pts</span>
                        </div>
                        <p className={styles.rewardDescription}>
                          {reward.description || (reward.rewardType === 'USDC_PAYOUT'
                            ? `$${reward.usdcAmount?.toFixed(2)} USDC payout`
                            : 'Redeem at checkout')}
                        </p>
                        {reward.rewardType === 'USDC_PAYOUT' && (
                          <span style={{
                            display: "inline-block",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            color: "#1e40af",
                            background: "#dbeafe",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "9999px",
                            marginBottom: "0.5rem"
                          }}>
                            USDC Payout
                          </span>
                        )}
                        <button
                          className={`${styles.redeemButton} ${
                            canRedeem ? "" : styles.redeemButtonDisabled
                          }`}
                          disabled={!canRedeem}
                          onClick={() => {
                            if (canRedeem) {
                              alert("Redeem feature coming soon! Show this at checkout.");
                            }
                          }}
                        >
                          {canRedeem ? "Redeem Now" : "Not Enough Points"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#6b7280", fontSize: "0.9rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px" }}>
                  No rewards available from {mr.merchantName} yet.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No merchants connected */}
      {merchantRewards.length === 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Available Rewards</h3>
          <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
            Visit a participating business to start earning rewards!
          </p>
        </div>
      )}

      {/* Recent Activity */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <div className={styles.transactionList}>
          {formattedTransactions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
              No transactions yet. Visit a participating business to start earning points!
            </p>
          ) : (
            formattedTransactions.map((transaction) => (
              <div key={transaction.id} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction.points > 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </div>
                <div className={styles.transactionDetails}>
                  <p className={styles.transactionDescription}>{transaction.description}</p>
                  <p className={styles.transactionMeta}>
                    {transaction.date} • {transaction.location}
                  </p>
                </div>
                <div
                  className={`${styles.transactionPoints} ${
                    transaction.points > 0 ? styles.pointsEarned : styles.pointsRedeemed
                  }`}
                >
                  {transaction.points > 0 ? "+" : ""}
                  {transaction.points}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Merchant Breakdown */}
      {member.merchants.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Your Merchants</h3>
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {member.merchants.map((mm) => (
              <div
                key={mm.id}
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: "0.5rem", color: "#1f2937", fontSize: "1.25rem" }}>
                      {mm.merchant.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                      Tier: {mm.tier} • {mm.merchant.businesses.length} location{mm.merchant.businesses.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "2rem", fontWeight: "700", color: "#244b7a" }}>
                      {mm.points}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>total points</p>
                  </div>
                </div>

                {/* Location breakdown */}
                {mm.locations.length > 0 && (
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1rem", marginTop: "0.5rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
                      Visit History by Location
                    </p>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {mm.locations.map((location) => (
                        <div
                          key={location.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            background: "#f9fafb",
                            borderRadius: "8px",
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#1f2937", fontWeight: "500" }}>
                              {location.name}
                              {location.locationNickname && <span style={{ color: "#6b7280" }}> ({location.locationNickname})</span>}
                            </p>
                            {location.lastVisitAt && (
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                Last visit: {new Date(location.lastVisitAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#244b7a" }}>
                              {location.visitCount}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#6b7280" }}>visits</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
