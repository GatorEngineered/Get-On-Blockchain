// src/app/industries/restaurants/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Restaurant Loyalty Program Software | Increase Repeat Customers",
  description:
    "Boost repeat visits by 25% with our QR-based loyalty program for restaurants. Easy setup, no app required. Customers earn rewards, you see more regulars. Starting at $49/month.",
  keywords: [
    "restaurant loyalty program",
    "cafe rewards program",
    "restaurant customer retention",
    "increase restaurant foot traffic",
    "restaurant repeat customers",
    "QR code loyalty restaurant",
    "restaurant rewards software",
    "coffee shop loyalty program",
  ],
  openGraph: {
    title: "Restaurant Loyalty Program That Fills Tables with Regulars",
    description: "Turn first-time diners into weekly regulars. QR-based rewards program designed for restaurants and cafes.",
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
    icon: "📱",
    title: "No App Required",
    description: "Customers scan your QR code with their phone camera - same as viewing a menu. No downloads, no friction.",
  },
  {
    icon: "💰",
    title: "Proven ROI",
    description: "If just 10 customers visit once extra per month at $25 average check, that's $3,000+ in annual revenue - 25x your investment.",
  },
  {
    icon: "⚡",
    title: "Setup in 30 Minutes",
    description: "Print QR code on receipts or display at checkout. You're live. No hardware, no technical setup required.",
  },
];

const useCases = [
  {
    scenario: "Coffee Shop",
    example: "Every 10 visits earns a free coffee. Customers scan QR on receipt, track progress, claim reward.",
  },
  {
    scenario: "Quick Service Restaurant",
    example: "Earn 10 points per visit. At 100 points, customers get $5 off their next order or claim $5 USDC (Premium plan).",
  },
  {
    scenario: "Fine Dining",
    example: "VIP tier rewards: Priority reservations, birthday discounts, exclusive tasting events for loyal diners.",
  },
  {
    scenario: "Food Truck",
    example: "Customers follow you to different locations. Scan QR, earn points, redeem for free items wherever you park.",
  },
];

export default function RestaurantsPage() {
  return (
    <main className={styles.industryPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Restaurant Loyalty Program That<br />
            <span className={styles.highlight}>Fills Your Tables with Regulars</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Turn first-time diners into weekly customers. Our QR-based loyalty program
            makes it easy for restaurants and cafes to reward regulars and boost repeat visits by 25%+.
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
            ✓ No app required ✓ Setup in 30 minutes ✓ Starting at $49/month
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
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

      {/* Use Cases */}
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

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksInner}>
          <h2 className={styles.sectionTitle}>How It Works (3 Simple Steps)</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Customer Scans QR Code</h3>
              <p>Display your unique QR code at checkout or on receipts. Customers scan with phone camera (like viewing a menu).</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>They Earn Points Per Visit</h3>
              <p>Set your rules: 10 points per visit, welcome bonus for new customers, bonus for high spenders. You're in control.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Claim Rewards & Return</h3>
              <p>At 100 points, customers claim rewards (free item, discount, or $5 USDC). They come back more often to earn more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Example */}
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
              <p className={styles.roiHighlight}>60x return on a $99/month Premium plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=restaurants" className={styles.calculatorButton}>
                📊 Calculate Your Exact ROI
              </Link>
              <p className={styles.calculatorCaption}>
                See your specific numbers with our interactive calculator
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Ready to Fill Your Tables with Regulars?</h2>
          <p>Join restaurants and cafes using Get On Blockchain to boost repeat customers.</p>
          <Link href="/pricing" className={styles.ctaPrimary}>
            Get Started - $49/month
          </Link>
          <p className={styles.ctaCaption}>
            Questions? <Link href="/faq">Read our FAQ</Link> or <Link href="/support">contact support</Link>
          </p>
        </div>
      </section>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Restaurant Loyalty Program Software",
            description: "QR-based loyalty program for restaurants and cafes. Increase repeat customers by 25% with easy setup and proven ROI.",
            brand: {
              "@type": "Brand",
              name: "Get On Blockchain",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "99",
              highPrice: "149",
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
