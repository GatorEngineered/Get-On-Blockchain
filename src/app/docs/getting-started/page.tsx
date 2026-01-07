import Link from 'next/link';

export const metadata = {
  title: 'Getting Started - Get On Blockchain Documentation',
  description: 'Learn how to set up your blockchain-powered loyalty program with Get On Blockchain.',
};

export default function GettingStartedPage() {
  return (
    <article>
      <h1>Getting Started with Get On Blockchain</h1>
      <p>
        Welcome to Get On Blockchain! This guide will walk you through setting up your
        blockchain-powered loyalty program in just a few minutes.
      </p>

      <div className="tip">
        <strong>Quick Tip:</strong> Most businesses are up and running within 15 minutes.
        Follow these steps and you'll be rewarding customers in no time!
      </div>

      <h2 id="setup">Initial Setup</h2>
      <p>
        After creating your account, you'll be taken to your merchant dashboard. Here's what
        you need to do first:
      </p>

      <div className="step">
        <div className="stepNumber">1</div>
        <div className="stepContent">
          <h4>Complete Your Business Profile</h4>
          <p>
            Go to <Link href="/dashboard/settings?tab=account">Settings → Account</Link> and fill in
            your business information including name, address, and contact details.
          </p>
        </div>
      </div>

      <div className="step">
        <div className="stepNumber">2</div>
        <div className="stepContent">
          <h4>Configure Your Points System</h4>
          <p>
            Set up how members earn and redeem points. By default, members earn 10 points per
            visit, but you can customize this in <Link href="/dashboard/settings?tab=reward-tiers">Settings → Reward Tiers</Link>.
          </p>
        </div>
      </div>

      <div className="step">
        <div className="stepNumber">3</div>
        <div className="stepContent">
          <h4>Create Your Rewards Catalog</h4>
          <p>
            Add rewards that members can redeem their points for. This could be discounts,
            free items, or even USDC crypto payouts. Go to <Link href="/dashboard/settings?tab=rewards">Settings → Rewards Catalog</Link>.
          </p>
        </div>
      </div>

      <div className="step">
        <div className="stepNumber">4</div>
        <div className="stepContent">
          <h4>Generate Your QR Code</h4>
          <p>
            Print and display your QR code at your business location. Customers scan this
            to join and earn points.
          </p>
        </div>
      </div>

      <h2 id="qr-codes">Setting Up QR Codes</h2>
      <p>
        QR codes are the primary way customers interact with your loyalty program. When scanned,
        they allow customers to:
      </p>
      <ul>
        <li>Join your loyalty program instantly</li>
        <li>Check in and earn points on each visit</li>
        <li>View their points balance and rewards</li>
      </ul>

      <h3>Generating Your QR Code</h3>
      <ol>
        <li>Navigate to <Link href="/dashboard/settings?tab=qr-codes">Settings → QR Codes</Link></li>
        <li>Click "Generate New QR Code"</li>
        <li>Download the high-resolution image</li>
        <li>Print and display at your checkout counter</li>
      </ol>

      <div className="tip">
        <strong>Pro Tip:</strong> Place your QR code where customers naturally wait, like at the
        register or on tables. Include a brief message like "Scan to earn rewards!"
      </div>

      <h2>Choosing Your Plan</h2>
      <p>
        Get On Blockchain offers several plans to fit your business needs:
      </p>
      <ul>
        <li><strong>Starter (Free):</strong> Up to 100 members, basic features</li>
        <li><strong>Basic ($19/mo):</strong> Up to 500 members, email marketing</li>
        <li><strong>Premium ($39/mo):</strong> Up to 2,000 members, USDC payouts, priority support</li>
        <li><strong>Growth ($79/mo):</strong> Up to 10,000 members, custom tiers, advanced analytics</li>
        <li><strong>Pro ($149/mo):</strong> Unlimited members, white-label, API access</li>
      </ul>

      <p>
        Start with a 7-day free trial of Premium features, then choose the plan that works best
        for your business size.
      </p>

      <h2>Next Steps</h2>
      <p>
        Now that you're set up, explore these guides to get the most out of your loyalty program:
      </p>
      <ul>
        <li><Link href="/docs/members">Member Management Guide</Link> - Learn how to manage and engage your members</li>
        <li><Link href="/docs/payouts">Payout System Guide</Link> - Set up USDC crypto payouts for your members</li>
        <li><Link href="/docs/faq">FAQ</Link> - Answers to common questions</li>
      </ul>

      <div className="warning">
        <strong>Need Help?</strong> Our support team is here to assist you. Visit the{' '}
        <Link href="/dashboard/settings?tab=support">Support page</Link> to contact us or check
        our FAQ for quick answers.
      </div>
    </article>
  );
}
