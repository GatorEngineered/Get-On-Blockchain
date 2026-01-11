// src/app/pricing/page.tsx
import type { Metadata } from "next";
import styles from "./pricing.module.css";
import PricingCards from "./PricingCards";

export const metadata: Metadata = {
  title: "Pricing – Get On Blockchain",
  description:
    "Subscription plans for Web3-powered loyalty and rewards for local businesses.",
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
            you want it to go. Every plan includes QR-based rewards, member
            tracking, stablecoin + wallet setup, and a per-business custodial
            rewards balance.
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
