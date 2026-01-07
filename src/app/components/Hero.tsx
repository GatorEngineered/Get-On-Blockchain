import Link from "next/link";

export default function Hero() {
  return (
    <section className="section hero" id="top">
      <div className="container hero-inner">
        <div className="hero-content">
          <p className="eyebrow">Loyalty rewards that drive real ROI</p>

          <h1>
            Increase Customer Retention by 40%.
            <br />
            <span className="hero-accent">Boost Foot Traffic.</span>
          </h1>

          <p className="hero-sub">
            Turn one-time customers into loyal regulars with our QR-based loyalty program.
            Reward repeat visits, track customer data, and offer crypto payouts (USDC).
            Proven ROI for restaurants, retail, fitness, and salons.
          </p>

          <div className="hero-cta-row">
            <Link href="/roi-calculator" className="btn btn-primary">
              Calculate Your ROI
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              See How It Works
            </a>
          </div>

          <p className="hero-meta">
            QR-based setup • USDC crypto payouts • No new hardware • Starting at $49/month
          </p>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            <p className="hero-visual-label">Live example</p>
            <h3>Café Loyalty, Upgraded</h3>
            <p className="hero-visual-text">
              Scan at checkout. Get 5% back in rewards. Unlock VIP perks in 3 visits.
            </p>
            <div className="hero-visual-row">
              <div className="hero-visual-pill">USDC rewards</div>
              <div className="hero-visual-pill hero-visual-pill-light">
                VIP after 3 visits
              </div>
            </div>
            <div className="hero-visual-footer">
              <span className="hero-visual-number">1,842</span>
              <span className="hero-visual-note">rewards claimed this month</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
