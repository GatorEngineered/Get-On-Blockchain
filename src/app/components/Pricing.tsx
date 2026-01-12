export default function Pricing() {
  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Pricing</p>
          <h2>Pick A Plan That Pays For Itself.</h2>
          <p className="section-sub">
            Launch in days. Keep customers for months. All plans include a branded QR flow, simple
            dashboard, and ongoing support.
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
              <li>QR-based loyalty with points & rewards</li>
              <li>Redeem for free products/discounts</li>
              <li>1 location</li>
              <li>Basic dashboard</li>
              <li>Up to 5 active members</li>
              <li>1 reward in catalog</li>
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
              <li>Up to 3 rewards in catalog</li>
              <li>Full dashboard & analytics</li>
              <li>QR scan rewards for visits</li>
              <li>Email support</li>
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
              <li>Up to 7 rewards in catalog</li>
              <li>Stablecoin rewards (USDC)</li>
              <li>Blockchain-verified rewards</li>
              <li>Customer wallet setup</li>
              <li>Priority support &bull; 7-day free trial</li>
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
              <li>Up to 25 rewards in catalog</li>
              <li>All Premium features</li>
              <li>Custom loyalty tiers</li>
              <li>Multiple milestones</li>
              <li>Priority support &bull; 7-day free trial</li>
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
