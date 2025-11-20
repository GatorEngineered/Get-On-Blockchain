"use client";

import { useState } from "react";



type Props = {
  merchantSlug: string; // e.g. "demo-coffee-shop"
};

export default function WalletFlowPlaceholder({ merchantSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const grantWelcomePoints = async (merchant: string, memberId: string) => {
    try {
      await fetch("/api/reward-earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          memberId,
          points: 10,
          reason: "Welcome reward",
        }),
      });
    } catch {}
  };

  const handleContinueWithEmail = async () => {
    const email = window.prompt("Enter your email to save this reward:");
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/create-email-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant: merchantSlug, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Failed to create account");
        return;
      }

      if (data.memberId) {
        await grantWelcomePoints(merchantSlug, data.memberId);
      }

      setStatus("Account created and welcome points granted.");
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      

       
        {/* This is where your real <WalletConnectButton /> will render */}

        <button
          className="btn btn-secondary"
          onClick={handleContinueWithEmail}
          disabled={loading}
        >
          Continue with email
        </button>
      

      {status && <p className="wallet-status">{status}</p>}
    </div>
  );
}
