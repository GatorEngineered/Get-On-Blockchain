import Link from 'next/link';
import styles from './docs.module.css';

const docsSections = [
  {
    title: 'Getting Started',
    links: [
      { href: '/docs/getting-started', label: 'Quick Start Guide' },
      { href: '/docs/getting-started#setup', label: 'Initial Setup' },
      { href: '/docs/getting-started#qr-codes', label: 'QR Codes' },
    ],
  },
  {
    title: 'Member Management',
    links: [
      { href: '/docs/members', label: 'Managing Members' },
      { href: '/docs/members#points', label: 'Points System' },
      { href: '/docs/members#tiers', label: 'Member Tiers' },
    ],
  },
  {
    title: 'Payouts',
    links: [
      { href: '/docs/payouts', label: 'Payout System' },
      { href: '/docs/payouts#wallet', label: 'Wallet Setup' },
      { href: '/docs/payouts#usdc', label: 'USDC Payouts' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/docs/faq', label: 'FAQ' },
      { href: '/dashboard/settings?tab=support', label: 'Contact Support' },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.docsContainer}>
      <aside className={styles.docsSidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoLink}>
            Get On Blockchain
          </Link>
          <span className={styles.docsLabel}>Documentation</span>
        </div>
        <nav className={styles.docsNav}>
          {docsSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <h3 className={styles.navSectionTitle}>{section.title}</h3>
              <ul className={styles.navList}>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.navLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className={styles.docsMain}>
        <div className={styles.docsContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
