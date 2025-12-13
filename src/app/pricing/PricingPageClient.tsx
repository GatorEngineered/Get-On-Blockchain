// src/app/pricing/PricingPageClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import styles from "./pricing.module.css";

type PlanId = "BASIC" | "PREMIUM"; // | "GROWTH" | "PRO"; // Commented out for launch
type BillingPeriod = "monthly" | "annual";

type Plan = {
  id: PlanId;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceLabelMonthly?: string; // for Enterprise "From $349+"
  setupFee: number;
  description: string;
  features: string[];
  paypalLink: string;
};

const plans: Plan[] = [
  {
    id: "BASIC",
    name: "Basic",
    priceMonthly: 99,
    setupFee: 199,
    description:
      "Points & rewards only. Redeem for free products/discounts. Simple for businesses who don't want crypto complexity.",
    features: [
      "QR-based loyalty with points & rewards",
      "Redeem for free products/discounts",
      "1 merchant claim page (yourbrand.getonblockchain.com)",
      "Basic dashboard & analytics",
      "Simple POS receipt QR (just print the URL)",
      "Up to 1,000 active members",
      "Email support",
    ],
    paypalLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/jqJVj70MCkSd09LxmRgLeg2?ismsaljsauthenabled",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    badge: "Most Popular",
    priceMonthly: 149,
    setupFee: 249,
    description:
      "Everything in Basic + stablecoin rewards. Give your customers REAL money, not just points. Blockchain-verified rewards.",
    features: [
      "Everything in Basic",
      "Stablecoin rewards (your unique angle)",
      "\"Give your customers REAL money, not just points\"",
      "Blockchain-verified rewards",
      "Customer wallet setup (MetaMask, Trust Wallet, Coinbase Wallet, etc.)",
      "Milestone-based payouts (100 points = $5 USDC)",
      "Up to 5,000 active members",
      "Priority email support",
    ],
    paypalLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/Oy7TZYG86EGPh2CWLbCbxw2?ismsaljsauthenabled",
  },
  /* COMMENTED OUT - Will be added back later
  {
    id: "GROWTH",
    name: "Growth",
    badge: "Most Popular",
    priceMonthly: 249,
    setupFee: 100,
    description:
      "For growing brands that want more automation, more insight, and multi-location support with branded tokens.",
    features: [
      "Up to 3 locations",
      "Email login + wallet-based rewards (custodial wallet included)",
      "You choose the stablecoin and wallet flow per business",
      "Custodian account setup for each business",
      "5 custom points rules for visits, referrals, challenges, or spend tiers",
      "Branded reward tokens for deeper engagement (no NFTs required)",
      "Customer segments and basic automations",
      "Advanced reporting dashboard",
      "Up to 15,000 active members",
      "Up to 2 staff logins",
      "Guided onboarding and rollout",
      "Priority email support",
    ],
    paypalLink: "https://www.paypal.com/ncp/payment/YOUR-GROWTH-BUTTON-ID",
  },
  {
    id: "PRO",
    name: "Enterprise",
    badge: "High Volume",
    priceMonthly: 349,
    priceLabelMonthly: "From $349+",
    setupFee: 100,
    description:
      "For high-volume or multi-location businesses that need custom workflows, NFT access, and hands-on rollout.",
    features: [
      "Up to 15 locations*",
      "Email login + wallet-based rewards (custodial or external wallets)",
      "You choose stablecoins, wallet standards, and any on-chain networks we support",
      "Custodian account setup and configuration",
      "Unlimited custom points rules and tiers* for complex campaigns",
      "NFT access passes and on-chain memberships for premium experiences*",
      "Branded tokens, advanced automation, and custom workflows",
      "Advanced reporting and data export",
      "Up to 35,000 active members*",
      "Up to 5 staff logins*",
      "Custom onboarding and rollout",
      "Dedicated account manager",
      "Priority support with response-time agreements",
    ],
    paypalLink:
      "https://www.paypal.com/ncp/payment/YOUR-ENTERPRISE-BUTTON-ID",
  },
  */
];

function getPriceLabels(plan: Plan, billing: BillingPeriod) {
  const baseMonthly = plan.priceMonthly;

  if (billing === "monthly") {
    const amount =
      plan.priceLabelMonthly ?? `$${baseMonthly}`;
    return {
      amount,
      term: "/month",
    };
  }

  // Annual: 2 months free → 10x monthly price.
  const annualBase = baseMonthly * 10;

  return {
    amount: `$${annualBase}`,
    term: "/year (2 months free)",
  };
}

