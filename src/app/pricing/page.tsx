// src/app/pricing/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./pricing.module.css";

type PlanId = "BASIC" | "PREMIUM"; // | "GROWTH" | "PRO"; // Commented out for Phase 1

type Plan = {
    id: PlanId;
    name: string;
    badge?: string;
    priceMonthly: number;
    priceLabel?: string;
    setupFee: number;
    description: string;
    features: string[];
    bookingLink: string;
};


export const metadata: Metadata = {
    title: "Pricing – Get On Blockchain",
    description:
        "Subscription plans for Web3-powered loyalty and rewards for local businesses.",
};

const plans: Plan[] = [
    {
        id: "BASIC",
        name: "Basic",
        priceMonthly: 99,
        setupFee: 100,
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
        bookingLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/yPu7yBfQtE2IJIoMETcTxQ2?ismsaljsauthenabled",
    },
    {
        id: "PREMIUM",
        name: "Premium",
        badge: "Most Popular",
        priceMonthly: 149,
        setupFee: 100,
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
        bookingLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/jqJVj70MCkSd09LxmRgLeg2?ismsaljsauthenabled",
    },
    /* COMMENTED OUT - Will be added back later
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
        bookingLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/Oy7TZYG86EGPh2CWLbCbxw2?ismsaljsauthenabled",
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
            "QR scan rewards for visits",
            "Email login + wallet-based rewards (custodial wallet included)",
            "You choose the stablecoin and wallet flow per business",
            "Custodian account setup for each business",
            "3 merchant claim page (yourbrand.getonblockchain.com)",
            "5 custom points rules for visits, referrals, challenges, or spend tiers",
            "Premium member ledger for earn / redeem history",
            "Branded reward tokens for deeper engagement (no NFTs required)",
            "Customer segments and basic automations",
            "Advanced reporting dashboard",
            "Up to 15,000 active members",
            "Up to 2 staff logins",
            "Guided onboarding and rollout",
            "Priority email support",
        ],
        bookingLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/Oy7TZYG86EGPh2CWLbCbxw2?ismsaljsauthenabled",
    },
    {
        id: "PRO",
        name: "Enterprise",
        badge: "High Volume",
        priceMonthly: 349,
        setupFee: 100,
        priceLabel: "From $349+",
        description:
            "For high-volume or multi-location businesses that need custom workflows, NFT access, and hands-on rollout.",
        features: [
            "Up to 15 locations*",
            "QR scan rewards for visits",
            "Email login + wallet-based rewards (custodial or external wallets)",
            "You choose stablecoins, wallet standards, and any on-chain networks we support",
            "Custodian account setup and configuration",
            "15 merchant claim page (yourbrand.getonblockchain.com)*",
            "Unlimited custom points rules and tiers* for complex campaigns",
            "NFT access passes and on-chain memberships for premium experiences*",
            "Branded tokens, advanced automation, and custom workflows*",
            "Advanced reporting and data export",
            "Up to 35,000 active members*",
            "Up to 5 staff logins*",
            "Custom onboarding and rollout",
            "Dedicated account manager",
            "Priority support with response-time agreements",
        ],
        bookingLink: "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/5thNk3UlO0qkhZqxFRmZag2?ismsaljsauthenabled",
    },
    */
];

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

      {/* PLAN GRID */}
      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {plans.map((plan) => (
            <article
              key={plan.id}
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
                    {plan.priceLabel ?? `$${plan.priceMonthly}`}
                  </span>
                  <span className={styles.cardPriceTerm}>/month</span>
                </p>
                <p className={styles.cardSetup}>
                  + ${plan.setupFee} one-time setup &amp; onboarding
                </p>

                <p className={styles.cardDescription}>{plan.description}</p>
              </div>

              <ul className={styles.cardFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className={styles.cardActions}>
                <a
                  href={plan.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryBtn}
                >
                  Get Started
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
          ))}
        </div>
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
          bring in a designer or implement advanced custom designs. Taxes,
          card / processor fees, and any on-chain gas costs (when used) are
          separate.
        </p>
      </section>
    </div>
  );
}