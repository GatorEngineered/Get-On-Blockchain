// src/app/industries/salons/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Salon & Spa Loyalty Program | Increase Client Retention",
  description:
    "Boost rebooking rates by 40% with our QR-based loyalty program for salons and spas. Integrates with Vagaro, Booksy & Boulevard. Birthday rewards, referral bonuses, branded tokens. Starting at $55/month.",
  keywords: [
    "salon loyalty program",
    "spa rewards program",
    "salon customer retention",
    "increase salon rebooking",
    "beauty salon rewards",
    "QR code loyalty salon",
    "salon retention software",
    "hair salon loyalty program",
    "vagaro loyalty integration",
    "booksy loyalty rewards",
    "boulevard salon rewards",
  ],
  openGraph: {
    title: "Salon Loyalty Program That Keeps Clients Rebooting",
    description: "Turn one-time clients into regulars. QR-based rewards program with Vagaro, Booksy & Boulevard integration for salons, spas, and beauty businesses.",
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
    icon: "🎂",
    title: "Birthday & Anniversary Rewards",
    description: "Automatic birthday bonuses and rewards for client anniversaries. Celebrate milestones and make clients feel truly special.",
  },
  {
    icon: "📅",
    title: "Fill Slow Days Automatically",
    description: "Set time-based multipliers to offer bonus points on slow days. Fill empty chairs on Tuesdays the same way you fill Saturdays.",
  },
  {
    icon: "🔗",
    title: "Integrates with Your POS",
    description: "Connect Vagaro, Booksy, or Boulevard to automatically award points on every service. No manual tracking needed.",
  },
];

const useCases = [
  {
    scenario: "Hair Salon",
    example: "Earn points per service via Vagaro integration. Birthday month gets double points. At 100 points, get $25 off next cut/color or free deep conditioning.",
  },
  {
    scenario: "Day Spa",
    example: "Connect Boulevard for automatic points on every treatment. VIP tier gets priority booking, anniversary bonuses, and exclusive packages.",
  },
  {
    scenario: "Nail Salon",
    example: "Booksy integration tracks appointments automatically. Every 6th visit free. Refer a friend, both earn bonus points.",
  },
  {
    scenario: "Barbershop",
    example: "Loyalty punch card, digitized. Slow-day multipliers fill midweek slots. Clients claim $5 USDC or free services. Modern twist on classic loyalty.",
  },
];

const platformFeatures = [
  { icon: "🎂", title: "Birthday Rewards", desc: "Auto-trigger bonus points on client birthdays" },
  { icon: "💍", title: "Anniversary Rewards", desc: "Celebrate client relationship milestones" },
  { icon: "🕐", title: "Slow-Day Multipliers", desc: "2x-3x points to fill empty appointment slots" },
  { icon: "📣", title: "Referral System", desc: "Reward clients who bring new customers" },
  { icon: "📱", title: "Social Engagement", desc: "Points for follows, shares, and reviews" },
  { icon: "🪙", title: "Branded Token", desc: "Your own loyalty currency on Growth plan" },
  { icon: "🎯", title: "Custom Points Rules", desc: "Set rules per service type or spend level" },
  { icon: "💸", title: "Crypto Payouts", desc: "Let clients redeem points as USDC" },
];

const integrations = ["Vagaro", "Booksy", "Boulevard"];

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
            Stop losing clients after their first visit. Reward repeat bookings with birthday bonuses,
            referral rewards, and slow-day multipliers — all synced automatically with Vagaro, Booksy, or Boulevard.
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
            ✓ Integrates with Vagaro, Booksy & Boulevard ✓ Setup in 30 minutes ✓ Starting at $55/month
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

      <section className={styles.featuresHighlight}>
        <div className={styles.featuresHighlightInner}>
          <h2 className={styles.sectionTitle}>Built-In Features for Beauty Businesses</h2>
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
            Automatically award points when clients pay — no extra steps at checkout
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
              <h3>Connect Your POS</h3>
              <p>Link Vagaro, Booksy, or Boulevard in one click. Or display a QR code at checkout — clients scan with their phone camera.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Clients Earn Points Automatically</h3>
              <p>Points on every service, birthday bonuses, referral rewards, and slow-day multipliers. You set the rules, we handle the rest.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Claim Rewards & Rebook</h3>
              <p>Clients redeem for discounts, free services, or USDC payouts. They book their next appointment to earn more.</p>
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
              <p className={styles.roiHighlight}>61x return on a $55/month Basic plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=salons" className={styles.calculatorButton}>
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
          <h2>Ready to Fill Your Schedule with Regulars?</h2>
          <p>Join salons and spas using loyalty rewards to boost rebooking rates — with POS integration that works automatically.</p>
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
            name: "Salon & Spa Loyalty Program Software",
            description: "QR-based loyalty program for salons, spas, and beauty businesses with Vagaro, Booksy & Boulevard integration. Increase rebooking rates by 40%.",
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
              audienceType: "Hair Salons, Day Spas, Nail Salons, Barbershops, Beauty Businesses",
            },
          }),
        }}
      />
    </main>
  );
}
