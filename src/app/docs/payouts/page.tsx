import Link from 'next/link';

export const metadata = {
  title: 'Payout System - Get On Blockchain Documentation',
  description: 'Learn how to set up USDC crypto payouts for your loyalty program members.',
};

export default function PayoutsPage() {
  return (
    <article>
      <h1>Payout System Guide</h1>
      <p>
        One of Get On Blockchain's unique features is the ability to reward members with real
        cryptocurrency (USDC) instead of traditional points-only rewards. This guide explains
        how the payout system works.
      </p>

      <div className="tip">
        <strong>What is USDC?</strong> USDC (USD Coin) is a stablecoin cryptocurrency that's
        always worth $1 USD. It's a safe, transparent way to give your customers real value.
      </div>

      <h2>How Payouts Work</h2>
      <p>
        Here's the flow of a typical payout:
      </p>
      <ol>
        <li>Member earns points through visits or purchases</li>
        <li>Member reaches the payout threshold (e.g., 100 points)</li>
        <li>Member requests a payout from their member portal</li>
        <li>System sends USDC from your wallet to their wallet</li>
        <li>Points are deducted from their balance</li>
      </ol>

      <h2 id="wallet">Setting Up Your Payout Wallet</h2>
      <p>
        Before you can offer USDC payouts, you need to set up and fund a payout wallet.
      </p>

      <h3>Step 1: Enable Payouts</h3>
      <ol>
        <li>Go to <Link href="/dashboard/settings?tab=payout-wallet">Settings → Payout Wallet</Link></li>
        <li>Toggle "Enable USDC Payouts"</li>
        <li>A new wallet will be automatically generated for you</li>
      </ol>

      <h3>Step 2: Fund Your Wallet</h3>
      <p>
        Your payout wallet needs to contain:
      </p>
      <ul>
        <li><strong>USDC:</strong> The stablecoin you'll pay out to members</li>
        <li><strong>MATIC:</strong> A small amount for transaction fees (gas)</li>
      </ul>

      <p>To fund your wallet:</p>
      <ol>
        <li>Copy your wallet address from the settings page</li>
        <li>Purchase USDC from an exchange (Coinbase, Binance, etc.)</li>
        <li>Send USDC to your wallet address on the <strong>Polygon network</strong></li>
        <li>Send a small amount of MATIC (~$5-10 worth) for gas fees</li>
      </ol>

      <div className="warning">
        <strong>Important:</strong> Always send to the Polygon network, not Ethereum mainnet.
        Sending to the wrong network may result in lost funds.
      </div>

      <h3>Step 3: Configure Payout Settings</h3>
      <p>
        Customize your payout rules:
      </p>
      <ul>
        <li><strong>Milestone Points:</strong> How many points needed for a payout (e.g., 100 points)</li>
        <li><strong>Payout Amount:</strong> How much USDC to pay per milestone (e.g., $5)</li>
        <li><strong>Low Balance Alert:</strong> Get notified when your wallet is running low</li>
      </ul>

      <h2 id="usdc">Member Payout Experience</h2>
      <p>
        From the member's perspective, claiming a payout is simple:
      </p>
      <ol>
        <li>Log in to their member portal</li>
        <li>Reach the required points threshold</li>
        <li>Click "Claim Payout"</li>
        <li>Connect or provide their crypto wallet address</li>
        <li>Confirm the transaction</li>
        <li>Receive USDC within minutes</li>
      </ol>

      <h3>Member Wallet Options</h3>
      <p>
        Members can receive payouts to:
      </p>
      <ul>
        <li><strong>Custodial Wallet:</strong> We create a wallet for them automatically</li>
        <li><strong>External Wallet:</strong> They can connect MetaMask, Coinbase Wallet, etc.</li>
      </ul>

      <h2>Monitoring Your Wallet</h2>
      <p>
        Keep your payout system running smoothly:
      </p>
      <ul>
        <li><strong>Check Balance Regularly:</strong> View your current balance in the dashboard</li>
        <li><strong>Set Up Alerts:</strong> Configure low balance email notifications</li>
        <li><strong>View Transaction History:</strong> Track all outgoing payouts</li>
      </ul>

      <h3>Low Balance Alerts</h3>
      <p>
        Set a threshold for low balance alerts in your settings. When your USDC balance drops
        below this amount, you'll receive an email reminder to top up.
      </p>

      <div className="tip">
        <strong>Recommendation:</strong> Keep at least 2 weeks worth of expected payouts in your
        wallet to ensure uninterrupted service.
      </div>

      <h2>Multiple Payout Milestones</h2>
      <p>
        On Growth and Pro plans, you can set up multiple payout milestones:
      </p>
      <ul>
        <li>100 points → $5 USDC</li>
        <li>250 points → $15 USDC</li>
        <li>500 points → $35 USDC</li>
      </ul>

      <p>
        This gives members more options and encourages continued engagement.
      </p>

      <h2>Security Considerations</h2>
      <ul>
        <li>Your wallet's private key is encrypted and securely stored</li>
        <li>Only you can initiate manual withdrawals</li>
        <li>Automatic payouts are limited to member-initiated claims</li>
        <li>All transactions are logged for audit purposes</li>
        <li>Daily payout limits protect against abuse</li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>Payout Failed</h3>
      <p>
        If a payout fails, check:
      </p>
      <ul>
        <li>Sufficient USDC balance in your wallet</li>
        <li>Sufficient MATIC for gas fees</li>
        <li>Valid member wallet address</li>
        <li>Network congestion (retry later)</li>
      </ul>

      <h3>Member Can't Claim</h3>
      <p>
        If a member reports they can't claim:
      </p>
      <ul>
        <li>Verify they've reached the points threshold</li>
        <li>Check if they've set up a wallet address</li>
        <li>Ensure your payout wallet is funded</li>
      </ul>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/members">Member Management Guide</Link> - Manage your loyalty members</li>
        <li><Link href="/docs/faq">FAQ</Link> - Common questions about payouts</li>
      </ul>
    </article>
  );
}
