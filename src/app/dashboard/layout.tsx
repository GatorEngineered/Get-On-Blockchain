"use client";

import React, { useEffect, useState } from "react"; // ⬅️ updated
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

type CurrentMerchant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [merchant, setMerchant] = useState<CurrentMerchant | null>(null);

 useEffect(() => {
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
  }, []);

  const merchantName = merchant?.name ?? "Your business";
  const merchantSubtitle = merchant?.plan
    ? `Plan: ${merchant.plan}`
    : "Merchant Portal";

  return (
    <div className="dashboard-card">
      <div className="dashboard-shell">
        
        {/* LEFT SIDEBAR */}
        <aside className="dashboard-sidebar">
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
