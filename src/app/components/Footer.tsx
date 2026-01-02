"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        {/* Main Footer Grid */}
        <div className="site-footer-grid">
          {/* Brand Column */}
          <div className="site-footer-column">
            <div className="site-footer-left">
              <Image
                src="/getonblockchain-favicon-resized.png"
                alt="Get On Blockchain logo"
                width={28}
                height={28}
              />
              <div className="site-footer-brand">
                <span className="site-footer-brand-name">
                  Get On Blockchain
                </span>
                <span className="site-footer-brand-sub">
                  Loyalty rewards that drive real ROI
                </span>
              </div>
            </div>
          </div>

          {/* Product Column */}
          <div className="site-footer-column">
            <h4 className="site-footer-column-title">Product</h4>
            <ul className="site-footer-link-list">
              <li><Link href="/pricing" className="site-footer-link">Pricing</Link></li>
              <li><Link href="/roi-calculator" className="site-footer-link">ROI Calculator</Link></li>
              <li><Link href="/faq" className="site-footer-link">FAQ</Link></li>
              <li><Link href="/about" className="site-footer-link">About</Link></li>
            </ul>
          </div>

          {/* Industries Column */}
          <div className="site-footer-column">
            <h4 className="site-footer-column-title">Industries</h4>
            <ul className="site-footer-link-list">
              <li><Link href="/industries/restaurants" className="site-footer-link">Restaurants</Link></li>
              <li><Link href="/industries/retail" className="site-footer-link">Retail</Link></li>
              <li><Link href="/industries/fitness" className="site-footer-link">Fitness</Link></li>
              <li><Link href="/industries/salons" className="site-footer-link">Salons & Spas</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="site-footer-column">
            <h4 className="site-footer-column-title">Resources</h4>
            <ul className="site-footer-link-list">
              <li><Link href="/blog" className="site-footer-link">Blog</Link></li>
              <li><Link href="/support" className="site-footer-link">Support</Link></li>
              <li><Link href="/privacy-policy" className="site-footer-link">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="site-footer-link">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © 2025 Gator Engineered Technologies. Get On Blockchain™. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
