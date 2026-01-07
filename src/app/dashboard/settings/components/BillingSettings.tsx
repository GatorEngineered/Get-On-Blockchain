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

const planDetails: Record<string, { name: string; price: number; features: string[] }> = {
  STARTER: {
    name: 'Starter',
    price: 0,
    features: ['5 active members', '1 reward', 'Basic dashboard'],
  },
  BASIC: {
    name: 'Basic',
    price: 49,
    features: ['1,000 active members', '3 rewards', 'Full dashboard', 'Email support'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 99,
    features: ['5,000 active members', '4 rewards', 'USDC payouts', 'Priority support'],
  },
  GROWTH: {
    name: 'Growth',
    price: 149,
    features: ['15,000 active members', '5 rewards', 'Multiple milestones', 'Custom tiers'],
  },
  PRO: {
    name: 'Pro',
    price: 199,
    features: ['35,000 active members', '6 rewards', 'Advanced features', 'Dedicated support'],
  },
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

      // Refresh subscription details
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
        Loading subscription details...
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

  const currentPlan = planDetails[subscription?.plan || 'STARTER'];
  const isTrialing = subscription?.subscriptionStatus === 'TRIAL';
  const isCanceled = subscription?.subscriptionStatus === 'CANCELED';
  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div>
      <h2 className={styles.sectionTitle}>Billing & Subscription</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Manage your subscription, view billing history, and update payment methods.
      </p>

      {/* Current Plan Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #244b7a 0%, #1e3a5f 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Current Plan</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{currentPlan.name}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
              ${currentPlan.price}
              <span style={{ fontSize: '1rem', fontWeight: '400' }}>/mo</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {getStatusBadge(subscription?.subscriptionStatus || 'TRIAL')}
          {isTrialing && trialDaysRemaining > 0 && (
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              {trialDaysRemaining} days left in trial
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
          {subscription?.paypalSubscription?.nextBillingTime && (
            <div>
              <span style={{ opacity: 0.7 }}>Next billing: </span>
              {formatDate(subscription.paypalSubscription.nextBillingTime)}
            </div>
          )}
          {subscription?.trialEndsAt && isTrialing && (
            <div>
              <span style={{ opacity: 0.7 }}>Trial ends: </span>
              {formatDate(subscription.trialEndsAt)}
            </div>
          )}
          {isCanceled && subscription?.subscriptionEndsAt && (
            <div>
              <span style={{ opacity: 0.7 }}>Access until: </span>
              {formatDate(subscription.subscriptionEndsAt)}
            </div>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Plan Features</h4>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {currentPlan.features.map((feature, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment Info */}
      {subscription?.paypalSubscription && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Payment Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Billing Email</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {subscription.paypalSubscription.subscriber?.email_address || 'N/A'}
              </p>
            </div>
            {subscription.paypalSubscription.lastPayment && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Last Payment</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  ${subscription.paypalSubscription.lastPayment.amount.value} on {formatDate(subscription.paypalSubscription.lastPayment.time)}
                </p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Subscription ID</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', fontFamily: 'monospace' }}>
                {subscription.paypalSubscription.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {subscription?.plan !== 'STARTER' && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Upgrade Plan
          </button>
        )}

        {subscription?.plan === 'STARTER' && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Upgrade to Paid Plan
          </button>
        )}

        {subscription?.hasSubscription && !isCanceled && subscription?.plan !== 'STARTER' && (
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
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
        )}

        {isCanceled && (
          <div
            style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              flex: 1,
            }}
          >
            <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
              Your subscription has been canceled. You will have access until {formatDate(subscription?.subscriptionEndsAt || null)}.
              <button
                onClick={() => window.location.href = '/pricing'}
                style={{
                  marginLeft: '0.5rem',
                  color: '#244b7a',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Resubscribe
              </button>
            </p>
          </div>
        )}
      </div>

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
