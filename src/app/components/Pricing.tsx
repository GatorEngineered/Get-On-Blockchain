const STARTER_CHECKOUT_URL =
  "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/jqJVj70MCkSd09LxmRgLeg2?ismsaljsauthenabled";

const SALES_PHONE_NUMBER = "+18134651195";

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
          {/* Starter */}
          <div className="pricing-card">
            <p className="pricing-pill">Starter</p>
            <h3>For Single-Location Shops</h3>
            <p className="pricing-price">$149<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup">+ $249 one-time setup</p>
            <ul className="pricing-list">
              <li>QR-based loyalty with points & simple perks</li>
              <li>1 merchant claim page (yourbrand.getonblockchain.com)</li>
              <li>Stablecoin payments (USDC) via one processor</li>
              <li>Basic analytics for scans, claims, and repeats</li>
              <li>Up to 1,500 active members</li>
            </ul>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                window.open(STARTER_CHECKOUT_URL, "_blank");
              }}
            >
              Get Started</button>
            <p className="pricing-footnote">Perfect for cafés, salons, boutiques.</p>
          </div>

          {/* Growth */}
          <div className="pricing-card highlight">
            <p className="pricing-pill">Growth · Most popular</p>
            <h3>For Growing Brands</h3>
            <p className="pricing-price">$249<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup">+ $349 one-time setup</p>
            <ul className="pricing-list">
              <li>Up to 3 locations</li>
              <li>QR scan rewards for visits</li>
              <li>Email login + wallet-based rewards (custodial wallet included)</li>
              <li>You choose the stablecoin and wallet flow per business</li>
              <li>3 merchant claim pages (yourbrand.getonblockchain.com)</li>
              <li>5 custom points rules for visits, referrals, or spend tiers</li>
              <li>Up to 15,000 active members & priority email support</li>
            </ul>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                window.location.href = "https://outlook.office.com/book/RewardLoyaltyProgramCustomMade@gatorengineered.com/s/Oy7TZYG86EGPh2CWLbCbxw2?ismsaljsauthenabled";
              }}
            >
              Book A Demo
            </button>
            <p className="pricing-footnote">Best value for multi-location and online brands.</p>
          </div>

          {/* Pro */}
          <div className="pricing-card">
            <p className="pricing-pill">Pro / Brand</p>
            <h3>For Franchises & Launches</h3>
            <p className="pricing-price">From $349<span className="pricing-price-suffix">/mo</span></p>
            <p className="pricing-setup">+ $449 setup (or custom quote if complex)</p>
            <ul className="pricing-list">
              <li>Everything in Growth</li>
              <li>White-label portal & API access</li>
              <li>Multi-location dashboards & user roles</li>
              <li>Advanced reporting and data export</li>
              <li>POS/ERP integration support</li>
              <li>Quarterly strategy reviews</li>
            </ul>
            <button className="btn btn-secondary btn-full"
              onClick={() => {
                window.location.href = `tel:${SALES_PHONE_NUMBER}`;
              }}>
              Talk To Sales</button>
            <p className="pricing-footnote">Tailored scope, quoted after discovery.</p>
          </div>
        </div>

        <div className="pricing-extra">
          <p>
            Need something lighter?{" "}
            <span className="pricing-extra-highlight">
              Per-claim pricing is available for micro-shops on request.
            </span>
          </p>
          <p className="pricing-extra-note">
            Taxes, card/processor fees, and any on-chain gas costs (when used) are separate.
          </p>
        </div>
      </div>
    </section>
  );
}
