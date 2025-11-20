// src/app/components/DemoSection.tsx
import QR from "./QR";

export default function DemoSection() {
  const demoUrl =
    typeof window === "undefined"
      ? "https://getonblockchain.com/demo/claim" // fallback for build
      : window.location.origin + "/demo/claim";

  return (
    <section className="section demo" id="demo">
      <div className="container demo-inner">
        <div className="demo-copy">
          <p className="eyebrow">Try it yourself</p>
          <h2>Scan A Live Demo Like Your Customers Will.</h2>
          <p className="section-sub">
            Point your phone at the QR on screen, or click the button below to open the demo claim
            page. This is the same type of flow your customers will see at checkout.
          </p>
          <a href="/demo/claim" className="btn btn-primary">
            Open Demo Claim Page
          </a>
        </div>

        <div className="demo-card">
          <p className="demo-label">Demo QR</p>
          <div className="qr-placeholder">
            <QR value={demoUrl} />
          </div>
          <p className="demo-note">
            Print this QR for a demo table tent, or drop it into a slide when you present the idea
            to a business owner.
          </p>
        </div>
      </div>
    </section>
  );
}
