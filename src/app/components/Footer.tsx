"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        <div className="site-footer-left">
          <Image
            src="/getonblockchain-favicon.png"
            alt="Get On Blockchain logo"
            width={28}
            height={28}
          />
          <div className="site-footer-brand">
            <span className="site-footer-brand-name">
              Get On Blockchain
            </span>
            <span className="site-footer-brand-sub">
              Powered by Gator Engineered Technologies
            </span>
          </div>
        </div>

        <div className="site-footer-links">
          <Link href="/terms-of-service" className="site-footer-link">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="site-footer-link">
            Privacy Policy
          </Link>
        </div>

        <p className="site-footer-copy">
          © 2025 Gator Engineered Technologies. Get On Blockchain™. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
