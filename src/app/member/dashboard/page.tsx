"use client";

 

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useAccount } from "wagmi";

import PayoutButton from "@/app/components/PayoutButton";

 

type BusinessMember = {

  id: string;

  businessId: string;

  business: {

    id: string;

    slug: string;

    name: string;

    contactEmail: string;

  };

  walletAddress: string | null;

  walletNetwork: string | null;

  points: number;

  tier: string;

};

 

type Member = {

  id: string;

  email: string;

  firstName: string;

  lastName: string;

  walletAddress: string | null;

  tier: string;

  businesses: BusinessMember[];

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

  business: {

    name: string;

  };

};

 

export default function MemberDashboardPage() {

  const router = useRouter();

  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<Member | null>(null);

  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);

  const [error, setError] = useState<string | null>(null);

 

  useEffect(() => {

    loadMemberData();

  }, []);

 

  async function loadMemberData() {

    try {

      // Check if user is logged in (you'll implement proper auth later)

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

    } catch (err: any) {

      console.error("Failed to load member data:", err);

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }

 

  async function handleConnectWallet() {

    if (!address || !member) return;

 

    try {

      const token = localStorage.getItem("member_token");

      const res = await fetch("/api/member/connect-wallet", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          walletAddress: address,

        }),

      });

 

      if (!res.ok) {

        throw new Error("Failed to connect wallet");

      }

 

      // Reload member data

      await loadMemberData();

    } catch (err: any) {

      console.error("Failed to connect wallet:", err);

      alert("Failed to connect wallet. Please try again.");

    }

  }

 

  if (loading) {

    return (

      <main className="section">

        <div className="container" style={{ maxWidth: "1000px" }}>

          <div className="member-dashboard-loading">

            <h1>Loading your rewards...</h1>

          </div>

        </div>

      </main>

    );

  }

 

  if (error || !member) {

    return (

      <main className="section">

        <div className="container" style={{ maxWidth: "1000px" }}>

          <div className="member-dashboard-error">

            <h1>Unable to load dashboard</h1>

            <p>{error || "Please try logging in again."}</p>

            <a href="/member/login" className="btn btn-primary">

              Go to Login

            </a>

          </div>

        </div>

      </main>

    );

  }

 

  const totalPoints = member.businesses.reduce(

    (sum, bm) => sum + bm.points,

    0

  );

 

  return (

    <main className="member-dashboard-page">

      <div className="member-dashboard-container">

        {/* Header */}

        <header className="member-dashboard-header">

          <div>

            <h1 className="member-dashboard-title">

              Welcome back, {member.firstName || "Member"}!

            </h1>

            <p className="member-dashboard-subtitle">

              Manage your rewards, view points, and claim payouts

            </p>

          </div>

          <div className="member-dashboard-actions">

            <button

              onClick={() => {

                localStorage.removeItem("member_token");

                router.push("/member/login");

              }}

              className="member-dashboard-logout"

            >

              Logout

            </button>

          </div>

        </header>

 

        {/* Summary Cards */}

        <div className="member-dashboard-summary">

          <div className="member-summary-card">

            <div className="member-summary-icon">🎯</div>

            <div className="member-summary-content">

              <p className="member-summary-label">Total Points</p>

              <p className="member-summary-value">{totalPoints}</p>

              <p className="member-summary-sub">

                Across {member.businesses.length} business

                {member.businesses.length !== 1 ? "es" : ""}

              </p>

            </div>

          </div>

 

          <div className="member-summary-card">

            <div className="member-summary-icon">💰</div>

            <div className="member-summary-content">

              <p className="member-summary-label">Wallet Status</p>

              <p className="member-summary-value">

                {member.walletAddress ? "Connected" : "Not Connected"}

              </p>

              {member.walletAddress && (

                <p className="member-summary-sub member-wallet-address">

                  {member.walletAddress.slice(0, 8)}...

                  {member.walletAddress.slice(-6)}

                </p>

              )}

            </div>

          </div>

 

          <div className="member-summary-card">

            <div className="member-summary-icon">🏆</div>

            <div className="member-summary-content">

              <p className="member-summary-label">Member Tier</p>

              <p className="member-summary-value">{member.tier}</p>

              <p className="member-summary-sub">Keep earning to level up!</p>

            </div>

          </div>

        </div>

 

        {/* Wallet Connection */}

        {!member.walletAddress && (

          <div className="member-wallet-connect-notice">

            <h3>Connect Your Wallet</h3>

            <p>

              Connect your crypto wallet to claim stablecoin rewards when you

              reach milestones.

            </p>

            <div className="member-wallet-connect-wrapper">

              <ConnectButton showBalance={false} />

              {isConnected && address && (

                <button

                  onClick={handleConnectWallet}

                  className="btn btn-primary"

                  style={{ marginTop: "1rem" }}

                >

                  Save Wallet to Account

                </button>

              )}

            </div>

          </div>

        )}

 

        {/* Business Memberships */}

        <div className="member-businesses-section">

          <h2 className="member-section-title">Your Business Rewards</h2>

 

          {member.businesses.length === 0 ? (

            <div className="member-empty-state">

              <p>You haven't joined any businesses yet.</p>

              <p className="member-empty-sub">

                Visit a participating business and scan their QR code to start

                earning rewards!

              </p>

            </div>

          ) : (

            <div className="member-businesses-grid">

              {member.businesses.map((bm) => (

                <div key={bm.id} className="member-business-card">

                  <div className="member-business-header">

                    <h3 className="member-business-name">{bm.business.name}</h3>

                  </div>

 

                  <div className="member-business-stats">

                    <div className="member-business-stat">

                      <span className="member-stat-label">Points</span>

                      <span className="member-stat-value">{bm.points}</span>

                    </div>

                    <div className="member-business-stat">

                      <span className="member-stat-label">Tier</span>

                      <span className="member-stat-value">{bm.tier}</span>

                    </div>

                  </div>

 

                  {/* Payout Button */}

                  <div className="member-payout-section">

                    <PayoutButton

                      merchantSlug={bm.business.slug}

                      memberId={member.id}

                      businessId={bm.businessId}

                      currentPoints={bm.points}

                      walletAddress = {bm.walletAddress || member.walletAddress || undefined}

                    />

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

 

        {/* Transaction History */}

        {transactions.length > 0 && (

          <div className="member-transactions-section">

            <h2 className="member-section-title">Recent Transactions</h2>

 

            <div className="member-transactions-list">

              {transactions.map((tx) => (

                <div key={tx.id} className="member-transaction-item">

                  <div className="member-transaction-icon">

                    {tx.type === "PAYOUT" ? "💸" :

                     tx.type === "EARN" ? "✅" : "🎁"}

                  </div>

                  <div className="member-transaction-details">

                    <p className="member-transaction-type">

                      {tx.type === "PAYOUT"

                        ? "Stablecoin Payout"

                        : tx.type === "EARN"

                        ? "Points Earned"

                        : tx.type === "REDEEM"

                        ? "Points Redeemed"

                        : tx.type}

                    </p>

                    <p className="member-transaction-business">

                      {tx.business.name}

                    </p>

                  </div>

                  <div className="member-transaction-amount">

                    {tx.usdcAmount ? (

                      <>

                        <p className="member-transaction-usdc">

                          ${tx.usdcAmount.toFixed(2)} USDC

                        </p>

                        {tx.pointsDeducted && (

                          <p className="member-transaction-points">

                            -{tx.pointsDeducted} pts

                          </p>

                        )}

                      </>

                    ) : (

                      <p className="member-transaction-points">

                        {tx.type === "REDEEM" ? "-" : "+"}

                        {tx.amount} pts

                      </p>

                    )}

                  </div>

                  <div className="member-transaction-meta">

                    <span

                      className={`member-transaction-status status-${tx.status.toLowerCase()}`}

                    >

                      {tx.status}

                    </span>

                    {tx.txHash && (

                      <a

                        href={`https://polygonscan.com/tx/${tx.txHash}`}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="member-transaction-link"

                      >

                        View on Polygonscan

                      </a>

                    )}

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

 

      <style jsx>{`

        .member-dashboard-page {

          min-height: 100vh;

          background: radial-gradient(

            circle at top left,

            #f4f7ff 0,

            #f7f9fc 40%,

            #ffffff 100%

          );

          padding: 2rem 1.5rem 4rem;

        }

 

        .member-dashboard-container {

          max-width: 1100px;

          margin: 0 auto;

        }

 

        .member-dashboard-header {

          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          margin-bottom: 2.5rem;

          flex-wrap: wrap;

          gap: 1.5rem;

        }

 

        .member-dashboard-title {

          font-size: 2rem;

          font-weight: 700;

          color: #111827;

          margin: 0 0 0.5rem 0;

        }

 

        .member-dashboard-subtitle {

          font-size: 1rem;

          color: #6b7280;

          margin: 0;

        }

 

        .member-dashboard-logout {

          padding: 0.6rem 1.5rem;

          border-radius: 999px;

          border: 1px solid #d1d5db;

          background: white;

          color: #374151;

          font-weight: 500;

          font-size: 0.9rem;

          cursor: pointer;

          transition: all 0.2s ease;

        }

 

        .member-dashboard-logout:hover {

          background: #f9fafb;

          border-color: #244b7a;

        }

 

        .member-dashboard-summary {

          display: grid;

          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

          gap: 1.5rem;

          margin-bottom: 2.5rem;

        }

 

        .member-summary-card {

          background: white;

          border-radius: 20px;

          padding: 1.75rem;

          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);

          border: 1px solid rgba(15, 23, 42, 0.05);

          display: flex;

          gap: 1.25rem;

          align-items: flex-start;

        }

 

        .member-summary-icon {

          font-size: 2.5rem;

          flex-shrink: 0;

        }

 

        .member-summary-content {

          flex: 1;

        }

 

        .member-summary-label {

          font-size: 0.8rem;

          text-transform: uppercase;

          letter-spacing: 0.08em;

          color: #6b7280;

          margin: 0 0 0.35rem 0;

        }

 

        .member-summary-value {

          font-size: 1.8rem;

          font-weight: 700;

          color: #111827;

          margin: 0 0 0.25rem 0;

        }

 

        .member-summary-sub {

          font-size: 0.85rem;

          color: #9ca3af;

          margin: 0;

        }

 

        .member-wallet-address {

          font-family: "Courier New", monospace;

          font-size: 0.8rem;

        }

 

        .member-wallet-connect-notice {

          background: linear-gradient(135deg, #eef5ff, #f9fbff);

          border-radius: 18px;

          padding: 2rem;

          margin-bottom: 2.5rem;

          border: 2px dashed #244b7a;

          text-align: center;

        }

 

        .member-wallet-connect-notice h3 {

          margin: 0 0 0.75rem 0;

          color: #111827;

          font-size: 1.3rem;

        }

 

        .member-wallet-connect-notice p {

          margin: 0 0 1.5rem 0;

          color: #4b5563;

        }

 

        .member-wallet-connect-wrapper {

          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 1rem;

        }

 

        .member-section-title {

          font-size: 1.4rem;

          font-weight: 700;

          color: #111827;

          margin: 0 0 1.5rem 0;

        }

 

        .member-businesses-section {

          margin-bottom: 3rem;

        }

 

        .member-businesses-grid {

          display: grid;

          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

          gap: 1.5rem;

        }

 

        .member-business-card {

          background: white;

          border-radius: 20px;

          padding: 1.75rem;

          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);

          border: 1px solid rgba(15, 23, 42, 0.05);

        }

 

        .member-business-header {

          margin-bottom: 1.25rem;

          padding-bottom: 1.25rem;

          border-bottom: 1px solid #f3f4f6;

        }

 

        .member-business-name {

          margin: 0 0 0.35rem 0;

          font-size: 1.2rem;

          font-weight: 600;

          color: #111827;

        }

 

        .member-business-tagline {

          margin: 0;

          font-size: 0.9rem;

          color: #6b7280;

        }

 

        .member-business-stats {

          display: flex;

          gap: 2rem;

          margin-bottom: 1.5rem;

        }

 

        .member-business-stat {

          display: flex;

          flex-direction: column;

          gap: 0.25rem;

        }

 

        .member-stat-label {

          font-size: 0.75rem;

          text-transform: uppercase;

          letter-spacing: 0.08em;

          color: #9ca3af;

        }

 

        .member-stat-value {

          font-size: 1.4rem;

          font-weight: 700;

          color: #244b7a;

        }

 

        .member-payout-section {

          margin-top: 1.5rem;

          padding-top: 1.5rem;

          border-top: 1px solid #f3f4f6;

        }

 

        .member-empty-state {

          background: white;

          border-radius: 18px;

          padding: 3rem 2rem;

          text-align: center;

        }

 

        .member-empty-state p {

          margin: 0 0 0.5rem 0;

          color: #4b5563;

          font-size: 1rem;

        }

 

        .member-empty-sub {

          color: #9ca3af !important;

          font-size: 0.9rem !important;

        }

 

        .member-transactions-section {

          margin-bottom: 2rem;

        }

 

        .member-transactions-list {

          background: white;

          border-radius: 20px;

          overflow: hidden;

          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);

          border: 1px solid rgba(15, 23, 42, 0.05);

        }

 

        .member-transaction-item {

          display: grid;

          grid-template-columns: auto 1fr auto auto;

          gap: 1.25rem;

          padding: 1.25rem 1.5rem;

          border-bottom: 1px solid #f3f4f6;

          align-items: center;

        }

 

        .member-transaction-item:last-child {

          border-bottom: none;

        }

 

        .member-transaction-icon {

          font-size: 2rem;

        }

 

        .member-transaction-details {

          display: flex;

          flex-direction: column;

          gap: 0.25rem;

        }

 

        .member-transaction-type {

          margin: 0;

          font-weight: 600;

          color: #111827;

          font-size: 0.95rem;

        }

 

        .member-transaction-business {

          margin: 0;

          font-size: 0.85rem;

          color: #6b7280;

        }

 

        .member-transaction-amount {

          text-align: right;

        }

 

        .member-transaction-usdc {

          margin: 0;

          font-size: 1.1rem;

          font-weight: 700;

          color: #16a34a;

        }

 

        .member-transaction-points {

          margin: 0;

          font-size: 0.85rem;

          color: #6b7280;

        }

 

        .member-transaction-meta {

          display: flex;

          flex-direction: column;

          gap: 0.5rem;

          align-items: flex-end;

        }

 

        .member-transaction-status {

          padding: 0.25rem 0.75rem;

          border-radius: 999px;

          font-size: 0.75rem;

          font-weight: 600;

          text-transform: uppercase;

          letter-spacing: 0.05em;

        }

 

        .status-success {

          background: #e0fbea;

          color: #166534;

        }

 

        .status-pending {

          background: #fef3c7;

          color: #92400e;

        }

 

        .status-failed {

          background: #fee2e2;

          color: #b91c1c;

        }

 

        .member-transaction-link {

          font-size: 0.75rem;

          color: #244b7a;

          text-decoration: none;

          border-bottom: 1px solid transparent;

        }

 

        .member-transaction-link:hover {

          border-bottom-color: #244b7a;

        }

 

        .member-dashboard-loading,

        .member-dashboard-error {

          text-align: center;

          padding: 4rem 2rem;

        }

 

        .member-dashboard-error h1 {

          color: #b91c1c;

          margin-bottom: 1rem;

        }

 

        /* Mobile responsiveness */

        @media (max-width: 900px) {

          .member-dashboard-header {

            flex-direction: column;

            align-items: flex-start;

          }

 

          .member-businesses-grid {

            grid-template-columns: 1fr;

          }

 

          .member-transaction-item {

            grid-template-columns: auto 1fr;

            gap: 1rem;

          }

 

          .member-transaction-amount {

            grid-column: 1 / -1;

            text-align: left;

            padding-left: 3.5rem;

          }

 

          .member-transaction-meta {

            grid-column: 1 / -1;

            align-items: flex-start;

            padding-left: 3.5rem;

          }

        }

 

        @media (max-width: 640px) {

          .member-dashboard-page {

            padding: 1.5rem 1rem 3rem;

          }

 

          .member-dashboard-title {

            font-size: 1.6rem;

          }

 

          .member-dashboard-summary {

            grid-template-columns: 1fr;

          }

 

          .member-summary-card {

            padding: 1.5rem;

          }

 

          .member-summary-icon {

            font-size: 2rem;

          }

 

          .member-wallet-connect-notice {

            padding: 1.5rem;

          }

 

          .member-business-card {

            padding: 1.5rem;

          }

 

          .member-transaction-item {

            padding: 1rem;

          }

 

          .member-transaction-icon {

            font-size: 1.5rem;

          }

 

          .member-transaction-amount,

          .member-transaction-meta {

            padding-left: 2.5rem;

          }

        }

      `}</style>

    </main>

  );

}