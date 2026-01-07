import Link from 'next/link';

export const metadata = {
  title: 'FAQ - Get On Blockchain Documentation',
  description: 'Frequently asked questions about Get On Blockchain loyalty program.',
};

export default function FAQPage() {
  return (
    <article>
      <h1>Frequently Asked Questions</h1>
      <p>
        Find answers to common questions about Get On Blockchain. Can't find what you're looking
        for? <Link href="/dashboard/settings?tab=support">Contact our support team</Link>.
      </p>

      <h2>Getting Started</h2>

      <h3>How long does it take to set up?</h3>
      <p>
        Most businesses complete their setup in 15-30 minutes. You can start accepting members
        as soon as you generate your first QR code.
      </p>

      <h3>Do I need technical knowledge?</h3>
      <p>
        No! Get On Blockchain is designed to be user-friendly. Everything can be managed from
        your dashboard without any coding or technical expertise.
      </p>

      <h3>Can I try before I buy?</h3>
      <p>
        Yes! Every new account starts with a 7-day free trial of Premium features. After the
        trial, you can choose any plan including the free Starter plan.
      </p>

      <h2>Members & Points</h2>

      <h3>How do customers join my loyalty program?</h3>
      <p>
        Customers scan your QR code with their phone camera. They'll be taken to a quick signup
        page where they enter their email (and optionally name/phone). It takes about 30 seconds.
      </p>

      <h3>Can members earn points multiple times per day?</h3>
      <p>
        By default, members can only earn visit points once per day at each location. This
        prevents abuse while still rewarding genuine repeat visits.
      </p>

      <h3>What happens to points if a member loses their phone?</h3>
      <p>
        Points are tied to the member's email address, not their device. They can simply log
        in on any device to access their points balance.
      </p>

      <h3>Can I import existing customers?</h3>
      <p>
        Yes! You can import members via CSV file from your dashboard. Contact support for help
        with large imports.
      </p>

      <h2>Payments & Plans</h2>

      <h3>What payment methods do you accept?</h3>
      <p>
        We accept all major credit cards and PayPal for subscription payments. Payments are
        processed securely through PayPal.
      </p>

      <h3>Can I change my plan later?</h3>
      <p>
        Absolutely! You can upgrade or downgrade your plan at any time from the{' '}
        <Link href="/dashboard/settings?tab=plans">Plans</Link> page. Changes take effect
        immediately.
      </p>

      <h3>What happens if I exceed my member limit?</h3>
      <p>
        If you're approaching your member limit, you'll receive notifications. You can either
        upgrade to a higher plan or purchase additional member slots ($10 per 500 members).
      </p>

      <h3>Is there a contract or commitment?</h3>
      <p>
        No long-term contracts. All plans are month-to-month and you can cancel anytime. Annual
        plans offer a discount but can still be canceled (no refunds for unused months).
      </p>

      <h2>Payouts & Crypto</h2>

      <h3>What is USDC?</h3>
      <p>
        USDC (USD Coin) is a stablecoin—a cryptocurrency that's always worth $1 USD. Unlike
        Bitcoin or Ethereum, its value doesn't fluctuate, making it safe for rewards.
      </p>

      <h3>Do my customers need crypto knowledge?</h3>
      <p>
        Not at all! We create a custodial wallet for members automatically. They can claim
        rewards without understanding blockchain technology. For tech-savvy members, we also
        support external wallets.
      </p>

      <h3>How much does it cost to send payouts?</h3>
      <p>
        Transaction fees (gas) on Polygon are very low—typically less than $0.01 per payout.
        You'll need a small amount of MATIC in your wallet for these fees.
      </p>

      <h3>What if my wallet runs out of funds?</h3>
      <p>
        Members won't be able to claim payouts if your wallet is empty. Set up low balance
        alerts to get notified before this happens. Members can request to be notified when
        funds are available again.
      </p>

      <h3>Is crypto payout required?</h3>
      <p>
        No! USDC payouts are optional. You can run a traditional points-only program with
        in-store rewards if you prefer.
      </p>

      <h2>Technical Questions</h2>

      <h3>What blockchain do you use?</h3>
      <p>
        We use the Polygon network for all blockchain operations. Polygon is a fast, low-cost
        Ethereum scaling solution used by major companies.
      </p>

      <h3>Can I integrate with my POS system?</h3>
      <p>
        Yes! We support integrations with Square, Toast, Clover, and Shopify. Go to{' '}
        <Link href="/dashboard/settings?tab=pos-integrations">Settings → POS Integrations</Link>{' '}
        to connect your system.
      </p>

      <h3>Do you have an API?</h3>
      <p>
        API access is available on Pro plans. Contact support for API documentation.
      </p>

      <h3>Is my data secure?</h3>
      <p>
        Yes! We use industry-standard encryption (AES-256) for sensitive data, secure HTTPS
        connections, and follow best practices for data protection. Wallet private keys are
        encrypted and never exposed.
      </p>

      <h2>Staff & Permissions</h2>

      <h3>Can I add multiple staff members?</h3>
      <p>
        Yes! You can invite staff members to help manage your loyalty program. Each staff
        member gets their own login and customizable permissions.
      </p>

      <h3>What can staff members do?</h3>
      <p>
        You control what each staff member can access:
      </p>
      <ul>
        <li>View and manage members</li>
        <li>View reports and analytics</li>
        <li>Access business settings</li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>QR code isn't scanning</h3>
      <ul>
        <li>Ensure the QR code is printed clearly without distortion</li>
        <li>Make sure there's adequate lighting</li>
        <li>Try different phone camera apps</li>
        <li>Generate a new QR code if the current one is damaged</li>
      </ul>

      <h3>Member can't log in</h3>
      <ul>
        <li>Verify they're using the correct email address</li>
        <li>Have them try the "forgot password" option</li>
        <li>Check if the member account exists in your dashboard</li>
      </ul>

      <h3>Points not appearing</h3>
      <ul>
        <li>Wait a few minutes—points may take a moment to sync</li>
        <li>Check if they've already earned points today (daily limit)</li>
        <li>Verify the QR code is active and valid</li>
      </ul>

      <h2>Still Need Help?</h2>
      <p>
        Our support team is here to help! Visit the{' '}
        <Link href="/dashboard/settings?tab=support">Support page</Link> to:
      </p>
      <ul>
        <li>Submit a support ticket</li>
        <li>Email us at support@getonblockchain.com</li>
        <li>Use live chat (Mon-Fri, 9AM-5PM EST)</li>
      </ul>
    </article>
  );
}
