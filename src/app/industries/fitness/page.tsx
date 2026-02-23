// src/app/industries/fitness/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Fitness Studio Loyalty Program | Boost Member Retention",
  description:
    "Reduce gym churn by 35% with our QR-based loyalty program for fitness studios. Anniversary milestones, referral rewards, social engagement points, custom rules. Starting at $55/month.",
  keywords: [
    "fitness loyalty program",
    "gym rewards program",
    "fitness studio retention",
    "reduce gym churn",
    "fitness member rewards",
    "QR code loyalty fitness",
    "gym retention software",
    "yoga studio loyalty program",
    "crossfit loyalty rewards",
    "fitness referral program",
  ],
  openGraph: {
    title: "Fitness Loyalty Program That Keeps Members Coming Back",
    description: "Turn occasional gym-goers into dedicated members. QR-based rewards with anniversary milestones, referral bonuses, and social engagement.",
    url: "https://getonblockchain.com/industries/fitness",
  },
};

const fitnessBenefits = [
  {
    icon: "💪",
    title: "Reduce Member Churn",
    description: "Members stay 35% longer when earning rewards for attendance. Turn drop-offs into long-term committed clients.",
  },
  {
    icon: "🏆",
    title: "Gamify Attendance",
    description: "Points per class, streak bonuses, and milestone rewards. Anniversary celebrations for 6-month and 1-year members. Make showing up feel like winning.",
  },
  {
    icon: "📣",
    title: "Referral-Powered Growth",
    description: "Members earn bonus points for every friend they bring in. Your best members become your best marketers.",
  },
  {
    icon: "⚡",
    title: "No Check-in Hardware",
    description: "Members scan QR code when they arrive. No tablets, no RFID cards, no expensive infrastructure. Live in 30 minutes.",
  },
];

const useCases = [
  {
    scenario: "Boutique Gym",
    example: "Earn 10 points per workout. Anniversary bonuses at 6 months and 1 year. Refer a friend, both get 50 bonus points. Custom rules per class type.",
  },
  {
    scenario: "Yoga Studio",
    example: "Attend 10 classes, get 11th free. VIP members get double points and priority booking. Social engagement points for posting class photos.",
  },
  {
    scenario: "CrossFit Box",
    example: "Track WOD attendance with custom points rules. Hit 20 WODs per month for bonus rewards. Referral bonuses and branded token on Growth plan.",
  },
  {
    scenario: "Cycling Studio",
    example: "Reward consistency: 3x/week for a month earns bonus. $25 USDC or merchandise credit. Anniversary milestones celebrate dedication.",
  },
];

const platformFeatures = [
  { icon: "💍", title: "Anniversary Milestones", desc: "Reward 3-month, 6-month, and 1-year members" },
  { icon: "🎂", title: "Birthday Rewards", desc: "Auto-trigger bonus points on member birthdays" },
  { icon: "📣", title: "Referral System", desc: "Members earn for every friend they sign up" },
  { icon: "📱", title: "Social Engagement", desc: "Points for check-ins, class photos, and reviews" },
  { icon: "🎯", title: "Custom Points Rules", desc: "Different points per class type or visit count" },
  { icon: "🪙", title: "Branded Token", desc: "Your own loyalty currency on Growth plan" },
  { icon: "🏆", title: "Streak Bonuses", desc: "Reward members who show up consistently" },
  { icon: "💸", title: "Crypto Payouts", desc: "Let members redeem points as USDC" },
];

export default function FitnessPage() {
  return (
    <main className={styles.industryPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Fitness Loyalty Program That<br />
            <span className={styles.highlight}>Keeps Members Motivated</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stop losing members to churn. Reward attendance with milestone celebrations,
            referral bonuses, and social engagement points that turn casual gym-goers into your most dedicated members.
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
            ✓ No check-in hardware ✓ Anniversary milestones ✓ Starting at $55/month
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.sectionTitle}>Why Fitness Studios Choose Get On Blockchain</h2>
          <div className={styles.benefitsGrid}>
            {fitnessBenefits.map((benefit, index) => (
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
          <h2 className={styles.sectionTitle}>Built-In Features for Fitness Businesses</h2>
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

      <section className={styles.useCases}>
        <div className={styles.useCasesInner}>
          <h2 className={styles.sectionTitle}>Perfect for Every Fitness Business</h2>
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
              <h3>Member Scans at Check-In</h3>
              <p>Display QR code at entrance. Members scan with phone camera when they arrive — takes 2 seconds.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Earn Points & Hit Milestones</h3>
              <p>Points per class, streak bonuses, referral rewards, anniversary celebrations. Custom rules per class type. Fully automated.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Unlock Rewards & Stay Motivated</h3>
              <p>Members claim free sessions, merchandise, or USDC payouts. They stay engaged, keep showing up, and tell their friends.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.roiSection}>
        <div className={styles.roiInner}>
          <h2 className={styles.sectionTitle}>Real ROI for Fitness Studios</h2>
          <div className={styles.roiCard}>
            <div className={styles.roiStats}>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>200</span>
                <span className={styles.roiLabel}>Active Members</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>15%</span>
                <span className={styles.roiLabel}>Churn Reduction</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>30</span>
                <span className={styles.roiLabel}>Members Retained</span>
              </div>
            </div>
            <div className={styles.roiCalculation}>
              <p><strong>Your Math:</strong></p>
              <p>30 members × $150/month membership = $4,500/month retained</p>
              <p><strong>Annual value of reduced churn: $54,000+</strong></p>
              <p className={styles.roiHighlight}>362x return on a $149/month investment</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=fitness" className={styles.calculatorButton}>
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
          <h2>Ready to Reduce Churn and Boost Retention?</h2>
          <p>Join fitness studios using milestone rewards, referral bonuses, and social engagement to keep members motivated.</p>
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
            name: "Fitness Studio Loyalty Program Software",
            description: "QR-based loyalty program for gyms and fitness studios. Reduce churn by 35% with anniversary milestones, referral rewards, and social engagement.",
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
              audienceType: "Gyms, Fitness Studios, Yoga Studios, CrossFit Boxes, Personal Trainers",
            },
          }),
        }}
      />
    </main>
  );
}
