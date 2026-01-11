'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SubscriptionCancelPage() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✕</div>
        <h1 style={styles.title}>Checkout Cancelled</h1>
        <p style={styles.subtitle}>
          No worries! Your checkout was cancelled and you haven't been charged.
        </p>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>Need help deciding?</h3>
          <p style={styles.infoText}>
            If you have questions about our plans or need assistance, we're here to help.
          </p>
          <ul style={styles.infoList}>
            <li>All paid plans include a 7-day free trial</li>
            <li>Cancel anytime before your trial ends</li>
            <li>No credit card required for the trial</li>
          </ul>
        </div>

        <div style={styles.buttonGroup}>
          <Link href="/pricing" style={styles.primaryButton}>
            View Plans Again
          </Link>
          <Link href="/dashboard" style={styles.secondaryButton}>
            Go to Dashboard
          </Link>
        </div>

        <p style={styles.helpText}>
          Questions? Contact us at{' '}
          <a href="mailto:support@getonblockchain.com" style={styles.link}>
            support@getonblockchain.com
          </a>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    padding: '2rem',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  },
  icon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    color: 'white',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.75rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 2rem',
    lineHeight: '1.6',
  },
  infoBox: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    textAlign: 'left' as const,
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0369a1',
    margin: '0 0 0.5rem',
  },
  infoText: {
    fontSize: '0.9rem',
    color: '#0c4a6e',
    margin: '0 0 1rem',
  },
  infoList: {
    margin: '0',
    paddingLeft: '1.25rem',
    fontSize: '0.9rem',
    color: '#0c4a6e',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '1.5rem',
  },
  primaryButton: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #244b7a, #1e3a5f)',
    color: 'white',
    padding: '0.875rem 2rem',
    borderRadius: '9999px',
    fontSize: '1rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  secondaryButton: {
    display: 'inline-block',
    background: 'transparent',
    color: '#244b7a',
    padding: '0.875rem 2rem',
    borderRadius: '9999px',
    fontSize: '1rem',
    fontWeight: '600',
    textDecoration: 'none',
    border: '2px solid #244b7a',
  },
  helpText: {
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  link: {
    color: '#244b7a',
    textDecoration: 'underline',
  },
};
