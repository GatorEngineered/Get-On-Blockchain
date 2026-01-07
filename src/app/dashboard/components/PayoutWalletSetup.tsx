"use client";

import React, { useState, useEffect } from "react";

type PayoutWalletStatus = {
  payoutEnabled: boolean;
  walletAddress: string | null;
  network: string;
  milestonePoints: number;
  payoutAmount: number;
  usdcBalance: number;
  lastBalanceCheck: string | null;
  lowBalanceAlertSent: boolean;
};

type Props = {
  merchantSlug: string;
  merchantPlan: string;
};

export default function PayoutWalletSetup({ merchantSlug, merchantPlan }: Props) {
  const [status, setStatus] = useState<PayoutWalletStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup form state
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [milestonePoints, setMilestonePoints] = useState("100");
  const [payoutAmount, setPayoutAmount] = useState("5.0");
  const [network, setNetwork] = useState<"mumbai" | "polygon">("mumbai");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load wallet status
  useEffect(() => {
    loadWalletStatus();
  }, [merchantSlug]);

  async function loadWalletStatus() {
    try {
      const res = await fetch(
        `/api/merchant/setup-payout-wallet?merchantSlug=${merchantSlug}`
      );

      if (!res.ok) {
        throw new Error("Failed to load wallet status");
      }

      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to load wallet status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupWallet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate private key format
      if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
        throw new Error(
          "Invalid private key format. Must be 0x-prefixed 64-character hex string."
        );
      }

      const res = await fetch("/api/merchant/setup-payout-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSlug,
          privateKey,
          milestonePoints: Number(milestonePoints),
          payoutAmount: Number(payoutAmount),
          network,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to setup wallet");
      }

      // Clear form and reload status
      setPrivateKey("");
      setShowSetupForm(false);
      await loadWalletStatus();

      alert(
        `Wallet configured successfully!\nAddress: ${data.wallet.address}\nUSDC Balance: $${data.wallet.usdcBalance}`
      );
    } catch (err: any) {
      console.error("Setup failed:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check if merchant has Premium plan
  const isPremium = merchantPlan === "PREMIUM";

  if (loading) {
    return (
      <section className="settings-card">
        <h2>Stablecoin Payout Wallet</h2>
        <p>Loading wallet status...</p>
      </section>
    );
  }

  if (!isPremium) {
    return (
      <section className="settings-card">
        <h2>Stablecoin Payout Wallet</h2>
        <div className="payout-upgrade-notice">
          <p>
            <strong>Upgrade to Premium</strong> to enable USDC payouts for your customers.
          </p>
          <p>
            With Premium ($99/mo), customers can claim stablecoin rewards when they
            reach point milestones.
          </p>
          <a href="/pricing" className="settings-upgrade-button">
            Upgrade to Premium
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-card">
      <h2>Stablecoin Payout Wallet (Premium)</h2>

      {error && (
        <div className="settings-error">
          <p>{error}</p>
        </div>
      )}

      {/* Wallet Status Display */}
      {status?.payoutEnabled && status.walletAddress ? (
        <div className="payout-wallet-status">
          <div className="payout-status-header">
            <div>
              <h3>Wallet Active</h3>
              <p className="payout-wallet-address">
                {status.walletAddress.slice(0, 10)}...{status.walletAddress.slice(-8)}
              </p>
              <p className="payout-network-badge">
                Network: {status.network === "mumbai" ? "Mumbai Testnet" : "Polygon Mainnet"}
              </p>
            </div>

            <div className="payout-balances">
              <div className="payout-balance-item">
                <span className="payout-balance-label">USDC Balance</span>
                <span className="payout-balance-value">${status.usdcBalance.toFixed(2)}</span>
              </div>
              {status.usdcBalance < status.payoutAmount * 10 && (
                <p className="payout-low-balance-warning">
                  ⚠️ Low balance! Fund your wallet to continue payouts.
                </p>
              )}
            </div>
          </div>

          <div className="payout-settings-display">
            <div className="payout-setting-item">
              <span className="payout-setting-label">Milestone Points:</span>
              <span className="payout-setting-value">{status.milestonePoints} points</span>
            </div>
            <div className="payout-setting-item">
              <span className="payout-setting-label">Payout Amount:</span>
              <span className="payout-setting-value">${status.payoutAmount.toFixed(2)} USDC</span>
            </div>
          </div>

          {status.lastBalanceCheck && (
            <p className="payout-last-check">
              Last checked: {new Date(status.lastBalanceCheck).toLocaleString()}
            </p>
          )}

          <div className="payout-actions">
            <button
              onClick={loadWalletStatus}
              className="settings-button-secondary"
              disabled={loading}
            >
              Refresh Balance
            </button>
            <button
              onClick={() => setShowSetupForm(true)}
              className="settings-button-secondary"
            >
              Update Wallet
            </button>
          </div>
        </div>
      ) : (
        /* No wallet configured */
        <div className="payout-wallet-empty">
          <p>
            Set up your payout wallet to automatically send USDC to customers when they
            reach point milestones.
          </p>
          <p>
            <strong>How it works:</strong>
          </p>
          <ul>
            <li>You fund your own custodial wallet with USDC</li>
            <li>Set milestone points (e.g., 100 points)</li>
            <li>Set payout amount (e.g., $5 USDC)</li>
            <li>Customers automatically receive USDC when they hit milestones</li>
          </ul>
          <button
            onClick={() => setShowSetupForm(true)}
            className="settings-save-button"
          >
            Set Up Payout Wallet
          </button>
        </div>
      )}

      {/* Setup/Update Form */}
      {showSetupForm && (
        <div className="payout-setup-modal">
          <div className="payout-setup-overlay" onClick={() => setShowSetupForm(false)} />
          <div className="payout-setup-form-container">
            <form onSubmit={handleSetupWallet} className="payout-setup-form">
              <h3>
                {status?.payoutEnabled ? "Update Payout Wallet" : "Set Up Payout Wallet"}
              </h3>

              <div className="settings-field">
                <label>
                  Network
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as "mumbai" | "polygon")}
                    required
                  >
                    <option value="mumbai">Mumbai Testnet (for testing)</option>
                    <option value="polygon">Polygon Mainnet (production)</option>
                  </select>
                </label>
                <p className="settings-field-hint">
                  Use Mumbai for testing, Polygon for production
                </p>
              </div>

              <div className="settings-field">
                <label>
                  Wallet Private Key
                  <input
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="0x..."
                    required
                    minLength={66}
                    maxLength={66}
                  />
                </label>
                <p className="settings-field-hint">
                  Must start with 0x and be 66 characters. This will be encrypted before storage.
                </p>
              </div>

              <div className="settings-field">
                <label>
                  Milestone Points
                  <input
                    type="number"
                    value={milestonePoints}
                    onChange={(e) => setMilestonePoints(e.target.value)}
                    placeholder="100"
                    required
                    min={1}
                  />
                </label>
                <p className="settings-field-hint">
                  How many points customers need to earn a payout
                </p>
              </div>

              <div className="settings-field">
                <label>
                  Payout Amount (USDC)
                  <input
                    type="number"
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="5.00"
                    required
                    min={0.01}
                  />
                </label>
                <p className="settings-field-hint">
                  Amount in USDC to send when customer hits milestone
                </p>
              </div>

              <div className="payout-setup-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowSetupForm(false);
                    setError(null);
                  }}
                  className="settings-button-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-save-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Setting up..." : "Save Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
