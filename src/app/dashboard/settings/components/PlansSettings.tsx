'use client';

import React, { useState, useEffect } from 'react';
import styles from './PlansSettings.module.css';

interface PlansSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

interface SubscriptionDetails {
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
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    subscriber: {
      email_address: string;
      name?: {
        given_name: string;
        surname: string;
      };
    };
  };
}

const PLAN_DETAILS = {
  STARTER: {
    name: 'Starter',
    price: 0,
    interval: 'Free',
    description: 'Trial plan with basic features',
    features: ['Basic loyalty features', 'Limited members', '7-day trial'],
  },
  BASIC: {
    name: 'Basic',
    price: 99,
    interval: 'month',
    description: 'Points & rewards only',
    features: [
      'QR-based loyalty with points & rewards',
      'Redeem for free products/discounts',
      '1 merchant claim page',
      'Basic dashboard & analytics',
      'Up to 1,000 active members',
      'Email support',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 149,
    interval: 'month',
    description: 'Everything in Basic + stablecoin rewards',
    features: [
      'Everything in Basic',
      'Stablecoin rewards (USDC)',
      'Blockchain-verified rewards',
      'Customer wallet setup',
      'Milestone-based payouts',
      'Up to 5,000 active members',
      'Priority email support',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: 249,
    interval: 'month',
    description: 'For growing brands with multi-location support',
    features: [
      'Up to 3 locations',
      'Custom points rules',
      'Advanced reporting',
      'Up to 15,000 active members',
      'Priority support',
    ],
  },
  PRO: {
    name: 'Enterprise',
    price: 349,
    interval: 'month',
    description: 'High-volume businesses with custom workflows',
    features: [
      'Up to 15 locations',
      'Custom workflows',
      'NFT access',
      'Dedicated support',
    ],
  },
};

export default function PlansSettings({ merchantData, onUpdate }: PlansSettingsProps) {
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  async function fetchSubscriptionDetails() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/subscription/details');

      if (!res.ok) {
        throw new Error('Failed to fetch subscription details');
      }

      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setCanceling(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      const data = await res.json();
      setSuccess(data.message);
      setShowCancelConfirm(false);
      setCancelReason('');

      // Refresh subscription details
      await fetchSubscriptionDetails();

      // Update parent component
      onUpdate({ subscriptionStatus: 'CANCELED', cancelAtPeriodEnd: true });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return styles.statusActive;
      case 'TRIAL':
        return styles.statusTrial;
      case 'CANCELED':
      case 'CANCELLED':
        return styles.statusCanceled;
      case 'PAST_DUE':
        return styles.statusPastDue;
      case 'EXPIRED':
        return styles.statusExpired;
      default:
        return styles.statusDefault;
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className={styles.title}>Plans & Billing</h2>
        <p className={styles.subtitle}>Manage your subscription and billing</p>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div>
        <h2 className={styles.title}>Plans & Billing</h2>
        <p className={styles.subtitle}>Manage your subscription and billing</p>
        <div className={styles.errorAlert}>Failed to load subscription details</div>
      </div>
    );
  }

  const currentPlan = PLAN_DETAILS[details.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.STARTER;

  return (
    <div>
      <h2 className={styles.title}>Plans & Billing</h2>
      <p className={styles.subtitle}>Manage your subscription and billing</p>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Current Plan */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Current Plan</h3>

        <div className={styles.planHeader}>
          <div>
            <div className={styles.planName}>{currentPlan.name}</div>
            <div className={styles.planPrice}>
              ${currentPlan.price}
              {currentPlan.interval !== 'Free' && <span className={styles.interval}>/{currentPlan.interval}</span>}
            </div>
          </div>
          <div className={`${styles.statusBadge} ${getStatusBadgeClass(details.subscriptionStatus)}`}>
            {details.subscriptionStatus}
          </div>
        </div>

        <p className={styles.planDescription}>{currentPlan.description}</p>

        <div className={styles.planFeatures}>
          <strong>Features included:</strong>
          <ul>
            {currentPlan.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subscription Details */}
      {details.hasSubscription && details.paypalSubscription && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Billing Information</h3>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Subscription ID:</span>
              <span className={styles.detailValue}>{details.paypalSubscription.id}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Started:</span>
              <span className={styles.detailValue}>{formatDate(details.paypalSubscription.startTime)}</span>
            </div>

            {details.paypalSubscription.nextBillingTime && !details.cancelAtPeriodEnd && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Next Billing Date:</span>
                <span className={styles.detailValue}>
                  {formatDate(details.paypalSubscription.nextBillingTime)}
                </span>
              </div>
            )}

            {details.paypalSubscription.lastPayment && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Payment:</span>
                <span className={styles.detailValue}>
                  ${details.paypalSubscription.lastPayment.amount.value} on{' '}
                  {formatDate(details.paypalSubscription.lastPayment.time)}
                </span>
              </div>
            )}

            {details.cancelAtPeriodEnd && details.subscriptionEndsAt && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Access Ends:</span>
                <span className={styles.detailValue}>{formatDate(details.subscriptionEndsAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trial Information */}
      {details.subscriptionStatus === 'TRIAL' && details.trialEndsAt && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Trial Period</h3>
          <div className={styles.trialInfo}>
            <p>Your 7-day free trial ends on <strong>{formatDate(details.trialEndsAt)}</strong></p>
            <p>Upgrade to a paid plan to continue using all features after your trial ends.</p>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Change Plan</h3>
        <p className={styles.upgradeText}>
          Want to upgrade or change your plan? Visit our{' '}
          <a href="/pricing" className={styles.link} target="_blank">
            pricing page
          </a>{' '}
          to see all available options.
        </p>
      </div>

      {/* Cancellation */}
      {details.subscriptionStatus === 'ACTIVE' && !details.cancelAtPeriodEnd && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Cancel Subscription</h3>

          {!showCancelConfirm ? (
            <div>
              <p className={styles.cancelWarning}>
                Canceling your subscription will take effect at the end of your current billing period.
              </p>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className={styles.cancelButton}
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div className={styles.cancelConfirm}>
              <p className={styles.cancelPolicyTitle}>
                <strong>Cancellation Policy:</strong>
              </p>
              <ul className={styles.cancelPolicy}>
                <li>Your data will be retained for 12 months</li>
                <li>All points and USDC earned by your customers will remain with them (not refunded)</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>
                  For example: If you paid on January 3rd and cancel on January 4th, your subscription will
                  not renew on February 3rd
                </li>
              </ul>

              <div className={styles.cancelForm}>
                <label className={styles.label}>
                  Please tell us why you're canceling (required):
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Your feedback helps us improve..."
                />
              </div>

              <div className={styles.cancelButtons}>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling || !cancelReason.trim()}
                  className={styles.confirmCancelButton}
                >
                  {canceling ? 'Canceling...' : 'Confirm Cancellation'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelReason('');
                  }}
                  className={styles.keepSubscriptionButton}
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canceled Status */}
      {details.cancelAtPeriodEnd && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Subscription Canceled</h3>
          <div className={styles.canceledInfo}>
            <p>
              Your subscription has been canceled and will not renew. You can continue to access all features
              until <strong>{formatDate(details.subscriptionEndsAt)}</strong>.
            </p>
            <p>Want to reactivate? Contact support or subscribe again from our pricing page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
