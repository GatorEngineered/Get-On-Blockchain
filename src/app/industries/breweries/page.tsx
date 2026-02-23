// src/app/industries/breweries/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../industry.module.css";

export const metadata: Metadata = {
  title: "Brewery & Bar Loyalty Program | Drive Repeat Visits",
  description:
    "Boost repeat visits by 30% with our QR-based loyalty program for breweries and bars. Happy hour multipliers, social engagement, referral rewards. Integrates with Square, Toast & Clover. Starting at $55/month.",
  keywords: [
    "brewery loyalty program",
    "bar rewards program",
    "taproom loyalty",
    "brewery customer retention",
    "bar repeat customers",
    "QR code loyalty bar",
    "brewery rewards software",
    "happy hour loyalty program",
    "craft brewery loyalty",
    "wine bar rewards",
  ],
  openGraph: {
    title: "Brewery & Bar Loyalty Program That Keeps Regulars Coming Back",
    description: "Turn casual visitors into regulars with happy hour multipliers, social engagement rewards, and POS-integrated loyalty for breweries and bars.",
    url: "https://getonblockchain.com/industries/breweries",
  },
};

const breweryBenefits = [
  {
    icon: "🍺",
    title: "Happy Hour Multipliers",
    description: "Offer 2x-3x points during slow periods. Turn quiet Tuesday nights into packed taprooms. You control when and how much.",
  },
  {
    icon: "📱",
    title: "Social Engagement Rewards",
    description: "Points for check-ins, tagging your venue, sharing photos, and leaving reviews. Turn every visit into free marketing.",
  },
  {
    icon: "🔗",
    title: "POS Integration Built In",
    description: "Connect Square, Toast, or Clover to automatically award points on every tab. No extra steps for your bartenders.",
  },
  {
    icon: "📣",
    title: "Referral-Powered Growth",
    description: "Regulars earn bonus points for bringing friends. The best brewery marketing is word of mouth — now you can reward it.",
  },
];

const useCases = [
  {
    scenario: "Craft Brewery / Taproom",
    example: "Happy hour multipliers drive midweek traffic. Earn points per pint, bonus for new releases. Referral rewards build your community.",
  },
  {
    scenario: "Sports Bar",
    example: "Game day specials with 2x points. Social engagement rewards for check-ins. Birthday celebrations with bonus points all week.",
  },
  {
    scenario: "Wine Bar",
    example: "Points per glass or bottle. Anniversary rewards for loyal members. Branded token on Growth plan for your own loyalty currency.",
  },
  {
    scenario: "Cocktail Lounge",
    example: "VIP tier rewards for top spenders. Slow-night multipliers fill seats. Square POS tracks every tab automatically.",
  },
];

const platformFeatures = [
  { icon: "🕐", title: "Happy Hour Points", desc: "2x-3x multipliers during slow periods" },
  { icon: "🎂", title: "Birthday Rewards", desc: "Auto-trigger bonus points on birthdays" },
  { icon: "📱", title: "Social Engagement", desc: "Points for check-ins, tags, and reviews" },
  { icon: "📣", title: "Referral System", desc: "Regulars earn for bringing new customers" },
  { icon: "💍", title: "Anniversary Rewards", desc: "Celebrate patron relationship milestones" },
  { icon: "🪙", title: "Branded Token", desc: "Your own loyalty currency on Growth plan" },
  { icon: "🎯", title: "Custom Points Rules", desc: "Set rules per drink type or event" },
  { icon: "💸", title: "Crypto Payouts", desc: "Let patrons redeem points as USDC" },
];

const integrations = ["Square", "Toast", "Clover"];

export default function BreweriesPage() {
  return (
    <main className={styles.industryPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Brewery & Bar Loyalty That<br />
            <span className={styles.highlight}>Keeps the Regulars Coming Back</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Happy hour multipliers fill slow nights. Social engagement turns every visit into free marketing.
            POS integration means zero extra work for your bartenders. Build a loyal community that keeps your taps flowing.
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
            ✓ Happy hour multipliers ✓ Integrates with Square, Toast & Clover ✓ Starting at $55/month
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.sectionTitle}>Why Breweries & Bars Love Get On Blockchain</h2>
          <div className={styles.benefitsGrid}>
            {breweryBenefits.map((benefit, index) => (
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
          <h2 className={styles.sectionTitle}>Powerful Features for Breweries & Bars</h2>
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
            Automatically award points on every tab — no extra work for your bartenders
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
          <h2 className={styles.sectionTitle}>Perfect for Every Bar & Brewery</h2>
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
              <p>Link Square, Toast, or Clover in one click. Or display a QR code at the bar — patrons scan with their phone camera.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Patrons Earn Points Automatically</h3>
              <p>Points on every tab, happy hour multipliers, birthday bonuses, referral rewards. You set the rules for your venue.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Claim Rewards & Come Back</h3>
              <p>Patrons redeem for free drinks, discounts, merch, or USDC payouts. They come back with friends to earn more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.roiSection}>
        <div className={styles.roiInner}>
          <h2 className={styles.sectionTitle}>Real ROI for Breweries & Bars</h2>
          <div className={styles.roiCard}>
            <div className={styles.roiStats}>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>80</span>
                <span className={styles.roiLabel}>Daily Patrons</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>25%</span>
                <span className={styles.roiLabel}>Visit More Often</span>
              </div>
              <div className={styles.roiStat}>
                <span className={styles.roiNumber}>$30</span>
                <span className={styles.roiLabel}>Avg Tab</span>
              </div>
            </div>
            <div className={styles.roiCalculation}>
              <p><strong>Your Math:</strong></p>
              <p>20 extra visits/day × $30 average tab = $600/day</p>
              <p>$600/day × 30 days = <strong>$18,000/month in additional revenue</strong></p>
              <p className={styles.roiHighlight}>120x return on a $149/month Premium plan</p>
            </div>
            <div className={styles.calculatorCta}>
              <Link href="/roi-calculator?industry=breweries" className={styles.calculatorButton}>
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
          <h2>Ready to Build a Community of Regulars?</h2>
          <p>Join breweries and bars using happy hour multipliers, referral rewards, and POS integration to drive repeat visits.</p>
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
            name: "Brewery & Bar Loyalty Program Software",
            description: "QR-based loyalty program for breweries and bars with Square, Toast & Clover POS integration. Happy hour multipliers, social engagement, and referral rewards.",
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
              audienceType: "Breweries, Taprooms, Bars, Wine Bars, Cocktail Lounges",
            },
          }),
        }}
      />
    </main>
  );
}
