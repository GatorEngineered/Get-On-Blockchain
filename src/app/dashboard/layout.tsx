"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./dashboard.css";


type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/qr-codes", label: "QR Codes" },
  { href: "/dashboard/settings", label: "Settings" },
];

type CurrentMerchant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [merchant, setMerchant] = useState<CurrentMerchant | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Skip layout for main dashboard, login, auth, settings, and members pages (they have their own layouts)
  const isDashboardHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const isLoginPage = pathname === "/dashboard/login";
  const isRegisterPage = pathname === "/dashboard/register";
  const isSettingsPage = pathname?.startsWith("/dashboard/settings");
  const isMembersPage = pathname?.startsWith("/dashboard/members");
  const skipLayout = isDashboardHome || isLoginPage || isRegisterPage || isSettingsPage || isMembersPage;

  useEffect(() => {
    if (skipLayout) return; // Don't load merchant data on these pages

    const loadMerchant = async () => {
      try {
        const res = await fetch("/api/merchant/me");
        if (!res.ok) return;
        const json = await res.json();
        setMerchant(json);
      } catch (err) {
        console.error("Failed to load merchant", err);
      }
    };

    loadMerchant();
  }, [skipLayout]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Render pages without dashboard chrome (they have their own full layouts)
  if (skipLayout) {
    return <>{children}</>;
  }

  const merchantName = merchant?.name ?? "Your business";
  const merchantSubtitle = merchant?.plan
    ? `Plan: ${merchant.plan}`
    : "Merchant Portal";

  return (
    <div className="dashboard-card">
      <div className="dashboard-shell">

        {/* MOBILE HEADER - Only visible on mobile */}
        <header className="dashboard-mobile-header">
          <div className="dashboard-brand">
            <div className="dashboard-logo">⚡</div>
            <div>
              <div className="dashboard-brand-title">{merchantName}</div>
            </div>
          </div>
          <button
            className="dashboard-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="dashboard-mobile-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`dashboard-hamburger-line ${mobileMenuOpen ? 'dashboard-hamburger-line--open1' : ''}`} />
            <span className={`dashboard-hamburger-line ${mobileMenuOpen ? 'dashboard-hamburger-line--open2' : ''}`} />
            <span className={`dashboard-hamburger-line ${mobileMenuOpen ? 'dashboard-hamburger-line--open3' : ''}`} />
          </button>
        </header>

        {/* MOBILE SIDEBAR OVERLAY */}
        <aside
          id="dashboard-mobile-nav"
          className={`dashboard-sidebar-mobile ${mobileMenuOpen ? 'dashboard-sidebar-mobile--open' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="dashboard-brand">
            <div className="dashboard-logo">⚡</div>
            <div>
              <div className="dashboard-brand-title">{merchantName}</div>
              <div className="dashboard-brand-subtitle">{merchantSubtitle}</div>
            </div>
          </div>

          <nav className="dashboard-nav">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "dashboard-nav-link" +
                    (isActive ? " dashboard-nav-link--active" : "")
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="dashboard-sidebar-footer">
            <span className="dashboard-foot-label">Environment</span>
            <span className="dashboard-foot-tag">Demo / Local</span>
          </div>
        </aside>

        {/* MOBILE BACKDROP */}
        {mobileMenuOpen && (
          <div
            className="dashboard-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* LEFT SIDEBAR - Desktop only */}
        <aside className="dashboard-sidebar dashboard-sidebar-desktop">
          <div className="dashboard-brand">
            <div className="dashboard-logo">⚡</div>
            <div>
               <div className="dashboard-brand-title">{merchantName}</div>
            <div className="dashboard-brand-subtitle">
              {merchantSubtitle}
            </div>
            </div>
          </div>

          <nav className="dashboard-nav">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "dashboard-nav-link" +
                    (isActive ? " dashboard-nav-link--active" : "")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="dashboard-sidebar-footer">
            <span className="dashboard-foot-label">Environment</span>
            <span className="dashboard-foot-tag">Demo / Local</span>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="dashboard-main">
          <header className="dashboard-header dashboard-header-desktop">
            <h1 className="dashboard-page-title">Merchant Dashboard</h1>
          </header>

          <section className="dashboard-content">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
