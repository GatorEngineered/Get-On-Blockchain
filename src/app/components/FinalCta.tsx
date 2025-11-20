export default function FinalCta() {
  return (
       <section className="section final-cta" id="contact">
      <div className="container final-cta-inner">
        {/* ROW: heading + paragraph */}
        <div className="final-cta-copy">
          <div className="final-cta-heading">
            <p className="eyebrow">Next step</p>
            <h2>Get Rewards Running This Week</h2>
          </div>
          <p className="section-sub">
            Let&apos;s look at your margins, customers, and existing tools, then design a loyalty
            and payments flow that fits how you already work.
          </p>
          <div className="final-cta-actions">
            <a href="https://outlook.office.com/book/GatorEngineeredConsults@gatorengineered.com/?ismsaljsauthenabled" className="btn btn-primary">
              Book a Demo
            </a>
            <a href="mailto:reva@gatorengineered.com" className="btn btn-secondary">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
