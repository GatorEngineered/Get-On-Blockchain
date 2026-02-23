// src/app/industries/restaurants/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Restaurant Loyalty Program Software | Increase Repeat Customers",
  description:
    "Boost repeat visits by 25% with our QR-based loyalty program for restaurants. Integrates with Square, Toast & Clover. Happy hour multipliers, referral rewards, birthday bonuses. Starting at $55/month.",
  keywords: [
    "restaurant loyalty program",
    "cafe rewards program",
    "restaurant customer retention",
    "increase restaurant foot traffic",
    "restaurant repeat customers",
    "QR code loyalty restaurant",
    "restaurant rewards software",
    "coffee shop loyalty program",
    "square restaurant loyalty",
    "toast pos loyalty",
    "clover loyalty integration",
  ],
  openGraph: {
    title: "Restaurant Loyalty Program That Fills Tables with Regulars",
    description: "Turn first-time diners into weekly regulars. QR-based rewards with Square, Toast & Clover POS integration.",
    url: "https://getonblockchain.com/industries/restaurants",
  },
};

const restaurantBenefits = [
  {
    icon: "🍽️",
    title: "Turn Diners into Regulars",
    description: "Customers return 2-3x more often when earning rewards. Watch occasional visitors become your best regulars.",
  },
  {
    icon: "🕐",
    title: "Happy Hour Multipliers",
    description: "Offer 2x-3x points during slow hours to drive traffic when you need it most. Fill Monday lunches like Friday dinners.",
  },
  {
    icon: "🔗",
    title: "POS Integration Built In",
    description: "Connect Square, Toast, or Clover to automatically award points on every transaction. Zero friction at checkout.",
  },
  {
    icon: "⚡",
    title: "No App Required",
    description: "Customers scan your QR code with their phone camera — same as viewing a menu. No downloads, no friction, live in 30 minutes.",
  },
];

const useCases = [
  {
    scenario: "Coffee Shop",
    example: "Every 10 visits earns a free coffee. Birthday bonus doubles points for the whole month. Square integration tracks it all.",
  },
  {
    scenario: "Quick Service Restaurant",
    example: "Toast POS syncs every order automatically. Happy hour multipliers drive 2x points on slow afternoons. Referral bonuses grow your base.",
  },
  {
    scenario: "Fine Dining",
    example: "VIP tier rewards: Priority reservations, anniversary dining bonuses, exclusive tasting events. Clover integration for seamless tracking.",
  },
  {
    scenario: "Food Truck",
    example: "Customers follow you anywhere. Scan QR, earn points, refer friends. Social engagement rewards for tagging your location.",
  },
];

const platformFeatures = [
  { icon: "🕐", title: "Happy Hour Points", desc: "2x-3x multipliers during slow periods" },
  { icon: "🎂", title: "Birthday Rewards", desc: "Auto-trigger bonus points on birthdays" },
  { icon: "💍", title: "Anniversary Rewards", desc: "Celebrate dining relationship milestones" },
  { icon: "📣", title: "Referral System", desc: "Reward diners who bring new customers" },
  { icon: "📱", title: "Social Engagement", desc: "Points for check-ins, reviews, and shares" },
  { icon: "🪙", title: "Branded Token", desc: "Your own loyalty currency on Growth plan" },
  { icon: "🎯", title: "Custom Points Rules", desc: "Set rules per menu item or spend level" },
  { icon: "💸", title: "Crypto Payouts", desc: "Let customers redeem points as USDC" },
];

const integrations = ["Square", "Toast", "Clover"];

