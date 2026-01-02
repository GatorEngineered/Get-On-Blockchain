// src/app/components/IndustriesSection.tsx
import Link from "next/link";

export default function IndustriesSection() {
  const industries = [
    {
      name: "Restaurants",
      icon: "🍽️",
      description: "Increase repeat diners and fill tables during slow periods",
      benefits: "40% more visits • Higher check averages • Reduced churn",
      href: "/industries/restaurants",
    },
    {
      name: "Retail Stores",
      icon: "🛍️",
      description: "Turn browsers into buyers and buyers into regulars",
      benefits: "35% higher purchase frequency • Increased basket size",
      href: "/industries/retail",
    },
    {
      name: "Fitness Studios",
      icon: "💪",
      description: "Reduce member churn and boost class attendance",
      benefits: "35% less churn • More consistent attendance • Longer memberships",
      href: "/industries/fitness",
    },
    {
      name: "Salons & Spas",
      icon: "💇",
      description: "Keep clients rebooking and fill your appointment calendar",
      benefits: "40% higher rebooking rates • Predictable revenue",
      href: "/industries/salons",
    },
  ];

  return (
    <section className="section industries-section" id="industries">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">Industries We Serve</p>
          <h2>Built for Your Industry</h2>
          <p className="section-sub">
            Loyalty programs designed for the unique needs of local businesses
          </p>
        </div>

        <div className="industries-grid">
          {industries.map((industry) => (
            <Link
              key={industry.name}
              href={industry.href}
              className="industries-card"
            >
              <div className="industries-icon">{industry.icon}</div>
              <h3 className="industries-name">{industry.name}</h3>
              <p className="industries-description">{industry.description}</p>
              <div className="industries-benefits">{industry.benefits}</div>
              <div className="industries-link">
                Learn More →
              </div>
            </Link>
          ))}
        </div>

        <div className="industries-cta">
          <p className="industries-cta-text">
            Want to see exact ROI for your business?
          </p>
          <Link href="/roi-calculator" className="btn btn-primary">
            Calculate Your ROI
          </Link>
        </div>
      </div>
    </section>
  );
}
