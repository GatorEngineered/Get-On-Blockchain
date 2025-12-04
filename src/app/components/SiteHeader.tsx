"use client";

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* Left: logo + brand */}
        <div className="site-header-brand">
          <Link href="/" className="site-header-logo">
           <Image
  src="/getonblockchain-favicon.png"
  alt="Get On Blockchain logo"
  width={32}
  height={32}
  className="site-header-logo-icon"
/>

<span className="site-header-logo-text">Get On Blockchain</span>

          </Link>
        </div>

        {/* Center/right: nav */}
        <nav className="site-header-nav">
          <ul className="site-header-nav-list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    "site-header-nav-link" +
                    (isActive(link.href) ? " site-header-nav-link-active" : "")
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Login button on far right */}
          <Link href="/login" className="site-header-login">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
