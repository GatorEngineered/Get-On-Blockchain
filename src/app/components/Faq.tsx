const faqs = [
  {
    q: "Do my customers need to already use crypto?",
    a: "No. They can create a simple wallet using email or SMS in under 30 seconds, or connect an existing wallet if they already have one.",
  },
  {
    q: "Which blockchains do you use?",
    a: "We focus on low-fee networks like Base or Polygon for on-chain perks, and use off-chain tracking for most day-to-day points to keep things fast and cheap.",
  },
  {
    q: "What about gas fees?",
    a: "Off-chain points have no gas fees. When we mint on-chain VIP passes or tokens, we minimize gas and explain costs clearly before launch.",
  },
  {
    q: "Is this a securities or investment product?",
    a: "No. We design programs as loyalty and access perks, not investment products. Your accountant or attorney can give you guidance specific to your business.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. After your setup and first month, plans are month-to-month. You can export your data before you leave.",
  },
];

export default function Faq() {
  return (
    <section className="section faq" id="faq">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">FAQ</p>
          <h2>Answers To The Big Questions.</h2>
          <p className="section-sub">
            Still unsure if crypto loyalty fits your business? Start with one location, one QR,
            and real data—not guesswork.
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((item) => (
            <div key={item.q} className="faq-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
