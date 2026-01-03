"use client";

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

  // Determine login URLs based on environment
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app');
  const memberLoginUrl = isVercel ? '/member/login' : 'https://rewards.getonblockchain.com/member/login';
  const businessLoginUrl = isVercel ? '/dashboard/login' : 'https://dashboard.getonblockchain.com/dashboard/login';

  return (
    <header className={styles.siteHeader}>
      <div className={styles.siteHeaderInner}>
        {/* LEFT SIDE LOGO */}
        <div className={styles.siteHeaderBrand}>
          <Link href="/" className={styles.siteHeaderLogo}>
            <Image
              src="/getonblockchain-favicon-resized.png"
              alt="Get On Blockchain logo"
              width={36}
              height={36}
              className={styles.siteHeaderLogoIcon}
              priority
            />

            <span className={styles.siteHeaderLogoText}>
              Get On Blockchain
            </span>
          </Link>
        </div>

        {/* CENTER NAV */}
        <nav className={styles.siteHeaderNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                styles.siteHeaderNavLink +
                " " +
                (isActive(link.href) ? styles.isActive : "")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT CTA */}
        <div className={styles.siteHeaderCta}>
          <Link
            href={memberLoginUrl}
            className={styles.siteHeaderLoginBtn}
          >
            Member Login
          </Link>
          <Link
            href={businessLoginUrl}
            className={styles.siteHeaderBusinessBtn}
          >
            For Businesses →
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
      <main className="site-main">{children}</main>
    </div>
  );
}
