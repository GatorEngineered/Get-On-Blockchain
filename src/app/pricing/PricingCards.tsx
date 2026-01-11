'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './pricing.module.css';

type PlanId = 'STARTER' | 'BASIC' | 'PREMIUM';
type BillingCycle = 'monthly' | 'annual';

type Plan = {
  id: PlanId;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceAnnual: number;
  priceLabel?: string;
  description: string;
  features: string[];
};

const plans: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    priceMonthly: 0,
    priceAnnual: 0,
    priceLabel: 'Free',
    description:
      'Try our loyalty platform with no commitment. Perfect for testing the waters before you upgrade.',
    features: [
      'QR-based loyalty with points & rewards',
      'Redeem for free products/discounts',
      '1 merchant claim page',
      'Basic dashboard',
      'Up to 5 active members',
      '1 reward in catalog',
    ],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    priceMonthly: 49,
    priceAnnual: 490, // 2 months free
    description:
      'Points & rewards only. Redeem for free products/discounts. Simple for businesses who don\'t want crypto complexity.',
    features: [
      'QR-based loyalty with points & rewards',
      'Redeem for free products/discounts',
      '1 merchant claim page (yourbrand.getonblockchain.com)',
      'Basic dashboard & analytics',
      'Simple POS receipt QR (just print the URL)',
      'Up to 1,000 active members',
      'Unlimited rewards in catalog',
      'Email support',
      '7-day free trial',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    badge: 'Most Popular',
    priceMonthly: 99,
    priceAnnual: 990, // 2 months free
    description:
      'Everything in Basic + stablecoin rewards. Give your customers REAL money, not just points. Blockchain-verified rewards.',
    features: [
      'Everything in Basic',
      'Stablecoin rewards (your unique angle)',
      '"Give your customers REAL money, not just points"',
      'Blockchain-verified rewards',
      'Customer wallet setup (MetaMask, Trust Wallet, etc.)',
      'Milestone-based payouts (100 points = $5 USDC)',
      'Configure payout wallet',
      'Up to 5,000 active members',
      'Priority email support',
      '7-day free trial',
    ],
  },
];

type MerchantSession = {
  merchantId: string;
  name: string;
  email: string;
} | null;

export default function PricingCards() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [merchant, setMerchant] = useState<MerchantSession>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if merchant is logged in
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/merchant/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setMerchant({
              merchantId: data.merchantId,
              name: data.name,
              email: data.email,
            });
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleGetStarted(plan: Plan) {
    // Starter plan - redirect to signup
    if (plan.id === 'STARTER') {
      router.push('/merchant/signup');
      return;
    }

    // Paid plans - check if logged in
    if (!merchant) {
      // Not logged in - redirect to signup with plan info
      router.push(`/merchant/signup?plan=${plan.id}&billing=${billingCycle}`);
      return;
    }

    // Logged in - create subscription
    setLoading(plan.id);
    setError('');

    try {
      const planType = `${plan.id}_${billingCycle.toUpperCase()}` as
        | 'BASIC_MONTHLY'
        | 'BASIC_ANNUAL'
        | 'PREMIUM_MONTHLY'
        | 'PREMIUM_ANNUAL';

      const res = await fetch('/api/merchant/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.merchantId,
          planType,
          email: merchant.email,
          firstName: merchant.name?.split(' ')[0] || '',
          lastName: merchant.name?.split(' ').slice(1).join(' ') || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to PayPal for approval
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
      setLoading(null);
    }
  }

  function getPrice(plan: Plan): string {
    if (plan.priceLabel) return plan.priceLabel;
    const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    return `$${price}`;
  }

  function getPriceTerm(plan: Plan): string {
    if (plan.id === 'STARTER') return '';
    return billingCycle === 'annual' ? '/year' : '/month';
  }

  return (
    <>
      {/* Billing Toggle */}
      <div className={styles.billingToggle} style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            background: billingCycle === 'monthly' ? '#244b7a' : '#e5e7eb',
            color: billingCycle === 'monthly' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('annual')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            background: billingCycle === 'annual' ? '#244b7a' : '#e5e7eb',
            color: billingCycle === 'annual' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Annual
          <span
            style={{
              background: billingCycle === 'annual' ? 'rgba(255,255,255,0.2)' : '#d1fae5',
              color: billingCycle === 'annual' ? 'white' : '#065f46',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            2 months free
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto 2rem',
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className={styles.grid}>
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`${styles.card} ${plan.badge ? styles.cardHighlight : ''}`}
          >
            {plan.badge && <div className={styles.cardBadge}>{plan.badge}</div>}

            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{plan.name}</h2>
              <p className={styles.cardPrice}>
                <span className={styles.cardPriceAmount}>{getPrice(plan)}</span>
                <span className={styles.cardPriceTerm}>{getPriceTerm(plan)}</span>
              </p>
              {plan.id !== 'STARTER' && billingCycle === 'annual' && (
                <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', margin: '0.25rem 0 0' }}>
                  Save ${plan.priceMonthly * 2}/year
                </p>
              )}
              <p className={styles.cardDescription}>{plan.description}</p>
            </div>

            <ul className={styles.cardFeatures}>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className={styles.cardActions}>
              <button
                onClick={() => handleGetStarted(plan)}
                disabled={loading === plan.id || checkingSession}
                className={styles.primaryBtn}
                style={{
                  width: '100%',
                  border: 'none',
                  cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                  opacity: loading === plan.id ? 0.7 : 1,
                }}
              >
                {loading === plan.id
                  ? 'Processing...'
                  : plan.id === 'STARTER'
                  ? 'Start Free'
                  : merchant
                  ? 'Subscribe Now'
                  : 'Get Started'}
              </button>

              <Link href="/support" className={styles.secondaryBtn}>
                Talk to sales
              </Link>
            </div>

            <p className={styles.cardNote}>
              {plan.id === 'STARTER'
                ? 'No credit card required'
                : 'You can upgrade or pause your plan before the next billing cycle.'}
            </p>
          </article>
        ))}
      </div>

      {/* Logged In Status */}
      {merchant && (
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          Logged in as <strong>{merchant.email}</strong>.{' '}
          <Link href="/dashboard" style={{ color: '#244b7a', textDecoration: 'underline' }}>
            Go to Dashboard
          </Link>
        </p>
      )}
    </>
  );
}
