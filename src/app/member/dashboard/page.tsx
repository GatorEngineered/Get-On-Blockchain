"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/dashboard-mockups.module.css";
import RedemptionQRModal from "../components/RedemptionQRModal";

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
    earnPerVisit?: number;
    happyHour?: {
      isActive: boolean;
      multiplier: number;
      startTime: string | null;
      endTime: string | null;
      earnPerVisitWithMultiplier: number;
    };
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
  referralEnabled?: boolean;
  referralPointsValue?: number;
};

type TokenBalance = {
  id: string;
  balance: number;
  lastSyncedAt: string | null;
  token: {
    id: string;
    merchantId: string;
    name: string;
    symbol: string;
    contractAddress: string;
    network: string;
    deployedAt: string | null;
    circulatingSupply: number;
    isActive: boolean;
    merchantName: string;
    merchantSlug: string;
  };
};

export default function MemberDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [merchantRewards, setMerchantRewards] = useState<MerchantRewards[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claimingPayout, setClaimingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    merchantId: string;
    merchantName: string;
    pointsEarned: number;
    payoutAmount: number;
    canRequestNotification: boolean;
    hasNotificationRequest: boolean;
  } | null>(null);
  const [requestingNotification, setRequestingNotification] = useState(false);

  // Referral state
  const [referralModal, setReferralModal] = useState<{
    isOpen: boolean;
    merchantId: string;
    merchantName: string;
    merchantSlug: string;
    pointsValue: number;
  } | null>(null);
  const [referralShareUrls, setReferralShareUrls] = useState<{
    twitter: string;
    facebook: string;
    whatsapp: string;
    email: string;
    copyUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingShareLinks, setLoadingShareLinks] = useState(false);

  // Redemption modal state
  const [redemptionModal, setRedemptionModal] = useState<{
    isOpen: boolean;
    reward: Reward;
    merchantId: string;
    merchantName: string;
    memberPoints: number;
  } | null>(null);
  const [referralEmail, setReferralEmail] = useState("");
  const [sendingReferral, setSendingReferral] = useState(false);
  const [referralMessage, setReferralMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Special rewards state
  const [specialRewards, setSpecialRewards] = useState<any[]>([]);
  const [claimingSpecialReward, setClaimingSpecialReward] = useState<string | null>(null);
  const [specialRewardMessage, setSpecialRewardMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadMemberData();
    loadSpecialRewards();
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
      setTokenBalances(data.tokenBalances || []);

      // Fetch rewards and referral settings for each merchant the member is connected to
      if (data.member?.merchants?.length > 0) {
        const rewardsPromises = data.member.merchants.map(async (mm: MerchantMember) => {
          try {
            // Fetch rewards and referral settings in parallel
            const [rewardsRes, referralRes] = await Promise.all([
              fetch(`/api/merchant/${mm.merchant.slug}/rewards`),
              fetch(`/api/member/referral/send?merchantId=${mm.merchantId}`)
            ]);

            let rewards: Reward[] = [];
            let referralEnabled = false;
            let referralPointsValue = 50;

            if (rewardsRes.ok) {
              const rewardsData = await rewardsRes.json();
              rewards = rewardsData.rewards || [];
            }

            if (referralRes.ok) {
              const referralData = await referralRes.json();
              referralEnabled = referralData.settings?.enabled ?? false;
              referralPointsValue = referralData.settings?.pointsValue ?? 50;
            }

            return {
              merchantId: mm.merchantId,
              merchantName: mm.merchant.name,
              merchantSlug: mm.merchant.slug,
              rewards,
              memberPoints: mm.points,
              referralEnabled,
              referralPointsValue,
            };
          } catch (e) {
            console.error(`Failed to fetch data for ${mm.merchant.slug}:`, e);
            return {
              merchantId: mm.merchantId,
              merchantName: mm.merchant.name,
              merchantSlug: mm.merchant.slug,
              rewards: [],
              memberPoints: mm.points,
              referralEnabled: false,
              referralPointsValue: 50,
            };
          }
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

  async function loadSpecialRewards() {
    try {
      const res = await fetch("/api/member/special-rewards");
      if (res.ok) {
        const data = await res.json();
        setSpecialRewards(data.specialRewards || []);
      }
    } catch (err) {
      console.error("Failed to load special rewards:", err);
    }
  }

  async function claimBirthdayReward(merchantId: string) {
    setClaimingSpecialReward(`birthday-${merchantId}`);
    setSpecialRewardMessage(null);

    try {
      const res = await fetch("/api/member/claim-birthday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim birthday reward");
      }

      setSpecialRewardMessage({
        type: "success",
        text: data.message,
      });

      // Refresh data
      loadMemberData();
      loadSpecialRewards();

      setTimeout(() => setSpecialRewardMessage(null), 5000);
    } catch (err: any) {
      setSpecialRewardMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setClaimingSpecialReward(null);
    }
  }

  async function claimMemberAnniversaryReward(merchantId: string) {
    setClaimingSpecialReward(`member-anniversary-${merchantId}`);
    setSpecialRewardMessage(null);

    try {
      const res = await fetch("/api/member/claim-member-anniversary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim member anniversary reward");
      }

      setSpecialRewardMessage({
        type: "success",
        text: data.message,
      });

      // Refresh data
      loadMemberData();
      loadSpecialRewards();

      setTimeout(() => setSpecialRewardMessage(null), 5000);
    } catch (err: any) {
      setSpecialRewardMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setClaimingSpecialReward(null);
    }
  }

  async function claimRelationshipAnniversaryReward(merchantId: string) {
    setClaimingSpecialReward(`relationship-anniversary-${merchantId}`);
    setSpecialRewardMessage(null);

    try {
      const res = await fetch("/api/member/claim-anniversary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim relationship anniversary reward");
      }

      setSpecialRewardMessage({
        type: "success",
        text: data.message,
      });

      // Refresh data
      loadMemberData();
      loadSpecialRewards();

      setTimeout(() => setSpecialRewardMessage(null), 5000);
    } catch (err: any) {
      setSpecialRewardMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setClaimingSpecialReward(null);
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
      setPendingVerification(null);

      const res = await fetch("/api/member/claim-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if this is a pending verification (insufficient funds)
        if (data.pendingVerification) {
          setPendingVerification({
            merchantId,
            merchantName: data.merchantName,
            pointsEarned: data.pointsEarned,
            payoutAmount: data.payoutAmount,
            canRequestNotification: data.canRequestNotification,
            hasNotificationRequest: data.hasNotificationRequest,
          });
          return; // Don't throw error, show verification UI instead
        }
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

  async function handleRequestNotification(merchantId: string) {
    try {
      setRequestingNotification(true);

      const res = await fetch("/api/member/payout-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request notification");
      }

      // Update pending verification state
      setPendingVerification(prev => prev ? {
        ...prev,
        canRequestNotification: false,
        hasNotificationRequest: true,
      } : null);

      setPayoutSuccess("You'll be notified by email when your payout is ready!");
    } catch (err: any) {
      console.error("Notification request error:", err);
      setPayoutError(err.message);
    } finally {
      setRequestingNotification(false);
    }
  }

  async function handleSendReferral(e: React.FormEvent) {
    e.preventDefault();
    if (!referralModal) return;

    try {
      setSendingReferral(true);
      setReferralMessage(null);

      const res = await fetch("/api/member/referral/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referredEmail: referralEmail,
          merchantId: referralModal.merchantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send referral");
      }

      setReferralMessage({
        type: "success",
        text: `Invitation sent to ${referralEmail}! You'll earn ${referralModal.pointsValue} points when they sign up.`,
      });
      setReferralEmail("");

      // Close modal after a brief delay to show success
      setTimeout(() => {
        setReferralModal(null);
        setReferralMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error("Referral send error:", err);
      setReferralMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setSendingReferral(false);
    }
  }

  async function openReferralModal(merchantId: string, merchantName: string, merchantSlug: string, pointsValue: number) {
    setReferralModal({
      isOpen: true,
      merchantId,
      merchantName,
      merchantSlug,
      pointsValue,
    });
    setReferralEmail("");
    setReferralMessage(null);
    setReferralShareUrls(null);
    setCopiedLink(false);

    // Fetch share links
    setLoadingShareLinks(true);
    try {
      const res = await fetch(`/api/member/referral/link?merchantId=${merchantId}`);
      if (res.ok) {
        const data = await res.json();
        setReferralShareUrls(data.shareUrls);
      }
    } catch (err) {
      console.error("Failed to fetch share links:", err);
    } finally {
      setLoadingShareLinks(false);
    }
  }

  function handleCopyLink() {
    if (referralShareUrls?.copyUrl) {
      navigator.clipboard.writeText(referralShareUrls.copyUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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
      {/* Header with Settings and Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div className={styles.customerWelcome}>
          <h1>Welcome back, {member.firstName}!</h1>
          <p className={styles.tierBadge}>
            <span className={styles.tierIcon}>★</span> {tierLevel} Member
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => router.push("/member/settings")}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
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

      {/* Branded Token Balances (Growth/Pro Merchants) */}
      {tokenBalances.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0,
            }}>
              Your Branded Tokens
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {tokenBalances.map((tb) => (
              <div
                key={tb.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                  }}>
                    {tb.token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      margin: 0,
                    }}>
                      {tb.token.symbol}
                    </p>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.75rem',
                      margin: 0,
                    }}>
                      {tb.token.merchantName}
                    </p>
                  </div>
                </div>

                <p style={{
                  color: 'white',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0',
                }}>
                  {tb.balance.toLocaleString()}
                </p>

                <a
                  href={`https://${tb.token.network === 'polygon' ? '' : 'amoy.'}polygonscan.com/address/${tb.token.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.7rem',
                    textDecoration: 'none',
                  }}
                >
                  {tb.token.contractAddress.slice(0, 6)}...{tb.token.contractAddress.slice(-4)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>

          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
            marginTop: '1rem',
            marginBottom: 0,
          }}>
            These are real blockchain tokens on Polygon. Earn more by visiting participating merchants!
          </p>
        </div>
      )}

      {/* Special Rewards Section */}
      {specialRewards.filter(sr =>
        (sr.birthdayReward?.canClaim) || (sr.memberAnniversaryReward?.canClaim) || (sr.relationshipAnniversaryReward?.canClaim)
      ).length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(217, 119, 6, 0.15)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <h3 style={{
              color: '#92400e',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0,
            }}>
              Special Rewards Available!
            </h3>
          </div>

          {specialRewardMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              background: specialRewardMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: specialRewardMessage.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.9rem',
            }}>
              {specialRewardMessage.text}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {specialRewards.filter(sr => sr.birthdayReward?.canClaim || sr.memberAnniversaryReward?.canClaim || sr.relationshipAnniversaryReward?.canClaim).map((sr) => (
              <div
                key={sr.merchantId}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <p style={{
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 0.75rem 0',
                }}>
                  {sr.merchantName}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {sr.birthdayReward?.canClaim && (
                    <button
                      onClick={() => claimBirthdayReward(sr.merchantId)}
                      disabled={claimingSpecialReward === `birthday-${sr.merchantId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        cursor: claimingSpecialReward ? 'not-allowed' : 'pointer',
                        opacity: claimingSpecialReward ? 0.7 : 1,
                      }}
                    >
                      <span>🎂</span>
                      {claimingSpecialReward === `birthday-${sr.merchantId}`
                        ? 'Claiming...'
                        : `Claim Birthday (+${sr.birthdayReward.points} pts)`}
                    </button>
                  )}

                  {sr.memberAnniversaryReward?.canClaim && (
                    <button
                      onClick={() => claimMemberAnniversaryReward(sr.merchantId)}
                      disabled={claimingSpecialReward === `member-anniversary-${sr.merchantId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        cursor: claimingSpecialReward ? 'not-allowed' : 'pointer',
                        opacity: claimingSpecialReward ? 0.7 : 1,
                      }}
                    >
                      <span>🎉</span>
                      {claimingSpecialReward === `member-anniversary-${sr.merchantId}`
                        ? 'Claiming...'
                        : `Claim Member Anniversary (+${sr.memberAnniversaryReward.points} pts)`}
                    </button>
                  )}

                  {sr.relationshipAnniversaryReward?.canClaim && (
                    <button
                      onClick={() => claimRelationshipAnniversaryReward(sr.merchantId)}
                      disabled={claimingSpecialReward === `relationship-anniversary-${sr.merchantId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        cursor: claimingSpecialReward ? 'not-allowed' : 'pointer',
                        opacity: claimingSpecialReward ? 0.7 : 1,
                      }}
                    >
                      <span>💕</span>
                      {claimingSpecialReward === `relationship-anniversary-${sr.merchantId}`
                        ? 'Claiming...'
                        : `Claim Anniversary (+${sr.relationshipAnniversaryReward.points} pts)`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Pending Verification Message (insufficient merchant funds - polite message) */}
      {pendingVerification && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#92400e', margin: '0 0 0.5rem 0' }}>
                Payout Under Verification
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#78350f', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Your <strong>${pendingVerification.payoutAmount.toFixed(2)} USDC</strong> payout from <strong>{pendingVerification.merchantName}</strong> is currently being processed. The business has been notified and your reward will be available soon.
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.6)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0 }}>
                  <strong>Your points:</strong> {pendingVerification.pointsEarned} pts
                </p>
              </div>

              {pendingVerification.hasNotificationRequest ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '8px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: '600' }}>
                    We'll email you when your payout is ready!
                  </span>
                </div>
              ) : pendingVerification.canRequestNotification ? (
                <button
                  onClick={() => handleRequestNotification(pendingVerification.merchantId)}
                  disabled={requestingNotification}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.875rem',
                    background: requestingNotification ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: requestingNotification ? 'not-allowed' : 'pointer'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {requestingNotification ? 'Setting up...' : 'Notify Me When Ready'}
                </button>
              ) : null}
            </div>
            <button
              onClick={() => setPendingVerification(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#92400e',
                cursor: 'pointer',
                padding: '0.25rem',
                alignSelf: 'flex-start'
              }}
            >
              ✕
            </button>
          </div>
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
              <div className={styles.rewardsGrid}>
                {/* Referral Card - Shows first if enabled */}
                {mr.referralEnabled && (
                  <div
                    className={`${styles.rewardCard} ${styles.rewardCardActive}`}
                    style={{
                      background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                      border: "2px solid #f59e0b",
                    }}
                  >
                    <div className={styles.rewardHeader}>
                      <h4 className={styles.rewardName} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>🎁</span>
                        Refer a Friend
                      </h4>
                      <span className={styles.rewardPoints} style={{ background: "#f59e0b", color: "white" }}>
                        +{mr.referralPointsValue} pts
                      </span>
                    </div>
                    <p className={styles.rewardDescription} style={{ color: "#78350f" }}>
                      Invite friends to join {mr.merchantName} and earn points when they sign up!
                    </p>
                    <button
                      className={styles.redeemButton}
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        border: "none",
                      }}
                      onClick={() => openReferralModal(mr.merchantId, mr.merchantName, mr.merchantSlug, mr.referralPointsValue || 50)}
                    >
                      Send Invite
                    </button>
                  </div>
                )}

                {/* Regular Rewards */}
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
                            setRedemptionModal({
                              isOpen: true,
                              reward,
                              merchantId: mr.merchantId,
                              merchantName: mr.merchantName,
                              memberPoints: mr.memberPoints,
                            });
                          }
                        }}
                      >
                        {canRedeem ? "Redeem Now" : "Not Enough Points"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* No rewards message - only show if no referrals and no rewards */}
              {!mr.referralEnabled && mr.rewards.length === 0 && (
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
                {/* Happy Hour Banner */}
                {mm.merchant.happyHour?.isActive && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🎉</span>
                    <span style={{ fontWeight: '600', color: '#92400e' }}>
                      Happy Hour Active! Earn {mm.merchant.happyHour.multiplier}x points ({mm.merchant.happyHour.earnPerVisitWithMultiplier} pts/visit)
                    </span>
                  </div>
                )}

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

      {/* Referral Modal */}
      {referralModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReferralModal(null);
              setReferralMessage(null);
            }
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1f2937", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎁</span> Refer a Friend
                </h2>
                <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
                  Invite friends to {referralModal.merchantName}
                </p>
              </div>
              <button
                onClick={() => {
                  setReferralModal(null);
                  setReferralMessage(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                padding: "1rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#92400e", fontWeight: "600" }}>
                Earn <span style={{ fontSize: "1.25rem", fontWeight: "700" }}>+{referralModal.pointsValue} points</span>
              </p>
              <p style={{ margin: "0.25rem 0 0", color: "#78350f", fontSize: "0.85rem" }}>
                when your friend signs up!
              </p>
            </div>

            {/* Share Link Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ margin: "0 0 0.75rem", fontWeight: "600", color: "#374151", fontSize: "0.95rem" }}>
                Share your link
              </p>

              {/* Copy Link Button */}
              {loadingShareLinks ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
                  Loading your referral link...
                </div>
              ) : referralShareUrls ? (
                <>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      background: copiedLink ? "#d1fae5" : "#f9fafb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      marginBottom: "0.75rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ color: "#6b7280", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                      {referralShareUrls.copyUrl}
                    </span>
                    <span style={{ color: copiedLink ? "#059669" : "#6366f1", fontWeight: "600", fontSize: "0.9rem", marginLeft: "0.5rem" }}>
                      {copiedLink ? "Copied!" : "Copy"}
                    </span>
                  </button>

                  {/* Social Share Buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <a
                      href={referralShareUrls.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "10px",
                        background: "#1DA1F2",
                        color: "white",
                        textDecoration: "none",
                        textAlign: "center",
                        fontWeight: "500",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </a>
                    <a
                      href={referralShareUrls.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "10px",
                        background: "#1877F2",
                        color: "white",
                        textDecoration: "none",
                        textAlign: "center",
                        fontWeight: "500",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                    <a
                      href={referralShareUrls.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "10px",
                        background: "#25D366",
                        color: "white",
                        textDecoration: "none",
                        textAlign: "center",
                        fontWeight: "500",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </>
              ) : null}
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>or send by email</span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            </div>

            {referralMessage && (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  marginBottom: "1rem",
                  background: referralMessage.type === "success" ? "#d1fae5" : "#fee2e2",
                  border: `1px solid ${referralMessage.type === "success" ? "#6ee7b7" : "#fecaca"}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: referralMessage.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {referralMessage.type === "success" ? "✓" : "!"} {referralMessage.text}
                </p>
              </div>
            )}

            <form onSubmit={handleSendReferral}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  htmlFor="referral-email"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "0.95rem",
                  }}
                >
                  Friend's Email Address
                </label>
                <input
                  id="referral-email"
                  type="email"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                  disabled={sendingReferral}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#f59e0b";
                    e.target.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.1)";
                    e.target.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sendingReferral || !referralEmail}
                style={{
                  width: "100%",
                  padding: "0.875rem 1.5rem",
                  borderRadius: "999px",
                  border: "none",
                  background: sendingReferral || !referralEmail
                    ? "#d1d5db"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: sendingReferral || !referralEmail ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {sendingReferral ? "Sending..." : "Send Invitation"}
              </button>
            </form>

            <p
              style={{
                margin: "1rem 0 0",
                color: "#9ca3af",
                fontSize: "0.8rem",
                textAlign: "center",
              }}
            >
              We'll send your friend an email invitation to join.
            </p>
          </div>
        </div>
      )}

      {/* Redemption QR Modal */}
      {redemptionModal && (
        <RedemptionQRModal
          isOpen={redemptionModal.isOpen}
          onClose={() => setRedemptionModal(null)}
          reward={redemptionModal.reward}
          merchantId={redemptionModal.merchantId}
          merchantName={redemptionModal.merchantName}
          memberPoints={redemptionModal.memberPoints}
          onRedemptionComplete={() => {
            // Refresh member data after successful redemption
            loadMemberData();
          }}
        />
      )}
    </div>
  );
}
