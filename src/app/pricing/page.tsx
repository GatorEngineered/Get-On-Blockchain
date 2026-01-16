// src/app/pricing/page.tsx
import type { Metadata } from "next";
import styles from "./pricing.module.css";
import PricingCards from "./PricingCards";

export const metadata: Metadata = {
  title: "Pricing - Loyalty Program Plans Starting at $49/month | Get On Blockchain",
  description:
    "Affordable loyalty program software for local businesses. Unlimited rewards, points never expire, member tiers, referral tracking, email marketing, USDC payouts on Polygon. POS integration with Square, Toast, Clover, Shopify. Points per dollar spent. Plans from $49-149/month. 7-day free trial.",
  keywords: [
    "loyalty program pricing",
    "customer rewards software cost",
    "loyalty program plans",
    "affordable loyalty software",
    "small business rewards program",
    "loyalty program free trial",
    "QR rewards pricing",
    "unlimited rewards",
    "points never expire",
    "USDC rewards",
    "Polygon blockchain rewards",
    "POS integration loyalty",
    "Square loyalty integration",
    "Toast POS rewards",
    "Clover loyalty program",
    "Shopify rewards",
    "points per dollar spent",
  ],
  openGraph: {
    title: "Loyalty Program Pricing - Plans for Every Business Size",
    description: "Unlimited rewards. Points never expire. Member tiers. Referral tracking. POS integration (Square, Toast, Clover, Shopify). Points per dollar spent. USDC payouts on Polygon. Start free, upgrade anytime.",
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
            Web3 Rewards for Real-World Businesses
          </h1>
          <p className={styles.heroSubtitle}>
            Choose a plan that matches where your business is today—and where
            you want it to go. Every plan includes unlimited rewards, member
            tiers, referral tracking, and points that never expire.
            Premium plans unlock USDC payouts on Polygon with ultra-low fees.
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
          * Higher volumes, more locations, or very complex setups may require a
          custom quote. Taxes, card/processor fees, and any on-chain gas costs
          (when used) are separate.
        </p>
      </section>
    </div>
  );
}
