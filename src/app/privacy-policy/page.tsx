export const metadata = {
  title: "Privacy Policy | Get On Blockchain",
};

export default function PrivacyPolicy() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "800px" }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: January 17, 2026</p>

        <h2>1. Overview</h2>
        <p>
          This Privacy Policy explains how Get On Blockchain LLC (&quot;we&quot;, &quot;our&quot;,
          &quot;us&quot;) collects, uses, and protects information through the Get On
          Blockchain platform. We are committed to protecting your privacy and
          ensuring the security of your personal information.
        </p>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '1.5rem 0'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
            Our Commitment to Your Privacy
          </h3>
          <p style={{ margin: 0 }}>
            <strong>We do NOT sell, rent, or share member personally identifiable
            information (PII), merchant data, or wallet addresses with ANY third
            parties for marketing or commercial purposes.</strong> Your data is yours,
            and we treat it with the utmost respect and security.
          </p>
        </div>

        <h2>2. Information We Collect</h2>

        <h3>Member Information:</h3>
        <ul>
          <li>Name (first and last)</li>
          <li>Email address</li>
          <li>Phone number (optional)</li>
          <li>Password (encrypted)</li>
          <li>Loyalty program activity (points, rewards, tiers)</li>
          <li>Email notification preferences</li>
        </ul>

        <h3>Merchant Information:</h3>
        <ul>
          <li>Business name and contact details</li>
          <li>Login credentials (encrypted)</li>
          <li>Business address and location information</li>
          <li>Reward program configurations</li>
          <li>Staff account information</li>
          <li>Subscription and payment details</li>
        </ul>

        <h3>Wallet Information (Optional):</h3>
        <ul>
          <li>Polygon wallet addresses (for USDC payouts and branded token storage)</li>
          <li>Transaction records on the blockchain</li>
          <li>Payout history and amounts</li>
          <li>Wallet connection method (non-custodial external wallet or custodial)</li>
        </ul>

        <h3>Branded Token Information (Where Applicable):</h3>
        <ul>
          <li>Token balances and holdings</li>
          <li>Token transaction history (mints, burns, conversions)</li>
          <li>Token redemption records</li>
          <li>Conversion history (token to USDC)</li>
        </ul>

        <h3>Automatically Collected Information:</h3>
        <ul>
          <li>QR code scan activity and timestamps</li>
          <li>Device type, browser, and operating system</li>
          <li>IP address and approximate location</li>
          <li>Platform usage analytics</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and operate our loyalty platform services</li>
          <li>To process points, rewards, and tier status</li>
          <li>To facilitate USDC payouts to connected wallets</li>
          <li>To send transactional emails (account verification, password resets, payout notifications)</li>
          <li>To deliver merchant announcements and promotions (based on your preferences)</li>
          <li>To improve platform performance, security, and user experience</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2>4. Member PII Protection</h2>
        <p>
          <strong>We take extensive measures to protect member personally identifiable
          information:</strong>
        </p>
        <ul>
          <li>
            <strong>Email Privacy:</strong> Merchants cannot see or access member email
            addresses. All merchant-to-member communications are sent through our
            secure platform.
          </li>
          <li>
            <strong>Contact Protection:</strong> Member phone numbers and personal
            contact information are never shared with merchants.
          </li>
          <li>
            <strong>Display Names:</strong> Merchants only see anonymized member
            information (e.g., &quot;John S.&quot;) in their dashboards.
          </li>
          <li>
            <strong>No Data Export:</strong> Merchants cannot export or download
            member personal information.
          </li>
        </ul>

        <h2>5. What We NEVER Do</h2>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '1rem 0'
        }}>
          <ul style={{ margin: 0 }}>
            <li><strong>We NEVER sell member, merchant, or wallet data to third parties</strong></li>
            <li><strong>We NEVER share personal information for marketing purposes</strong></li>
            <li><strong>We NEVER provide member contact information to merchants</strong></li>
            <li><strong>We NEVER use your data for targeted advertising</strong></li>
            <li><strong>We NEVER share wallet addresses or cryptocurrency holdings</strong></li>
          </ul>
        </div>

        <h2>6. Data Sharing</h2>
        <p>
          We only share data with trusted service providers necessary to operate
          our platform:
        </p>
        <ul>
          <li><strong>Payment Processors:</strong> Stripe for subscription payments</li>
          <li><strong>Email Services:</strong> Resend for transactional and announcement emails</li>
          <li><strong>Blockchain Networks:</strong> Polygon network for USDC transactions</li>
          <li><strong>Hosting:</strong> Vercel for secure application hosting</li>
          <li><strong>Database:</strong> Neon for encrypted data storage</li>
        </ul>
        <p>
          These providers are contractually obligated to protect your data and use
          it only for the specific services they provide.
        </p>

        <h2>7. Wallet & Cryptocurrency Privacy</h2>
        <p>
          If you connect a cryptocurrency wallet:
        </p>
        <ul>
          <li>Your wallet address is stored securely and encrypted</li>
          <li>We never share your wallet address with merchants or third parties</li>
          <li>Blockchain transactions are public by nature, but we do not link
              your identity to transactions publicly</li>
          <li>You can disconnect your wallet at any time</li>
        </ul>

        <h3>Non-Custodial Wallets:</h3>
        <p>
          For users who connect their own external wallets:
        </p>
        <ul>
          <li>We only store your public wallet address, never your private keys</li>
          <li>We cannot access, control, or recover your wallet</li>
          <li>You maintain full control and responsibility for your wallet security</li>
          <li>Transaction signing occurs on your device, not our servers</li>
        </ul>

        <h3>Custodial Wallet Services (Where Applicable):</h3>
        <p>
          For users utilizing custodial wallet services:
        </p>
        <ul>
          <li>Wallet keys are generated and stored securely on our infrastructure</li>
          <li>We implement encryption and access controls to protect custodial wallets</li>
          <li>Custodial wallet data is not shared with merchants or third parties</li>
          <li>You may request migration to a non-custodial wallet at any time</li>
        </ul>

        <h3>Blockchain Data Visibility:</h3>
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '1rem 0'
        }}>
          <p style={{ margin: 0 }}>
            <strong>Important:</strong> Blockchain transactions are publicly visible
            on the Polygon network. While we do not publicly associate your identity
            with your wallet address, anyone with your wallet address can view your
            on-chain transaction history, token balances, and transfer activity on
            public block explorers (e.g., Polygonscan).
          </p>
        </div>

        <h2>8. Branded Token Data</h2>
        <p>
          For merchants and members participating in branded loyalty token programs:
        </p>
        <ul>
          <li>
            <strong>Token Contract Data:</strong> Branded token smart contracts are
            deployed on the public Polygon blockchain. Contract addresses, total supply,
            and transaction history are publicly visible.
          </li>
          <li>
            <strong>Merchant Token Data:</strong> We store merchant token configurations,
            branding assets, and program settings in our secure database.
          </li>
          <li>
            <strong>Member Token Balances:</strong> Your token balances are stored both
            in our database (for fast access) and on the blockchain (as the source of truth).
          </li>
          <li>
            <strong>No Identity Linking:</strong> We do not publicly associate your
            personal identity with your token holdings or transactions on the blockchain.
          </li>
        </ul>

        <h2>9. Email Preferences</h2>
        <p>
          Members have full control over email communications:
        </p>
        <ul>
          <li>System notifications (payout alerts, security alerts)</li>
          <li>Merchant promotional emails</li>
          <li>Merchant announcements</li>
          <li>Points and rewards updates</li>
          <li>Token balance and conversion notifications</li>
        </ul>
        <p>
          You can manage these preferences in your account settings at any time.
          All merchant emails include CAN-SPAM compliant unsubscribe links.
        </p>

        <h2>10. Data Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>SSL/TLS encryption for all data transmission</li>
          <li>Encrypted password storage using secure hashing algorithms</li>
          <li>Secure session management</li>
          <li>Regular security audits and monitoring</li>
          <li>Access controls and authentication requirements</li>
          <li>Hardware security modules (HSM) for custodial wallet key storage (where applicable)</li>
        </ul>

        <h2>11. Cookies & Tracking</h2>
        <p>
          We use essential cookies to:
        </p>
        <ul>
          <li>Maintain login sessions</li>
          <li>Remember user preferences</li>
          <li>Provide basic analytics for platform improvement</li>
        </ul>
        <p>
          We do not use third-party advertising cookies or tracking pixels.
        </p>

        <h2>12. Data Retention</h2>
        <p>
          We retain your data as long as your account remains active. Upon account
          deletion:
        </p>
        <ul>
          <li>Personal information is deleted within 30 days</li>
          <li>Blockchain transaction records remain on-chain (immutable and cannot be deleted)</li>
          <li>Token balances on the blockchain persist independently of our platform</li>
          <li>Aggregated, anonymized analytics may be retained</li>
        </ul>

        <h2>13. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your account and data</li>
          <li>Export your data in a portable format</li>
          <li>Opt out of non-essential communications</li>
          <li>Request information about your token holdings and transaction history</li>
        </ul>
        <p>
          <strong>Note:</strong> We cannot delete blockchain data. Token balances and
          transaction history recorded on the Polygon blockchain are immutable and
          will persist even after account deletion.
        </p>

        <h2>14. Children&apos;s Privacy</h2>
        <p>
          Our service is not intended for individuals under 18 years of age. We do
          not knowingly collect information from minors.
        </p>

        <h2>15. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify users
          of significant changes via email or platform notification.
        </p>

        <h2>16. Contact Us</h2>
        <p>
          For privacy questions, data requests, or concerns, contact us at:
        </p>
        <p>
          Email: <a href="mailto:support@getonblockchain.com">support@getonblockchain.com</a><br />
          Address: Get On Blockchain LLC<br />
          7901 N 4th Street Ste 300<br />
          St Petersburg, FL 33702, USA
        </p>
      </div>
    </main>
  );
}