export default function PricingPageClient() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Reveal>
            <h1 className={styles.heroTitle}>
              Web3 Rewards for Real-World Businesses
            </h1>
          </Reveal>
          <Reveal>
            <p className={styles.heroSubtitle}>
              Choose a plan that matches where your business is today—and where
              you want it to go. Every plan includes QR-based rewards, member
              tracking, stablecoin + wallet setup, and a per-business custodial
              rewards balance.
            </p>
          </Reveal>

          {/* BILLING TOGGLE */}
          <Reveal>
            <div className={styles.billingToggle}>
              <button
                type="button"
                className={`${styles.billingToggleBtn} ${
                  billingPeriod === "monthly" ? styles.billingToggleBtnActive : ""
                }`}
                onClick={() => setBillingPeriod("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`${styles.billingToggleBtn} ${
                  billingPeriod === "annual" ? styles.billingToggleBtnActive : ""
                }`}
                onClick={() => setBillingPeriod("annual")}
              >
                Annual{" "}
                <span className={styles.billingToggleBadge}>
                  2 months free
                </span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PLAN GRID */}
      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {plans.map((plan) => {
            const priceLabels = getPriceLabels(plan, billingPeriod);

            return (
              <Reveal key={plan.id}>
                <article
                  className={`${styles.card} ${
                    plan.badge ? styles.cardHighlight : ""
                  }`}
                >
                  {plan.badge && (
                    <div className={styles.cardBadge}>{plan.badge}</div>
                  )}

                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{plan.name}</h2>

                    <p className={styles.cardPrice}>
                      <span className={styles.cardPriceAmount}>
                        {priceLabels.amount}
                      </span>
                      <span className={styles.cardPriceTerm}>
                        {priceLabels.term}
                      </span>
                    </p>

                    {/* Setup fee with tooltip (style C) */}
                    <p className={styles.cardSetup}>
                      + ${plan.setupFee} one-time setup &amp; onboarding{" "}
                      <span
                        className={styles.tooltipIcon}
                        title="Covers first-time configuration of your claim page, stablecoin & wallet setup, and onboarding walkthrough."
                      >
                        i
                      </span>
                    </p>

                    <p className={styles.cardDescription}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className={styles.cardFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <div className={styles.cardActions}>
                    <a
                      href={plan.paypalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.primaryBtn}
                    >
                      Get started with PayPal
                    </a>

                    <Link href="/contact" className={styles.secondaryBtn}>
                      Talk to sales
                    </Link>
                  </div>

                  <p className={styles.cardNote}>
                    You can upgrade or pause your plan before the next billing
                    cycle.
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* COMPARE PLANS TABLE */}
      <section className={styles.compareSection}>
        <Reveal>
          <h2 className={styles.compareTitle}>Compare plans</h2>
        </Reveal>

        <Reveal>
          <div className={styles.compareTableWrapper}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th></th>
                  <th>Basic</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Active members</td>
                  <td>Up to 1,000</td>
                  <td>Up to 5,000</td>
                </tr>
                <tr>
                  <td>QR-based loyalty</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Points & rewards</td>
                  <td>✓ (Products/discounts only)</td>
                  <td>✓ (Products/discounts + stablecoins)</td>
                </tr>
                <tr>
                  <td>Stablecoin rewards</td>
                  <td>–</td>
                  <td>✓ (USDC, USDT, DAI)</td>
                </tr>
                <tr>
                  <td>Blockchain verification</td>
                  <td>–</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Wallet support</td>
                  <td>Not needed</td>
                  <td>MetaMask, Trust, Coinbase, WalletConnect, etc.</td>
                </tr>
                <tr>
                  <td>Milestone payouts</td>
                  <td>–</td>
                  <td>✓ (e.g., 100 pts = $5 USDC)</td>
                </tr>
                <tr>
                  <td>Support</td>
                  <td>Email support</td>
                  <td>Priority email support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* FOOTNOTES & LIGHTER OPTION */}
      <section className={styles.footnoteSection}>
        <p className={styles.footnoteMain}>
          Need something lighter?{" "}
          <strong>
            Per-claim pricing is available for micro-shops on request.
          </strong>
        </p>
        <p className={styles.footnoteSub}>
          * Higher volumes, more locations, or very complex setups may require a
          custom quote. NFT options can include additional fees if we need to
          bring in a designer or implement advanced custom designs. Taxes, card
          / processor fees, and any on-chain gas costs (when used) are
          separate.
        </p>
      </section>
    </div>
  );
}
