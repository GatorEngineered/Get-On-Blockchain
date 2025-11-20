"use client";

import { useEffect } from "react";
import WalletConnectButton from "@/app/components/WalletConnectButton";
import WalletFlowPlaceholder from "@/app/components/WalletFlowPlaceholder";

export default function DemoClaimPage() {
  const MERCHANT_SLUG = "demo-coffee-shop";
  const prettyName = "Demo Coffee Shop";

  // Track that the QR/demo page was opened
  useEffect(() => {
    fetch("/api/track-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: MERCHANT_SLUG, source: "demo" }),
    }).catch(() => {
      // swallow tracking errors in demo
    });
  }, []);

  return (
    <main className="claim-main">
      <section className="section">
        <div className="container claim-inner">
          <p className="eyebrow">Reward claim</p>
          <h1>{prettyName} Loyalty Reward</h1>
          <p className="section-sub">
            You just scanned a live demo QR from {prettyName}. In your real
            setup, this page is branded for your business and connected to your
            reward rules.
          </p>

          <div className="claim-box">
            <p className="claim-label">STEP 1</p>
            <h2>Connect or Create a Wallet</h2>
            <p>
              Here we&apos;ll drop your actual wallet integration—connect an
              existing wallet or create a simple email-based wallet so every
              customer can join.
            </p>

            <div className="wallet-action-row">

            {/* REAL METAMASK / WALLETCONNECT BUTTON */}
            <WalletConnectButton merchantSlug={MERCHANT_SLUG} />

            {/* EMAIL WALLET OPTION */}
            <WalletFlowPlaceholder merchantSlug={MERCHANT_SLUG} />
        
        </div>
          </div>

          <p className="claim-note">
            This is a demo environment. No real funds move here. Once
            you&apos;re onboarded, your QR sends customers to a page like this
            with your colors, logo, and live rewards.
          </p>
        </div>
      </section>
    </main>
  );
}
