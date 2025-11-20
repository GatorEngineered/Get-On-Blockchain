export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">How it works</p>
          <h2>Simple for you. Even simpler for your customers.</h2>
          <p className="section-sub">
            We handle the rails. You handle the hello. In a few days, your business is running
            crypto-powered rewards and payments.
          </p>
        </div>

        <div className="how-grid">
          <div className="how-column">
            <h3>For Business Owners</h3>
            <ol className="how-list">
              <li>
                <span className="how-step-num">1</span>
                <div>
                  <h4>Pick your perks</h4>
                  <p>
                    Choose points, VIP tiers, birthday boosts, and high-spender rewards that match
                    your margins and goals.
                  </p>
                </div>
              </li>
              <li>
                <span className="how-step-num">2</span>
                <div>
                  <h4>Place your QR</h4>
                  <p>
                    We generate branded QR codes for your counter, receipts, menus, emails, and
                    social posts.
                  </p>
                </div>
              </li>
              <li>
                <span className="how-step-num">3</span>
                <div>
                  <h4>Watch repeat visits climb</h4>
                  <p>
                    Track scans, redemptions, and repeat customers from a single dashboard. Upgrade
                    to on-chain VIP passes when you are ready.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="how-column">
            <h3>For Your Customers</h3>
            <ol className="how-list">
              <li>
                <span className="how-step-num">1</span>
                <div>
                  <h4>Scan the code</h4>
                  <p>
                    At checkout, they scan your QR with their phone—no app store download needed.
                  </p>
                </div>
              </li>
              <li>
                <span className="how-step-num">2</span>
                <div>
                  <h4>Connect or create a wallet</h4>
                  <p>
                    They can connect an existing wallet, or create a simple custodial wallet with
                    email or SMS in under 30 seconds.
                  </p>
                </div>
              </li>
              <li>
                <span className="how-step-num">3</span>
                <div>
                  <h4>Get their perk instantly</h4>
                  <p>
                    Rewards are saved for next time—points, VIP status, or a stablecoin balance they
                    can actually use.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
