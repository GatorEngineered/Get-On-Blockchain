// src/app/pricing/page.tsx
import type { Metadata } from "next";
import styles from "./pricing.module.css";
import PricingCards from "./PricingCards";

export const metadata: Metadata = {
  title: "Pricing - Blockchain Loyalty Plans from $55-249/month | Get On Blockchain",
  description:
    "The first blockchain-powered loyalty platform. Branded loyalty tokens, USDC stablecoin payouts on Polygon, non-custodial wallets, POS integration. Plans from $55-249/month with 7-day free trial.",
  keywords: [
    "blockchain loyalty pricing",
    "crypto rewards platform cost",
    "branded loyalty token pricing",
    "USDC rewards platform",
    "Polygon blockchain loyalty",
    "non-custodial wallet rewards",
    "POS integration loyalty",
    "Square loyalty integration",
    "Toast POS rewards",
    "Clover loyalty program",
    "Shopify rewards",
    "points per dollar spent",
    "blockchain verified rewards",
    "stablecoin payouts",
  ],
  openGraph: {
    title: "Blockchain Loyalty Pricing - Plans from $55-249/month",
    description: "Branded loyalty tokens. USDC payouts on Polygon. Non-custodial wallets. POS integration. Blockchain-verified rewards. Start free, upgrade anytime.",
    url: "https://getonblockchain.com/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            The First Blockchain-Powered Loyalty Platform
          </h1>
          <p className={styles.heroSubtitle}>
            Choose a plan that matches where your business is today—and where
            you want it to go. Every plan includes unlimited rewards, member
            tiers, referral tracking, and points that never expire.
            Premium unlocks USDC payouts. Growth gives you your own branded loyalty token.
          </p>
        </div>
      </section>

      {/* PLAN GRID WITH CHECKOUT */}
      <section className={styles.gridSection}>
        <PricingCards />
      </section>

      {/* FOOTNOTES */}
      <section className={styles.footnoteSection}>
        <p className={styles.footnoteSub}>
          * Need enterprise scale, custom tokens, or white-label solutions?{" "}
          <a href="mailto:support@getonblockchain.com" style={{ color: '#244b7a' }}>Contact us</a>{" "}
          for custom pricing. Taxes, card/processor fees, and on-chain gas costs are separate.
        </p>
      </section>
    </div>
  );
}
