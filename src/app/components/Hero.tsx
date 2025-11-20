export default function Hero() {
  return (
    <section className="section hero" id="top">
      <div className="container hero-inner">
        <div className="hero-content">
          <p className="eyebrow">Loyalty & payments for the crypto era</p>

          <h1>
            Rewards Your Customers Actually Use.
            <br />
            <span className="hero-accent">Crypto-Simple.</span>
          </h1>

          <p className="hero-sub">
            Turn one-time buyers into loyal regulars with stablecoin payments, instant perks,
            and VIP access. No crypto experience required.
          </p>

          <div className="hero-cta-row">
            <a href="https://outlook.office.com/book/GatorEngineeredConsults@gatorengineered.com/?ismsaljsauthenabled" className="btn btn-primary">
              Book a Demo
            </a>
            <a href="#how-it-works" className="btn btn-secondary">
              See How It Works
            </a>
          </div>

          <p className="hero-meta">
            Works with USDC • Privacy-first • No new hardware needed
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
