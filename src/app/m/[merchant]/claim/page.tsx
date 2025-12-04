"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import WalletFlowPlaceholder from "@/app/components/WalletFlowPlaceholder"; // adjust import if needed

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
};

type WalletFormState = {
  walletAddress: string;
  walletNetwork: string;
};

export default function MerchantClaimPage() {
  const params = useParams();
  const merchantSlug = params?.merchant as string;

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessMemberId, setBusinessMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 2: mode selection
  const [modeChosen, setModeChosen] = useState<"email" | "wallet" | null>(null);
  const [walletForm, setWalletForm] = useState<WalletFormState>({
    walletAddress: "",
    walletNetwork: "",
  });
  const [isModeSubmitting, setIsModeSubmitting] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const [modeSuccess, setModeSuccess] = useState<string | null>(null);

  // Reward feedback
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  const storageKey = merchantSlug
    ? `gob_businessMember_${merchantSlug}`
    : null;

  // Check if we already have a BusinessMember id stored for this business
  useEffect(() => {
    if (!merchantSlug || !storageKey) return;

    const storedId =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;

    if (storedId) {
      setBusinessMemberId(storedId);
      setShowInfoModal(false);
    } else {
      setShowInfoModal(true);
    }
  }, [merchantSlug, storageKey]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWalletFormChange = (
    field: keyof WalletFormState,
    value: string
  ) => {
    setWalletForm((prev) => ({ ...prev, [field]: value }));
  };

  // Step 1: submit basic info (create/link Member + BusinessMember)
  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!merchantSlug || !storageKey) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/member/register-for-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSlug,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error || "Failed to register";
        throw new Error(message);
      }

      const data = await res.json();
      const id = data.businessMemberId as string;

      setBusinessMemberId(id);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, id);
      }

      setShowInfoModal(false);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: award points for this visit
  const awardVisitPoints = async (bmId: string) => {
    try {
      const res = await fetch("/api/rewards/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessMemberId: bmId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error || "Failed to grant reward";
        throw new Error(message);
      }

      const data = await res.json();
      setRewardMessage(
        `You earned ${data.amount} points for this visit. Your new balance is ${data.newBalance} points.`
      );
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "We had trouble adding your reward.";
      setRewardMessage(message);
    }
  };

  // Step 2A: choose email-only mode
  const handleContinueWithEmail = async () => {
    if (!businessMemberId) return;
    setIsModeSubmitting(true);
    setModeError(null);
    setModeSuccess(null);
    setRewardMessage(null);

    try {
      const res = await fetch("/api/member/set-wallet-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "email",
          businessMemberId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error || "Failed to set email mode";
        throw new Error(message);
      }

      setModeChosen("email");
      setModeSuccess(
        "Your rewards are now linked to your email for this business."
      );

      // Grant visit reward
      await awardVisitPoints(businessMemberId);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setModeError(message);
    } finally {
      setIsModeSubmitting(false);
    }
  };

  // Step 2B: choose wallet mode
  const handleWalletModeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessMemberId) return;

    setIsModeSubmitting(true);
    setModeError(null);
    setModeSuccess(null);
    setRewardMessage(null);

    try {
      const res = await fetch("/api/member/set-wallet-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "wallet",
          businessMemberId,
          walletAddress: walletForm.walletAddress,
          walletNetwork: walletForm.walletNetwork,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error || "Failed to set wallet mode";
        throw new Error(message);
      }

      setModeChosen("wallet");
      setModeSuccess(
        "Your rewards are now linked to your wallet for this business."
      );

      // Grant visit reward
      await awardVisitPoints(businessMemberId);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setModeError(message);
    } finally {
      setIsModeSubmitting(false);
    }
  };

  return (
    <div className="claim-page">
      {/* Step 1: Info modal */}
      {showInfoModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Let&apos;s set up your rewards</h2>
            <p>
              We&apos;ll save your info for this business so you can keep
              earning rewards on future visits.
            </p>

            <form onSubmit={handleInfoSubmit} className="modal-form">
              <div className="field-row">
                <label>
                  First name*
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </label>
                <label>
                  Last name*
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </label>
              </div>

              <label>
                Email*
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>

              <label>
                Address (optional)
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </label>

              <label>
                Phone (optional)
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Continue"}
              </button>

              <p className="disclaimer">
                Your details are tied only to this business&apos;s rewards
                profile. Different businesses can use different wallets or
                reward options.
              </p>
            </form>
          </div>
        </div>
      )}

      <main>
        {/* Step 2: How do you want to hold your rewards? */}
        {businessMemberId && (
          <section className="mode-section">
            <h2>How do you want to keep your rewards?</h2>
            <p>
              You can keep your rewards under your email for this business, or
              connect a crypto wallet. Each business can use a different wallet
              or stay email-only.
            </p>

            <div className="mode-buttons">
              <button
                type="button"
                onClick={handleContinueWithEmail}
                disabled={isModeSubmitting}
              >
                Continue with email
              </button>

              <button
                type="button"
                onClick={() => setModeChosen("wallet")}
                disabled={isModeSubmitting}
              >
                Connect wallet
              </button>
            </div>

            {modeChosen === "wallet" && (
              <form className="wallet-form" onSubmit={handleWalletModeSubmit}>
                <label>
                  Wallet address
                  <input
                    type="text"
                    required
                    value={walletForm.walletAddress}
                    onChange={(e) =>
                      handleWalletFormChange("walletAddress", e.target.value)
                    }
                  />
                </label>

                <label>
                  Network
                  <select
                    required
                    value={walletForm.walletNetwork}
                    onChange={(e) =>
                      handleWalletFormChange("walletNetwork", e.target.value)
                    }
                  >
                    <option value="">Select a network</option>
                    <option value="ethereum">Ethereum / EVM (MetaMask)</option>
                    <option value="xrpl">XRP Ledger (Xumm, etc.)</option>
                    {/* add more later */}
                  </select>
                </label>

                <button type="submit" disabled={isModeSubmitting}>
                  {isModeSubmitting ? "Saving..." : "Save wallet"}
                </button>
              </form>
            )}

            {modeError && <p className="error-text">{modeError}</p>}
            {modeSuccess && <p className="success-text">{modeSuccess}</p>}
            {rewardMessage && (
              <p className="success-text reward-text">{rewardMessage}</p>
            )}
          </section>
        )}

        {/* Existing claim / wallet UI */}
        <WalletFlowPlaceholder merchantSlug={merchantSlug} />
      </main>
    </div>
  );
}
