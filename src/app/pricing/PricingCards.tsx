'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './pricing.module.css';

type PlanId = 'STARTER' | 'BASIC' | 'PREMIUM' | 'GROWTH';
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
    priceLabel: '$0',
    description:
      'Try our loyalty platform with no commitment. Perfect for testing before you upgrade.',
    features: [
      'QR-based loyalty with points & rewards',
      'Up to 5 active members',
      '1 location',
      'Unlimited rewards catalog',
      'Points never expire',
      'Basic dashboard',
    ],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    priceMonthly: 55,
    priceAnnual: 550,
    description:
      'Points & rewards for growing businesses. Simple loyalty without crypto complexity.',
    features: [
      'Up to 1,000 active members',
      'Unlimited locations',
      'Unlimited rewards catalog',
      'Points never expire',
      'Member ranks (Rookie, Soldier, General)',
      'Referral program with notifications',
      'Email announcements to members',
      'Points reminder emails',
      'Full dashboard & analytics',
      'Email support',
      '7-day free trial',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    badge: 'Most Popular',
    priceMonthly: 149,
    priceAnnual: 1490,
    description:
      'Everything in Basic + stablecoin rewards. Give customers REAL money, not just points.',
    features: [
      'Up to 25,000 active members',
      'Unlimited locations',
      'Unlimited rewards catalog',
      'Points never expire',
      'All Basic features included',
      'Direct individual member messaging',
      'POS integration (Square, Toast, Clover, Shopify)',
      'Points per dollar spent',
      'USDC payouts on Polygon (low fees)',
      'Blockchain-verified rewards',
      'Priority email support',
      '7-day free trial',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    priceMonthly: 249,
    priceAnnual: 2490,
    description:
      'Your own branded loyalty token on the blockchain. True ownership for your customers.',
    features: [
      'Up to 100,000 active members',
      'Unlimited locations',
      'Unlimited rewards catalog',
      'All Premium features included',
      'Custom branded loyalty token',
      'Non-custodial wallets for members',
      '1 million token supply',
      'Custom loyalty tier thresholds',
      'Multiple payout milestones',
      'Bulk email marketing campaigns',
      'Advanced member analytics',
      'Priority support',
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
    if (plan.id === 'STARTER') {
      router.push('/merchant/signup');
      return;
    }

    if (!merchant) {
      router.push(`/merchant/signup?plan=${plan.id}&billing=${billingCycle}`);
      return;
    }

    setLoading(plan.id);
    setError('');

    try {
      const planType = `${plan.id}_${billingCycle.toUpperCase()}` as
        | 'BASIC_MONTHLY'
        | 'BASIC_ANNUAL'
        | 'PREMIUM_MONTHLY'
        | 'PREMIUM_ANNUAL'
        | 'GROWTH_MONTHLY'
        | 'GROWTH_ANNUAL';

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
    <div className={styles.pricingContainer}>
      {/* Billing Toggle - Centered at top */}
      <div className={styles.billingToggleWrapper}>
        <div className={styles.billingToggle}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`${styles.billingToggleBtn} ${billingCycle === 'monthly' ? styles.billingToggleBtnActive : ''}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`${styles.billingToggleBtn} ${billingCycle === 'annual' ? styles.billingToggleBtnActive : ''}`}
          >
            Annual
            <span className={styles.billingToggleBadge}>2 months free</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
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
                <p className={styles.savingsText}>
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
              >
                {loading === plan.id
                  ? 'Processing...'
                  : plan.id === 'STARTER'
                  ? 'Start Free'
                  : 'Subscribe Now'}
              </button>
            </div>

            <p className={styles.cardNote}>
              {plan.id === 'STARTER'
                ? 'No credit card required'
                : '7-day free trial included'}
            </p>
          </article>
        ))}
      </div>

      {/* Logged In Status - subtle at bottom */}
      {merchant && (
        <p className={styles.loggedInStatus}>
          Logged in as {merchant.email}.{' '}
          <Link href="/dashboard">Go to Dashboard</Link>
        </p>
      )}
    </div>
  );
}
