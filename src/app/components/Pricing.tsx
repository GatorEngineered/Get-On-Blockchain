export default function Pricing() {
  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Pricing</p>
          <h2>Pick A Plan That Pays For Itself.</h2>
          <p className="section-sub">
            Launch in days. Keep customers for months. All plans include unlimited rewards,
            points that never expire, referral tracking, and member tiers.
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

          {/* Basic Tier - $49/month */}
          <div className="pricing-card">
            <p className="pricing-pill">Basic</p>
            <h3>For Single-Location Shops</h3>
            <p className="pricing-price">$49<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 150 active members</li>
              <li>1 location</li>
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
            <p className="pricing-footnote">Perfect for small businesses starting their loyalty program.</p>
          </div>

          {/* Premium Tier - $99/month */}
          <div className="pricing-card highlight">
            <p className="pricing-pill">Premium · Most popular</p>
            <h3>Blockchain-Verified Rewards</h3>
            <p className="pricing-price">$99<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 500 active members</li>
              <li>Up to 3 locations</li>
              <li>Unlimited rewards catalog</li>
              <li>Direct member messaging</li>
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
            <p className="pricing-footnote">Best for forward-thinking businesses ready to stand out.</p>
          </div>

          {/* Growth Tier - $149/month */}
          <div className="pricing-card">
            <p className="pricing-pill">Growth</p>
            <h3>For Growing Brands</h3>
            <p className="pricing-price">$149<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup"></p>
            <ul className="pricing-list">
              <li>Up to 2,000 active members</li>
              <li>Up to 10 locations</li>
              <li>Unlimited rewards catalog</li>
              <li>All Premium features</li>
              <li>Custom tier thresholds</li>
              <li>Multiple milestones</li>
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
            <p className="pricing-footnote">Scale your loyalty program with more members and locations.</p>
          </div>
        </div>

        <div className="pricing-extra">
          <p className="pricing-extra-note">
            All paid plans include a 7-day free trial. Cancel anytime. Save 2 months with annual billing.
          </p>
        </div>
      </div>
    </section>
  );
}
