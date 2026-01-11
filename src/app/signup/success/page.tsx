'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type SubscriptionStatus = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasSubscription: boolean;
  paypalSubscription?: {
    id: string;
    status: string;
  };
};

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = searchParams.get('merchantId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!merchantId) {
      setError('Missing merchant ID');
      setLoading(false);
      return;
    }

    // Poll for subscription status
    let attempts = 0;
    const maxAttempts = 10;

    async function checkSubscription() {
      try {
        const res = await fetch('/api/merchant/subscription/details');
        if (!res.ok) {
          throw new Error('Failed to fetch subscription details');
        }

        const data = await res.json();

        // Check if subscription is now active or in trial
        if (data.subscriptionStatus === 'ACTIVE' || data.subscriptionStatus === 'TRIAL') {
          setStatus(data);
          setLoading(false);
          return true;
        }

        // If still pending, retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkSubscription, 2000);
          return false;
        } else {
          // After max attempts, show what we have
          setStatus(data);
          setLoading(false);
          return true;
        }
      } catch (err: any) {
        console.error('Error checking subscription:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkSubscription, 2000);
          return false;
        } else {
          setError('Unable to verify subscription status. Please check your dashboard.');
          setLoading(false);
          return false;
        }
      }
    }

    checkSubscription();
  }, [merchantId]);

  // Countdown timer for redirect
  useEffect(() => {
    if (!loading && status && !error) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, status, error, router]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>Verifying Your Subscription...</h1>
          <p style={styles.subtitle}>
            Please wait while we confirm your payment with PayPal.
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h1 style={styles.title}>Verification Issue</h1>
          <p style={styles.subtitle}>{error}</p>
          <div style={styles.buttonGroup}>
            <Link href="/dashboard" style={styles.primaryButton}>
              Go to Dashboard
            </Link>
            <Link href="/dashboard/settings" style={styles.secondaryButton}>
              Check Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isActive = status?.subscriptionStatus === 'ACTIVE';
  const isTrial = status?.subscriptionStatus === 'TRIAL';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h1 style={styles.title}>
          {isActive ? 'Payment Successful!' : isTrial ? 'Trial Started!' : 'Subscription Created!'}
        </h1>
        <p style={styles.subtitle}>
          {isActive
            ? `Your ${status?.plan} plan is now active.`
            : isTrial
            ? `Your 7-day free trial has started. You won't be charged until your trial ends.`
            : `Your subscription is being processed.`}
        </p>

        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Plan:</span>
            <span style={styles.detailValue}>{status?.plan}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Status:</span>
            <span style={{ ...styles.detailValue, ...styles.statusBadge }}>
              {status?.subscriptionStatus}
            </span>
          </div>
          {isTrial && status?.trialEndsAt && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Trial Ends:</span>
              <span style={styles.detailValue}>
                {new Date(status.trialEndsAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <p style={styles.redirectText}>
          Redirecting to your dashboard in {countdown} seconds...
        </p>

        <Link href="/dashboard" style={styles.primaryButton}>
          Go to Dashboard Now
        </Link>
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
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #244b7a',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    animation: 'spin 1s linear infinite',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    color: 'white',
    margin: '0 auto 1.5rem',
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
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
  details: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #e5e7eb',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
  },
  redirectText: {
    fontSize: '0.9rem',
    color: '#9ca3af',
    marginBottom: '1rem',
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
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
};
