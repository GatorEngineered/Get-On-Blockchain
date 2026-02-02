export default function Pricing() {
  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Pricing</p>
          <h2>The First Blockchain-Powered Loyalty Platform.</h2>
          <p className="section-sub">
            Launch in days. Keep customers for months. All plans include unlimited rewards,
            points that never expire, referral tracking, and member tiers. Scale to any size.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Starter Tier - $0/month */}
          <div className="pricing-card">
            <p className="pricing-pill">Starter</p>
            <h3>Try It Free</h3>
            <p className="pricing-price">$0<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 5 active members</li>
              <li>1 location</li>
              <li>Unlimited rewards catalog</li>
              <li>Points never expire</li>
              <li>QR-based loyalty</li>
              <li>Basic dashboard</li>
            </ul>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => {
                window.location.href = "/business/register";
              }}
            >
              Start Free
            </button>
            <p className="pricing-footnote">Perfect for testing the waters before you commit.</p>
          </div>

          {/* Basic Tier - $55/month */}
          <div className="pricing-card">
            <p className="pricing-pill">Basic</p>
            <h3>For Growing Businesses</h3>
            <p className="pricing-price">$55<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 1,000 active members</li>
              <li>Unlimited locations</li>
              <li>Unlimited rewards catalog</li>
              <li>Points never expire</li>
              <li>Member tiers &bull; Referrals</li>
              <li>Email announcements</li>
              <li>Points reminder emails</li>
              <li>7-day free trial</li>
            </ul>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              Get Started
            </button>
            <p className="pricing-footnote">Simple loyalty rewards for any size business.</p>
          </div>

          {/* Premium Tier - $149/month */}
          <div className="pricing-card highlight">
            <p className="pricing-pill">Premium · Most popular</p>
            <h3>Blockchain-Verified Rewards</h3>
            <p className="pricing-price">$149<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 25,000 active members</li>
              <li>Unlimited locations</li>
              <li>All Basic features</li>
              <li>Direct member messaging</li>
              <li>POS integration &bull; Points/dollar</li>
              <li>USDC payouts on Polygon</li>
              <li>Blockchain-verified rewards</li>
              <li>Priority support &bull; 7-day trial</li>
            </ul>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              Get Started
            </button>
            <p className="pricing-footnote">Real crypto rewards that customers can trust.</p>
          </div>

          {/* Growth Tier - $249/month */}
          <div className="pricing-card">
            <p className="pricing-pill">Growth</p>
            <h3>Your Own Branded Token</h3>
            <p className="pricing-price">$249<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 100,000 active members</li>
              <li>Unlimited locations</li>
              <li>All Premium features</li>
              <li>Custom branded loyalty token</li>
              <li>Non-custodial member wallets</li>
              <li>1M token supply</li>
              <li>Advanced analytics</li>
              <li>Bulk email campaigns</li>
              <li>7-day free trial</li>
            </ul>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              Get Started
            </button>
            <p className="pricing-footnote">Launch your own branded cryptocurrency token.</p>
          </div>
        </div>

        <div className="pricing-extra">
          <p className="pricing-extra-note">
            All paid plans include a 7-day free trial. Cancel anytime. Save 2 months with annual billing.
            Need enterprise scale or custom tokens? <a href="mailto:support@getonblockchain.com">Contact us</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
