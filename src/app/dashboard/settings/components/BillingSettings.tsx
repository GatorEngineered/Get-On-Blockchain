'use client';

import React, { useState, useEffect } from 'react';
import styles from '../settings.module.css';

type SubscriptionDetails = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  paymentVerified: boolean;
  hasSubscription: boolean;
  paypalSubscription?: {
    id: string;
    status: string;
    planId: string;
    startTime: string;
    nextBillingTime?: string;
    lastPayment?: {
      amount: { currency_code: string; value: string };
      time: string;
    };
    subscriber?: {
      email_address: string;
    };
  };
};

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter (Free)',
  BASIC: 'Basic',
  PREMIUM: 'Premium',
  GROWTH: 'Growth',
  PRO: 'Enterprise',
};

const PLAN_PRICES: Record<string, number> = {
  STARTER: 0,
  BASIC: 49,
  PREMIUM: 99,
  GROWTH: 199,
  PRO: 0, // Enterprise - custom pricing
};

export default function BillingSettings() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  async function fetchSubscriptionDetails() {
    try {
      const res = await fetch('/api/merchant/subscription/details');
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const data = await res.json();
      setSubscription(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setCanceling(true);
    try {
      const res = await fetch('/api/merchant/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      await fetchSubscriptionDetails();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getStatusBadge(status: string) {
    const statusColors: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: '#dcfce7', text: '#15803d' },
      TRIAL: { bg: '#dbeafe', text: '#1e40af' },
      PAST_DUE: { bg: '#fef3c7', text: '#92400e' },
      CANCELED: { bg: '#fee2e2', text: '#991b1b' },
      EXPIRED: { bg: '#f3f4f6', text: '#6b7280' },
      PAUSED: { bg: '#fef3c7', text: '#92400e' },
    };

    const color = statusColors[status] || statusColors.EXPIRED;

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: '600',
          background: color.bg,
          color: color.text,
        }}
      >
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading billing details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        Error: {error}
      </div>
    );
  }

  const planName = PLAN_NAMES[subscription?.plan || 'STARTER'];
  const planPrice = PLAN_PRICES[subscription?.plan || 'STARTER'];
  const isCanceled = subscription?.subscriptionStatus === 'CANCELED';
  const hasActiveSubscription = subscription?.hasSubscription && !isCanceled;

  return (
    <div>
      <h2 className={styles.sectionTitle}>Billing</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        View your payment details, billing history, and manage your subscription.
      </p>

      {/* Subscription Summary Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #244b7a 0%, #1e3a5f 100%)',
          borderRadius: '12px',
          padding: '1.25rem',
          color: 'white',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Current Plan</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{planName}</h3>
          </div>
          <div>
            {getStatusBadge(subscription?.subscriptionStatus || 'TRIAL')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          {planPrice > 0 && (
            <div>
              <span style={{ opacity: 0.7 }}>Monthly Rate: </span>
              <span style={{ fontWeight: '600' }}>${planPrice}/mo</span>
            </div>
          )}
          {subscription?.paypalSubscription?.nextBillingTime && !isCanceled && (
            <div>
              <span style={{ opacity: 0.7 }}>Next Payment: </span>
              <span style={{ fontWeight: '600' }}>{formatDate(subscription.paypalSubscription.nextBillingTime)}</span>
            </div>
          )}
          {subscription?.trialEndsAt && subscription?.subscriptionStatus === 'TRIAL' && (
            <div>
              <span style={{ opacity: 0.7 }}>Trial Ends: </span>
              <span style={{ fontWeight: '600' }}>{formatDate(subscription.trialEndsAt)}</span>
            </div>
          )}
          {isCanceled && subscription?.subscriptionEndsAt && (
            <div>
              <span style={{ opacity: 0.7 }}>Access Until: </span>
              <span style={{ fontWeight: '600' }}>{formatDate(subscription.subscriptionEndsAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      {subscription?.paypalSubscription && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Payment Method
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{
              width: '48px',
              height: '32px',
              background: '#003087',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: '700',
            }}>
              PayPal
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>
                {subscription.paypalSubscription.subscriber?.email_address || 'PayPal Account'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                Subscription ID: {subscription.paypalSubscription.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Payment */}
      {subscription?.paypalSubscription?.lastPayment && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Last Payment
          </h4>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#15803d' }}>
                ${subscription.paypalSubscription.lastPayment.amount.value}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                Paid on {formatDate(subscription.paypalSubscription.lastPayment.time)}
              </p>
            </div>
            <div style={{
              padding: '0.25rem 0.5rem',
              background: '#dcfce7',
              color: '#15803d',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              Successful
            </div>
          </div>
        </div>
      )}

      {/* No Subscription Yet */}
      {!subscription?.hasSubscription && subscription?.plan === 'STARTER' && (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0c4a6e' }}>
            No Payment Method Required Yet
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem' }}>
            You're on the free Starter plan. Upgrade to a paid plan to add a payment method.
          </p>
          <a
            href="/dashboard/settings?tab=plans"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#244b7a',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
          >
            View Plans
          </a>
        </div>
      )}

      {/* Canceled Notice */}
      {isCanceled && (
        <div
          style={{
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
            Your subscription has been canceled. You will have access until {formatDate(subscription?.subscriptionEndsAt || null)}.
            {' '}
            <a
              href="/pricing"
              style={{
                color: '#244b7a',
                textDecoration: 'underline',
                fontWeight: '500',
              }}
            >
              Resubscribe
            </a>
          </p>
        </div>
      )}

      {/* Cancel Subscription */}
      {hasActiveSubscription && subscription?.plan !== 'STARTER' && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Cancel Subscription
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Cancel your subscription. You'll retain access until the end of your current billing period.
          </p>
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'white',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Cancel Subscription?
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              We are sorry to see you go. Your subscription will remain active until the end of your current billing period.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Why are you canceling? (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Select a reason...</option>
                <option value="Too expensive">Too expensive</option>
                <option value="Not using it enough">Not using it enough</option>
                <option value="Missing features">Missing features I need</option>
                <option value="Switching to competitor">Switching to a competitor</option>
                <option value="Business closed">Business closed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: canceling ? 'not-allowed' : 'pointer',
                  opacity: canceling ? 0.7 : 1,
                }}
              >
                {canceling ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
