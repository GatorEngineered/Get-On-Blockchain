"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./dashboard.css";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="dashboard-card">
      <div className="dashboard-shell">
        
        {/* LEFT SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <div className="dashboard-logo">⚡</div>
            <div>
              <div className="dashboard-brand-title">Demo Coffee Shop</div>
              <div className="dashboard-brand-subtitle">Merchant Portal</div>
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
          <header className="dashboard-header">
            <h1 className="dashboard-page-title">Merchant dashboard</h1>
          </header>

          <section className="dashboard-content">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
