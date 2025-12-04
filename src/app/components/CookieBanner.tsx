// src/app/components/CookieBanner.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gob_cookie_consent_v1";

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return !stored; // show banner only if nothing stored yet
  });

  const accept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  };

  const dismiss = () => {
    // soft-dismiss; you could also store a different value if you want
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          We use basic cookies and analytics to keep the Get On Blockchain
          experience reliable and improve how businesses use rewards. By
          continuing, you agree to our{" "}
          <Link href="/terms-of-service">Terms of Service</Link> and{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>

        <div className="cookie-banner-actions">
          <button
            className="cookie-btn-ghost"
            type="button"
            onClick={dismiss}
          >
            Not now
          </button>
          <button
            className="cookie-btn-primary"
            type="button"
            onClick={accept}
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
