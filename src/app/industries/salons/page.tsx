// src/app/industries/salons/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Salon & Spa Loyalty Program | Increase Client Retention",
  description:
    "Boost rebooking rates by 40% with our QR-based loyalty program for salons and spas. Reward visits, increase retention, proven ROI. Starting at $49/month.",
  keywords: [
    "salon loyalty program",
    "spa rewards program",
    "salon customer retention",
    "increase salon rebooking",
    "beauty salon rewards",
    "QR code loyalty salon",
    "salon retention software",
    "hair salon loyalty program",
  ],
  openGraph: {
    title: "Salon Loyalty Program That Keeps Clients Rebooting",
    description: "Turn one-time clients into regulars. QR-based rewards program for salons, spas, and beauty businesses.",
    url: "https://getonblockchain.com/industries/salons",
  },
};

const salonBenefits = [
  {
    icon: "💇",
    title: "Increase Rebooking Rates",
    description: "Clients return 40% more often when earning rewards. Turn walk-ins into loyal regulars who book weeks ahead.",
  },
  {
    icon: "✨",
    title: "Reward Loyalty, Not Just Visits",
    description: "Bonus points for referrals, birthday rewards, VIP tiers for your best clients. Make them feel special.",
  },
  {
    icon: "📅",
    title: "Fill Your Schedule",
    description: "Loyal clients book more frequently. Less empty slots, more predictable revenue month over month.",
  },
  {
    icon: "⚡",
    title: "No Complex Setup",
    description: "Display QR code at checkout. Clients scan, earn points, rebook. That's it. No software training needed.",
  },
];

const useCases = [
  {
    scenario: "Hair Salon",
    example: "Earn points per service. At 100 points, get $25 off next cut/color or free deep conditioning treatment.",
  },
  {
    scenario: "Day Spa",
    example: "Membership rewards: Book monthly massage, earn double points. VIP tier gets priority booking and exclusive treatments.",
  },
  {
    scenario: "Nail Salon",
    example: "Every 6th visit free. Birthday month gets double points. Referral bonuses for bringing friends.",
  },
  {
    scenario: "Barbershop",
    example: "Loyalty punch card, digitized. Track visits, earn rewards, claim $5 USDC or free services. Modern twist on classic loyalty.",
  },
];

export default function SalonsPage() {
  return (
    <main className={styles.industryPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Salon Loyalty Program That<br />
            <span className={styles.highlight}>Fills Your Appointment Book</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stop losing clients after their first visit. Our QR-based loyalty program rewards repeat bookings,
            builds relationships, and keeps your schedule full with regulars.
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
            ✓ No punch cards ✓ Setup in 30 minutes ✓ Starting at $49/month
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.sectionTitle}>Why Salons & Spas Love Get On Blockchain</h2>
          <div className={styles.benefitsGrid}>
            {salonBenefits.map((benefit, index) => (
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
          <h2 className={styles.sectionTitle}>Perfect for Every Beauty Business</h2>
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
              <h3>Client Scans at Checkout</h3>
              <p>Display QR code at front desk or on receipts. Clients scan with phone camera after their service.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Earn Points Per Visit</h3>
              <p>You control rewards: points per service, referral bonuses, birthday rewards, VIP tiers. Fully customizable.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Claim Rewards & Rebook</h3>
              <p>Clients redeem for discounts or USDC (Premium plan). They book their next appointment to earn more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.roiSection}>
        <div className={styles.roiInner}>
          <h2 className={styles.sectionTitle}>Real ROI for Salons & Spas</h2>
          <div className={styles.roiCard}>
            <div className={styles.roiStats}>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>150</span>
                <span className={styles.roiLabel}>Monthly Clients</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>30%</span>
                <span className={styles.roiLabel}>Rebook More Often</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>$75</span>
                <span className={styles.roiLabel}>Avg Service Price</span>
              </div>
            </div>
            <div className={styles.roiCalculation}>
              <p><strong>Your Math:</strong></p>
              <p>45 clients × 1 extra visit/month = 45 additional bookings</p>
              <p>45 bookings × $75 average = <strong>$3,375/month in extra revenue</strong></p>
              <p className={styles.roiHighlight}>69x return on a $49/month Basic plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=salons" className={styles.calculatorButton}>
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
          <h2>Ready to Fill Your Schedule with Regulars?</h2>
          <p>Join salons and spas using loyalty rewards to boost rebooking rates.</p>
          <Link href="/pricing" className={styles.ctaPrimary}>
            Get Started - $49/month
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
            name: "Salon & Spa Loyalty Program Software",
            description: "QR-based loyalty program for salons, spas, and beauty businesses. Increase rebooking rates by 40% with easy rewards.",
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
              audienceType: "Hair Salons, Day Spas, Nail Salons, Barbershops, Beauty Businesses",
            },
          }),
        }}
      />
    </main>
  );
}