export default function RestaurantsPage() {
  return (
    <main className={styles.industryPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Restaurant Loyalty Program That<br />
            <span className={styles.highlight}>Fills Your Tables with Regulars</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Turn first-time diners into weekly customers. Happy hour multipliers drive traffic on slow days,
            POS integration automates everything, and referral rewards grow your customer base organically.
          </p>
          <div className={styles.heroCta}>
            <Link href="/pricing" className={styles.ctaPrimary}>
              View Pricing
            </Link>
            <Link href="/faq" className={styles.ctaSecondary}>
              How It Works
            </Link>
          </div>
          <p className={styles.heroCaption}>
            ✓ Integrates with Square, Toast & Clover ✓ Happy hour multipliers ✓ Starting at $55/month
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.sectionTitle}>Why Restaurants Choose Get On Blockchain</h2>
          <div className={styles.benefitsGrid}>
            {restaurantBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featuresHighlight}>
        <div className={styles.featuresHighlightInner}>
          <h2 className={styles.sectionTitle}>Powerful Features for Restaurants</h2>
          <div className={styles.featuresGrid}>
            {platformFeatures.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureItemIcon}>{feature.icon}</div>
                <div className={styles.featureItemTitle}>{feature.title}</div>
                <div className={styles.featureItemDesc}>{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.integrationsStrip}>
        <div className={styles.integrationsStripInner}>
          <h3 className={styles.integrationsTitle}>Seamless POS Integrations</h3>
          <p className={styles.integrationsSubtitle}>
            Automatically award points on every transaction — no extra steps for your staff
          </p>
          <div className={styles.integrationsList}>
            {integrations.map((name) => (
              <span key={name} className={styles.integrationBadge}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.useCases}>
        <div className={styles.useCasesInner}>
          <h2 className={styles.sectionTitle}>Loyalty Programs for Every Restaurant Type</h2>
          <div className={styles.useCasesList}>
            {useCases.map((useCase, index) => (
              <div key={index} className={styles.useCaseCard}>
                <h3 className={styles.useCaseTitle}>{useCase.scenario}</h3>
                <p className={styles.useCaseExample}>{useCase.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.howItWorksInner}>
          <h2 className={styles.sectionTitle}>How It Works (3 Simple Steps)</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Connect Your POS</h3>
              <p>Link Square, Toast, or Clover in one click. Or display a QR code at checkout — customers scan with their phone camera.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Customers Earn Points Automatically</h3>
              <p>Points per visit, happy hour multipliers, birthday bonuses, referral rewards. You set the rules, we handle the rest.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Claim Rewards & Return</h3>
              <p>At reward threshold, customers claim free items, discounts, or USDC payouts. They come back more often to earn more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.roiSection}>
        <div className={styles.roiInner}>
          <h2 className={styles.sectionTitle}>Real ROI for Restaurants</h2>
          <div className={styles.roiCard}>
            <div className={styles.roiStats}>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>50</span>
                <span className={styles.roiLabel}>Daily Customers</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>20%</span>
                <span className={styles.roiLabel}>Become Regulars</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>10+</span>
                <span className={styles.roiLabel}>Extra Visits/Day</span>
              </div>
            </div>
            <div className={styles.roiCalculation}>
              <p><strong>Your Math:</strong></p>
              <p>10 extra visits/day × $20 average check = $200/day</p>
              <p>$200/day × 30 days = <strong>$6,000/month in additional revenue</strong></p>
              <p className={styles.roiHighlight}>40x return on a $149/month Premium plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=restaurants" className={styles.calculatorButton}>
                Calculate Your Exact ROI
              </Link>
              <p className={styles.calculatorCaption}>
                See your specific numbers with our interactive calculator
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Ready to Fill Your Tables with Regulars?</h2>
          <p>Join restaurants and cafes using loyalty rewards with automatic POS integration to boost repeat customers.</p>
          <Link href="/pricing" className={styles.ctaPrimary}>
            Get Started - $55/month
          </Link>
          <p className={styles.ctaCaption}>
            Questions? <Link href="/faq">Read our FAQ</Link> or <Link href="/support">contact support</Link>
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Restaurant Loyalty Program Software",
            description: "QR-based loyalty program for restaurants and cafes with Square, Toast & Clover POS integration. Increase repeat customers by 25%.",
            brand: {
              "@type": "Brand",
              name: "Get On Blockchain",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "55",
              highPrice: "249",
            },
            audience: {
              "@type": "Audience",
              audienceType: "Restaurants, Cafes, Food Service Businesses",
            },
          }),
        }}
      />
    </main>
  );
}
