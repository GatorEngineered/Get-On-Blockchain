"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "@/app/styles/siteheader.module.css";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  // Force navigation to stay on current domain
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${currentOrigin}${path}`;
  };

  // Close mobile menu on route change
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

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  return (
    <>
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

          {/* DESKTOP NAV - Hidden on mobile */}
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

          {/* DESKTOP CTA - Hidden on mobile */}
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

          {/* HAMBURGER BUTTON - Visible on mobile/tablet */}
          <button
            className={styles.hamburgerBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerLineOpen1 : ''}`} />
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerLineOpen2 : ''}`} />
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerLineOpen3 : ''}`} />
          </button>
        </div>
      </header>

      {/* BACKDROP - Rendered outside header for proper stacking */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MOBILE MENU OVERLAY - Rendered outside header for proper stacking */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.mobileCta}>
          <Link
            href="/member/login"
            className={styles.mobileLoginBtn}
            onClick={(e) => handleNavigation(e, '/member/login')}
            tabIndex={mobileMenuOpen ? 0 : -1}
          >
            Member Login
          </Link>
          <Link
            href="/dashboard/login"
            className={styles.mobileBusinessBtn}
            onClick={(e) => handleNavigation(e, '/dashboard/login')}
            tabIndex={mobileMenuOpen ? 0 : -1}
          >
            For Businesses →
          </Link>
        </div>
      </div>
    </>
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
