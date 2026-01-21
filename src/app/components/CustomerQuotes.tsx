"use client";

const quotes = [
  {
    quote: "I've been a regular at my coffee shop for years, but now my points actually mean something. They never expire and I can see exactly what I've earned. It feels like I'm building something.",
    name: "Sarah M.",
    role: "Coffee Shop Regular",
    points: "3,420 pts"
  },
  {
    quote: "Got rewarded just for helping another customer find their way around the store. The staff noticed and sent me points with a thank you message. That's never happened anywhere else.",
    name: "Marcus T.",
    role: "Retail VIP Member",
    points: "1,850 pts"
  },
  {
    quote: "The exclusive events are amazing. Scanned a QR at a VIP tasting night and got triple points plus a badge. I actually look forward to checking my rewards now.",
    name: "Jennifer L.",
    role: "Restaurant Loyalty Member",
    points: "5,200 pts"
  }
];

export default function CustomerQuotes() {
  return (
    <section className="section quotes-section">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Real Members, Real Rewards</p>
          <h2>What Customers Are <span className="hero-accent">Saying</span></h2>
          <p className="section-sub">
            Members love rewards that actually work for them.
          </p>
        </div>

        <div className="quotes-grid">
          {quotes.map((item, index) => (
            <div key={index} className="quote-card">
              <div className="quote-content">
                <svg className="quote-icon" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="quote-text">{item.quote}</p>
              </div>
              <div className="quote-footer">
                <div className="quote-author">
                  <span className="quote-name">{item.name}</span>
                  <span className="quote-role">{item.role}</span>
                </div>
                <div className="quote-points">
                  <span className="quote-points-value">{item.points}</span>
                  <span className="quote-points-label">earned</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
