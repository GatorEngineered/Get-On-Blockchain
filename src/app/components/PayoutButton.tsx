"use client";

import { useState } from "react";

interface PayoutButtonProps {
  merchantSlug: string;
  memberId: string;
  businessId: string;
  currentPoints: number;
  walletAddress?: string;
}

export default function PayoutButton({
  merchantSlug,
  memberId,
  businessId,
  currentPoints,
  walletAddress,
}: PayoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    txHash: string;
    explorerUrl: string;
    amount: number;
    newBalance: number;
  } | null>(null);

  const MILESTONE_POINTS = 100;
  const PAYOUT_AMOUNT = 5;

  const isEligible = currentPoints >= MILESTONE_POINTS && !!walletAddress;

  async function handlePayout() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/rewards/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSlug,
          memberId,
          businessId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Payout failed. Please try again.");
        return;
      }

      setSuccess({
        txHash: data.transaction.txHash,
        explorerUrl: data.transaction.explorerUrl,
        amount: data.transaction.amount,
        newBalance: data.transaction.newPointsBalance,
      });

    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!walletAddress) {
    return (
      <div className="payout-notice">
        <p>💡 Connect a wallet to unlock stablecoin payouts</p>
        <p className="text-sm text-gray-600">
          Earn {MILESTONE_POINTS} points to get ${PAYOUT_AMOUNT} USDC sent to your wallet!
        </p>
      </div>
    );
  }

  if (!isEligible) {
    const pointsNeeded = MILESTONE_POINTS - currentPoints;
    return (
      <div className="payout-progress">
        <p>🎯 Earn {pointsNeeded} more points to unlock ${PAYOUT_AMOUNT} USDC!</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentPoints / MILESTONE_POINTS) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {currentPoints} / {MILESTONE_POINTS} points
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payout-success">
        <h3>✅ Payout Successful!</h3>
        <p>${success.amount} USDC sent to your wallet</p>
        <p className="text-sm">New balance: {success.newBalance} points</p>
        <a
          href={success.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          View on Polygonscan
        </a>
      </div>
    );
  }

  return (
    <div className="payout-eligible">
      <h3>🎉 You&apos;ve reached {MILESTONE_POINTS} points!</h3>
      <p>Claim ${PAYOUT_AMOUNT} USDC to your wallet</p>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      <button
        onClick={handlePayout}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Processing..." : `Claim $${PAYOUT_AMOUNT} USDC`}
      </button>

      <p className="text-xs text-gray-500">
        Sent to: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </p>
    </div>
  );
}
