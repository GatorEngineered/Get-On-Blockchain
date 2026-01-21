import Link from "next/link";

export default function HeroNew() {
  return (
    <section className="section hero" id="top">
      <div className="container hero-inner">
        <div className="hero-content">
          <p className="eyebrow">This isn't a punch card</p>

          <h1>
            Build a Branded Community.
            <br />
            <span className="hero-accent">Not a Points Program.</span>
          </h1>

          <p className="hero-sub">
            Forget "buy 10 get 1 free." Your customers earn points they actually own—points
            that never expire, never reset, and grow with every interaction. Reward loyalty,
            recognize good deeds, and create VIPs who rep your brand.
          </p>

          <div className="hero-cta-row">
            <Link href="/business/register" className="btn btn-primary">
              Start Your Community
            </Link>
            <a href="#what-you-can-do" className="btn btn-secondary">
              See What's Possible
            </a>
          </div>

          <p className="hero-meta">
            Points that never expire • Branded tokens • Direct rewards • VIP merchandise
          </p>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            <p className="hero-visual-label">Community in action</p>
            <h3>Your Brand. Their Loyalty.</h3>
            <p className="hero-visual-text">
              Members earn your branded token. Trade it. Redeem it. Show it off.
              They're not just customers—they're your community.
            </p>
            <div className="hero-visual-row">
              <div className="hero-visual-pill">Points never expire</div>
              <div className="hero-visual-pill hero-visual-pill-light">
                Owned by members
              </div>
            </div>
            <div className="hero-visual-footer">
              <span className="hero-visual-number">Forever</span>
              <span className="hero-visual-note">is how long points last</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
