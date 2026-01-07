"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "@/app/styles/siteheader.module.css"; // IMPORT MODULE

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  // Force navigation to stay on current domain
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${currentOrigin}${path}`;
  };

  return (
    <header className={styles.siteHeader} role="banner">
      <div className={styles.siteHeaderInner}>
        {/* LEFT SIDE LOGO */}
        <div className={styles.siteHeaderBrand}>
          <Link href="/" className={styles.siteHeaderLogo} aria-label="Get On Blockchain - Go to homepage">
            <Image
              src="/getonblockchain-favicon-resized.png"
              alt=""
              width={36}
              height={36}
              className={styles.siteHeaderLogoIcon}
              priority
              aria-hidden="true"
            />

            <span className={styles.siteHeaderLogoText}>
              Get On Blockchain
            </span>
          </Link>
        </div>

        {/* CENTER NAV */}
        <nav className={styles.siteHeaderNav} aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                styles.siteHeaderNavLink +
                " " +
                (isActive(link.href) ? styles.isActive : "")
              }
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT CTA */}
        <div className={styles.siteHeaderCta} role="group" aria-label="Account actions">
          <Link
            href="/member/login"
            className={styles.siteHeaderLoginBtn}
            onClick={(e) => handleNavigation(e, '/member/login')}
          >
            Member Login
          </Link>
          <Link
            href="/dashboard/login"
            className={styles.siteHeaderBusinessBtn}
            onClick={(e) => handleNavigation(e, '/dashboard/login')}
          >
            <span className="sr-only">Business dashboard - </span>
            For Businesses
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-page">
      <SiteHeader />
      <main
        id="main-content"
        className="site-main"
        tabIndex={-1}
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
