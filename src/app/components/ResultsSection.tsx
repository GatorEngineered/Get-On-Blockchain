// src/app/components/ResultsSection.tsx
import Link from "next/link";

export default function ResultsSection() {
  const stats = [
    {
      number: "40%",
      label: "Average Increase in Customer Visit Frequency",
      description: "Loyalty members return significantly more often than non-members",
    },
    {
      number: "500%+",
      label: "Average ROI Within 6 Months",
      description: "Most businesses see $5+ return for every $1 spent on the program",
    },
    {
      number: "60-75%",
      label: "Customer Enrollment Rate",
      description: "QR-based loyalty programs have 2-3x higher participation than punch cards",
    },
    {
      number: "$99",
      label: "Starting Price Per Month",
      description: "No setup fees, no hardware costs, cancel anytime",
    },
  ];

  const testimonials = [
    {
      quote: "We saw a 35% increase in repeat customers within the first 3 months. The QR code system is so easy—customers love it.",
      business: "Local Coffee Shop",
      location: "Austin, TX",
    },
    {
      quote: "Our rebooking rate went from 50% to 72%. Clients actually remember to come back now that rewards are digital.",
      business: "Hair Salon",
      location: "Portland, OR",
    },
    {
      quote: "We're filling Tuesday lunches that used to be dead. Double points on slow days works like magic.",
      business: "Italian Restaurant",
      location: "Chicago, IL",
    },
  ];

  return (
    <section className="section results-section" id="results">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Proven Results</p>
          <h2>Real Results from Real Businesses</h2>
          <p className="section-sub">
            Local businesses are using loyalty rewards to drive measurable growth
          </p>
        </div>

        <div className="results-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="results-stat-card">
              <div className="results-stat-number">{stat.number}</div>
              <div className="results-stat-label">{stat.label}</div>
              <div className="results-stat-description">{stat.description}</div>
            </div>
          ))}
        </div>

        <div className="results-testimonials">
          <h3 className="results-testimonials-title">What Business Owners Are Saying</h3>
          <div className="results-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="results-testimonial-card">
                <div className="results-testimonial-quote">"{testimonial.quote}"</div>
                <div className="results-testimonial-attribution">
                  <div className="results-testimonial-business">{testimonial.business}</div>
                  <div className="results-testimonial-location">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-cta">
          <h3>See What You Could Achieve</h3>
          <p>Calculate your potential ROI in under 2 minutes</p>
          <Link href="/roi-calculator" className="btn btn-primary">
            Calculate Your ROI
          </Link>
        </div>
      </div>
    </section>
  );
}
