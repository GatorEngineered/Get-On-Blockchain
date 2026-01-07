// src/app/faq/page.tsx
import type { Metadata } from "next";
import styles from "./faq.module.css";

export const metadata: Metadata = {
  title: "FAQ - Loyalty Program Questions | Get On Blockchain",
  description:
    "Common questions about our loyalty rewards platform: pricing, ROI, crypto payments, implementation, and how to increase repeat customers and foot traffic.",
  keywords: [
    "loyalty program FAQ",
    "customer retention questions",
    "loyalty program ROI",
    "crypto rewards questions",
    "USDC payment FAQ",
    "repeat customer strategies",
  ],
  openGraph: {
    title: "Frequently Asked Questions - Loyalty Rewards Platform",
    description: "Get answers about implementing a loyalty program that increases foot traffic and repeat customers",
    url: "https://getonblockchain.com/faq",
  },
};

type FAQItem = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FAQItem[] = [
  {
    category: "ROI & Results",
    question: "What kind of ROI can I expect from a loyalty program?",
    answer:
      "Most businesses see a 15-25% increase in repeat visits within 3-6 months. If you have 50 daily customers and 20% become regulars visiting twice as often, that's 10+ extra visits per day. At a $15 average transaction, that's $4,500+ in additional monthly revenue - a 45x return on a $99/month plan.",
  },
  {
    category: "ROI & Results",
    question: "How quickly will I see more returning customers?",
    answer:
      "Most businesses notice an uptick in repeat visits within 2-4 weeks of promoting their rewards program. The key is actively mentioning it at checkout and displaying QR codes prominently. Customers love earning rewards - you just need to remind them it exists.",
  },
  {
    category: "ROI & Results",
    question: "Will this actually increase my foot traffic?",
    answer:
      "Yes! Loyalty programs create a compelling reason for customers to return. When customers know they're earning toward a $5 reward or exclusive perk, they're significantly more likely to choose your business over competitors. Many local businesses see foot traffic increase by 20-40% after launching an active rewards program.",
  },
  {
    category: "Getting Started",
    question: "Do I need any special equipment or hardware?",
    answer:
      "No! Our QR-based system works with what you already have. Simply print your unique QR code on receipts, display it at checkout, or share the link digitally. Customers scan with their phone camera - no app download required, no special hardware needed.",
  },
  {
    category: "Getting Started",
    question: "How long does implementation take?",
    answer:
      "Most businesses are up and running in under 30 minutes. After signing up, you'll configure your rewards (points per visit, welcome bonus, etc.), download your QR code, and you're live. We provide simple instructions for printing the QR on receipts or creating a table tent.",
  },
  {
    category: "Getting Started",
    question: "Do my customers need to download an app?",
    answer:
      "Absolutely not! Customers simply scan your QR code with their phone camera - the same way they scan to view a restaurant menu. No app downloads, no friction. They register once with their email and start earning rewards immediately.",
  },
  {
    category: "Pricing & Plans",
    question: "What's the difference between Basic and Premium plans?",
    answer:
      "Basic ($49/mo) offers points-based rewards where customers redeem for free products or discounts you define. Premium ($99/mo) adds stablecoin payouts - you fund a wallet and customers can claim $5 in USDC cryptocurrency when they hit 100 points. Premium creates more excitement because rewards feel like real money.",
  },
  {
    category: "Pricing & Plans",
    question: "Can I try it before committing to a monthly plan?",
    answer:
      "Yes! We offer a demo walkthrough and can set up a test environment for your business. Book a call with our team to see the platform in action and test the customer experience before making a decision.",
  },
  {
    category: "Pricing & Plans",
    question: "Are there any setup fees or hidden costs?",
    answer:
      "No setup fees, no hidden costs. You pay the monthly plan price ($49 for Basic, $99 for Premium). For Premium plan, you also fund your own payout wallet with USDC (like loading a gift card balance) - but that money goes directly to your customers as rewards, not to us.",
  },
  {
    category: "Crypto & Payments",
    question: "Do I need to understand cryptocurrency to use this?",
    answer:
      "Not at all! We handle all the blockchain complexity behind the scenes. For the Basic plan, it's 100% points-based (no crypto involved). For Premium, we guide you through a one-time wallet setup (takes 5 minutes), and after that, payouts happen automatically when customers claim rewards.",
  },
  {
    category: "Crypto & Payments",
    question: "What is USDC and why offer it as a reward?",
    answer:
      "USDC is a stablecoin - a digital dollar that's always worth $1. Unlike Bitcoin or Ethereum, it doesn't fluctuate. When you reward customers with $5 USDC, it's like giving them $5 cash that lives in their digital wallet. It's exciting, modern, and makes your rewards feel more valuable than traditional points.",
  },
  {
    category: "Crypto & Payments",
    question: "Can customers cash out USDC to real dollars?",
    answer:
      "Yes! USDC can be converted to USD through exchanges like Coinbase, or spent directly at thousands of merchants. Many customers also choose to hold it as savings or use it for online purchases. The flexibility makes it more appealing than store-only points.",
  },
  {
    category: "Crypto & Payments",
    question: "How do I fund the payout wallet for rewards?",
    answer:
      "For Premium plan, you'll create a wallet and fund it with USDC using a service like Coinbase. Think of it like loading a gift card balance - you put in $500 of USDC, and as customers claim rewards, that balance goes down. We'll send you alerts when it's time to refill so you never run out.",
  },
  {
    category: "Customer Experience",
    question: "How do customers claim their rewards?",
    answer:
      "It's simple: Customer scans your QR code → Earns points for their visit → When they hit the milestone (ex: 100 points), they click 'Claim Reward' → For Premium plan, $5 USDC is sent to their wallet instantly. For Basic plan, they show you their redemption screen and you honor the reward (free coffee, 10% off, etc.).",
  },
  {
    category: "Customer Experience",
    question: "What if a customer doesn't have a crypto wallet?",
    answer:
      "No problem! Customers can use email-only mode to track points without a wallet. They just provide their email when they first scan your QR code. For Premium plan, if they want to claim USDC rewards later, they can connect a wallet at any time - their points are saved.",
  },
  {
    category: "Customer Experience",
    question: "Can customers use their rewards at multiple businesses?",
    answer:
      "Each business has its own separate rewards profile. If a customer visits multiple businesses using our platform, they'll have separate point balances for each. This keeps your rewards program independent and under your control.",
  },
  {
    category: "Management & Analytics",
    question: "How do I track customer activity and ROI?",
    answer:
      "Your merchant dashboard shows real-time analytics: total members, visit frequency, points earned/redeemed, and reward claims. You can see which customers are your top visitors and track how many new vs. returning customers you have each week.",
  },
  {
    category: "Management & Analytics",
    question: "Can I customize the points and rewards?",
    answer:
      "Absolutely! You control: points per visit, welcome bonus for new members, milestone for rewards (default: 100 points = $5), and reward amount. Want to do 50 points = $3? Or 200 points = $10? You set the rules that make sense for your business.",
  },
  {
    category: "Management & Analytics",
    question: "What if I want to change my reward structure later?",
    answer:
      "You can adjust your rewards settings anytime from your dashboard. Changes apply to new activity going forward - existing customer balances stay the same. This flexibility lets you experiment to find what drives the most repeat visits.",
  },
  {
    category: "Support & Security",
    question: "What if I need help or have technical issues?",
    answer:
      "All plans include email support (responses within 24 hours). Premium plan customers get priority support with faster response times. We also provide setup guides, video tutorials, and best practices for promoting your rewards program.",
  },
  {
    category: "Support & Security",
    question: "Is customer data secure?",
    answer:
      "Yes. We encrypt all sensitive data, including wallet information and customer emails. We're GDPR and CCPA compliant. Your customer data belongs to you - we never sell or share it with third parties.",
  },
  {
    category: "Support & Security",
    question: "What happens if I cancel my subscription?",
    answer:
      "You can cancel anytime - no contracts or termination fees. Your customer data remains accessible for 30 days after cancellation so you can export it. If you're on Premium plan, any remaining USDC in your payout wallet stays yours - just withdraw it back to your personal wallet.",
  },
];

// Group FAQs by category
const categories = Array.from(new Set(faqs.map((f) => f.category)));

export default function FAQPage() {
  return (
    <main className={styles.faqPage}>
      <section className={styles.faqHero}>
        <div className={styles.faqHeroInner}>
          <h1>Frequently Asked Questions</h1>
          <p>
            Everything you need to know about our loyalty rewards platform,
            increasing foot traffic, and maximizing customer retention.
          </p>
        </div>
      </section>

      <section className={styles.faqContent}>
        <div className={styles.faqContentInner}>
          {categories.map((category) => (
            <div key={category} className={styles.faqCategory}>
              <h2 className={styles.faqCategoryTitle}>{category}</h2>
              <div className={styles.faqList}>
                {faqs
                  .filter((faq) => faq.category === category)
                  .map((faq, index) => (
                    <details key={index} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {faq.question}
                      </summary>
                      <p className={styles.faqAnswer}>{faq.answer}</p>
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Structured Data for SEO/AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((faq) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
              },
            })),
          }),
        }}
      />
    </main>
  );
}
