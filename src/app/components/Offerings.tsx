export default function Offerings() {
  return (
    <section className="section offerings" id="offerings">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">What you can offer</p>
          <h2>Rewards, Access, And Payments—On One Modern Rail.</h2>
          <p className="section-sub">
            Start with simple points and stablecoin payments. Add VIP passes, exclusive content, and
            branded tokens as you grow.
          </p>
        </div>

        <div className="offerings-grid">
          <div className="off-card">
            <h3>Stablecoin Payments</h3>
            <p>
              Accept USDC and other stablecoins with clear pricing and no surprise chargebacks. Keep
              it in crypto or auto-convert to cash.
            </p>
          </div>
          <div className="off-card">
            <h3>Repeat-Buyer Points</h3>
            <p>
              Reward every visit or purchase with points that unlock discounts, freebies, or early
              access to new products.
            </p>
          </div>
          <div className="off-card">
            <h3>VIP & High-Spender Perks</h3>
            <p>
              Give your best customers a VIP lane: higher rewards, private menus, priority booking,
              and surprise drops.
            </p>
          </div>
          <div className="off-card">
            <h3>Branded VIP Passes</h3>
            <p>
              Offer on-chain badges or passes that unlock members-only pages, hidden menus,
              experiences, or events.
            </p>
          </div>
          <div className="off-card">
            <h3>Birthday & Special Dates</h3>
            <p>
              Automate birthday treats, anniversary rewards, and “we miss you” campaigns to bring
              customers back.
            </p>
          </div>
          <div className="off-card">
            <h3>Analytics You Can Act On</h3>
            <p>
              See scans, redemptions, repeat rates, and high-value customers so you can double down
              on what works.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
