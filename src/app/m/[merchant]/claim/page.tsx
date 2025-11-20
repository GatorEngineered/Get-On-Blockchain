"use client"

import { useEffect } from "react";
import WalletFlowPlaceholder from "@/app/components/WalletFlowPlaceholder";
import { getMerchantBySlug } from "@/app/lib/merchants";

type MerchantClaimPageProps = {
  params: { merchant: string };
};

export default function MerchantClaimPage({ params }: MerchantClaimPageProps) {
  const slug = params.merchant || "";
  const merchant = getMerchantBySlug(slug);

  useEffect(() => {
    fetch("/api/track-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: slug, source: "qr" }),
    }).catch(() => {});
  }, [slug]);

  const prettyName =
    merchant?.name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="claim-main">
      <section className="section">
        <div className="container claim-inner">
          <p className="eyebrow">Reward claim</p>
          <h1>{prettyName} Loyalty Reward</h1>
          <p className="section-sub">
            {merchant
              ? merchant.tagline
              : `Thanks for scanning at ${prettyName}. This is where your customer will connect a wallet or create a quick account to receive their perk.`}
          </p>

          <div className="claim-box">
            <p className="claim-label">Step 1</p>
            <h2>Connect or create a wallet</h2>
            <p>
              In the live version, this area will trigger your wallet flow—either connect an
              existing wallet or create a custodial wallet using email or SMS.
            </p>

            <WalletFlowPlaceholder merchantSlug={slug} />
          </div>

          <p className="claim-note">
            Demo page for <strong>{prettyName}</strong>. We&apos;ll plug in your specific rewards,
            tiers, and expiry rules once your program is configured.
          </p>
        </div>
      </section>
    </main>
  );
}
