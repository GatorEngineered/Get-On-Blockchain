// src/app/industries/retail/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Retail Loyalty Program Software | Boost Customer Retention",
  description:
    "Increase repeat purchases by 30% with our QR-based loyalty program for retail stores. Easy setup, instant rewards, proven ROI. Starting at $99/month.",
  keywords: [
    "retail loyalty program",
    "store rewards program",
    "retail customer retention",
    "increase retail sales",
    "retail repeat customers",
    "QR code loyalty retail",
    "retail rewards software",
    "boutique loyalty program",
  ],
  openGraph: {
    title: "Retail Loyalty Program That Turns Shoppers into Regulars",
    description: "Transform one-time buyers into loyal customers. QR-based rewards program for retail stores and boutiques.",
    url: "https://getonblockchain.com/industries/retail",
  },
};

const retailBenefits = [
  {
    icon: "🛍️",
    title: "Turn Browsers into Buyers",
    description: "Customers return 30% more often when earning rewards. Watch occasional shoppers become your best customers.",
  },
  {
    icon: "📱",
    title: "Instant Digital Rewards",
    description: "No punch cards to lose. Customers track points on their phone and claim rewards instantly at checkout.",
  },
  {
    icon: "💎",
    title: "Compete with Big Box Stores",
    description: "Offer the same loyalty perks as major retailers - without the enterprise price tag or complexity.",
  },
  {
    icon: "⚡",
    title: "Live in Minutes",
    description: "Display QR code at register or on receipts. No training needed, no complicated software to learn.",
  },
];

const useCases = [
  {
    scenario: "Clothing Boutique",
    example: "Earn points per dollar spent. VIP tier unlocks early access to new collections and exclusive discounts.",
  },
  {
    scenario: "Gift Shop",
    example: "Birthday bonus points, seasonal double-point events, refer-a-friend rewards to grow your customer base.",
  },
  {
    scenario: "Book Store",
    example: "Every 5 purchases earns a $10 credit. Book club members get double points on featured titles.",
  },
  {
    scenario: "Home Goods Store",
    example: "Spend $500 total, get $25 off next purchase or claim $25 USDC. Premium rewards for premium customers.",
  },
];

export default function RetailPage() {
  return (
    <main className={styles.industryPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Retail Loyalty Program That<br />
            <span className={styles.highlight}>Turns Shoppers into Regulars</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stop losing customers to big box stores. Our QR-based loyalty program gives your retail shop
            the same rewards power as major chains - at a fraction of the cost.
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
            ✓ No punch cards ✓ Setup in 30 minutes ✓ Starting at $99/month
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.sectionTitle}>Why Retail Stores Love Get On Blockchain</h2>
          <div className={styles.benefitsGrid}>
            {retailBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.useCases}>
        <div className={styles.useCasesInner}>
          <h2 className={styles.sectionTitle}>Perfect for Every Type of Retail Store</h2>
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
              <h3>Customer Scans at Checkout</h3>
              <p>Display QR code at register or include on receipts. Customers scan with phone camera - no app needed.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>They Earn Points Per Purchase</h3>
              <p>You control the rules: points per dollar, bonus points for high spenders, welcome rewards for new shoppers.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Redeem Rewards & Return</h3>
              <p>Customers claim discounts or USDC payouts (Premium plan). They come back to earn more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.roiSection}>
        <div className={styles.roiInner}>
          <h2 className={styles.sectionTitle}>Real ROI for Retail Stores</h2>
          <div className={styles.roiCard}>
            <div className={styles.roiStats}>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>100</span>
                <span className={styles.roiLabel}>Monthly Customers</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>25%</span>
                <span className={styles.roiLabel}>Return More Often</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>$50</span>
                <span className={styles.roiLabel}>Avg Purchase</span>
              </div>
            </div>
            <div className={styles.roiCalculation}>
              <p><strong>Your Math:</strong></p>
              <p>25 customers × 1 extra purchase/month = 25 extra sales</p>
              <p>25 sales × $50 average = <strong>$1,250/month in additional revenue</strong></p>
              <p className={styles.roiHighlight}>12x return on a $99/month Basic plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=retail" className={styles.calculatorButton}>
                📊 Calculate Your Exact ROI
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
          <h2>Ready to Compete with Big Box Retailers?</h2>
          <p>Join retail stores using loyalty rewards to keep customers coming back.</p>
          <Link href="/pricing" className={styles.ctaPrimary}>
            Get Started - $99/month
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
            name: "Retail Loyalty Program Software",
            description: "QR-based loyalty program for retail stores and boutiques. Increase repeat purchases by 30% with easy setup and proven ROI.",
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
              audienceType: "Retail Stores, Boutiques, Gift Shops, Specialty Stores",
            },
          }),
        }}
      />
    </main>
  );
}
