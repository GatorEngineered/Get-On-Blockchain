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

interface MemberLimitStatus {
  currentCount: number;
  baseLimit: number;
  addonSlots: number;
  addonMembers: number;
  totalLimit: number;
  effectiveLimit: number;
  remaining: number;
  percentUsed: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
  inGracePeriod: boolean;
  gracePeriodDaysRemaining: number;
  canAddMembers: boolean;
}

interface MemberAddonInfo {
  pricePerSlot: number;
  membersPerSlot: number;
  canPurchase: boolean;
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
    price: 49,
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
    price: 99,
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
    price: 149,
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
    price: 199,
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

  // Member limit state
  const [memberLimitStatus, setMemberLimitStatus] = useState<MemberLimitStatus | null>(null);
  const [memberAddonInfo, setMemberAddonInfo] = useState<MemberAddonInfo | null>(null);
  const [addonSlots, setAddonSlots] = useState(1);
  const [purchasingAddon, setPurchasingAddon] = useState(false);

  // Upgrade state
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchSubscriptionDetails();
    fetchMemberLimitStatus();
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

  async function fetchMemberLimitStatus() {
    try {
      const res = await fetch('/api/merchant/member-addon');
      if (!res.ok) {
        console.error('Failed to fetch member limit status');
        return;
      }
      const data = await res.json();
      if (data.status) {
        setMemberLimitStatus(data.status);
      }
      if (data.addon) {
        setMemberAddonInfo(data.addon);
      }
    } catch (err) {
      console.error('Error fetching member limit status:', err);
    }
  }

  async function handlePurchaseAddon() {
    if (!memberAddonInfo?.canPurchase || addonSlots < 1) return;

    try {
      setPurchasingAddon(true);
      setError('');
      setSuccess('');

      // For now, we simulate a successful purchase
      // In production, this would integrate with PayPal
      const res = await fetch('/api/merchant/member-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: addonSlots,
          // paymentIntentId would come from PayPal in production
          paymentIntentId: `demo_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to purchase addon');
      }

      if (data.action === 'PAYMENT_REQUIRED') {
        // In production, redirect to PayPal payment
        setSuccess(`Ready to add ${data.purchase.membersAdded.toLocaleString()} members for $${data.purchase.cost}. Payment integration coming soon.`);
      } else {
        setSuccess(data.message);
        // Refresh member limit status
        await fetchMemberLimitStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase addon');
    } finally {
      setPurchasingAddon(false);
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

  async function handleUpgrade(targetPlan: 'BASIC' | 'PREMIUM') {
    if (!merchantData?.id || !merchantData?.loginEmail) {
      setError('Session expired. Please refresh the page.');
      return;
    }

    // Don't allow upgrade to same or lower plan
    const planHierarchy = ['STARTER', 'BASIC', 'PREMIUM', 'GROWTH', 'PRO'];
    const currentPlanIndex = planHierarchy.indexOf(details?.plan || 'STARTER');
    const targetPlanIndex = planHierarchy.indexOf(targetPlan);

    if (targetPlanIndex <= currentPlanIndex) {
      setError('Please select a higher plan to upgrade.');
      return;
    }

    setUpgrading(targetPlan);
    setError('');

    try {
      const planType = `${targetPlan}_${billingCycle.toUpperCase()}` as
        | 'BASIC_MONTHLY'
        | 'BASIC_ANNUAL'
        | 'PREMIUM_MONTHLY'
        | 'PREMIUM_ANNUAL';

      const res = await fetch('/api/merchant/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchantData.id,
          planType,
          email: merchantData.loginEmail,
          firstName: merchantData.name?.split(' ')[0] || '',
          lastName: merchantData.name?.split(' ').slice(1).join(' ') || '',
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
      console.error('Upgrade error:', err);
      setError(err.message || 'Failed to initiate upgrade');
      setUpgrading(null);
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

  function getProgressBarClass(percentUsed: number): string {
    if (percentUsed >= 100) return styles.progressFillDanger;
    if (percentUsed >= 80) return styles.progressFillWarning;
    return styles.progressFillNormal;
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

      {/* Member Limits */}
      {memberLimitStatus && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Member Limits</h3>

          {/* Grace Period Warning */}
          {memberLimitStatus.inGracePeriod && (
            <div className={styles.gracePeriodBanner}>
              <div className={styles.gracePeriodTitle}>Grace Period Active</div>
              <p className={styles.gracePeriodText}>
                You have {memberLimitStatus.gracePeriodDaysRemaining} days remaining in your grace period.
                After this period, new member restrictions will take effect based on your current plan limits.
              </p>
            </div>
          )}

          {/* Near Limit Warning */}
          {memberLimitStatus.isNearLimit && !memberLimitStatus.isAtLimit && (
            <div className={styles.warningBanner}>
              <span className={styles.warningIcon}>⚠️</span>
              <span className={styles.warningText}>
                You're approaching your member limit ({memberLimitStatus.percentUsed.toFixed(0)}% used).
                Consider upgrading or purchasing additional member slots to avoid disruption.
              </span>
            </div>
          )}

          {/* At Limit Warning */}
          {memberLimitStatus.isAtLimit && (
            <div className={styles.warningBanner}>
              <span className={styles.warningIcon}>🚫</span>
              <span className={styles.warningText}>
                You've reached your member limit. New members cannot join until you upgrade or purchase additional slots.
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className={styles.memberLimitSection}>
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Members</span>
                <span className={styles.progressCount}>
                  {memberLimitStatus.currentCount.toLocaleString()} / {memberLimitStatus.effectiveLimit.toLocaleString()}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${getProgressBarClass(memberLimitStatus.percentUsed)}`}
                  style={{ width: `${Math.min(100, memberLimitStatus.percentUsed)}%` }}
                />
              </div>
            </div>

            {/* Limit Details */}
            <div className={styles.limitInfo}>
              <div className={styles.limitItem}>
                <span className={styles.limitItemLabel}>Base Limit</span>
                <span className={styles.limitItemValue}>{memberLimitStatus.baseLimit.toLocaleString()}</span>
              </div>
              {memberLimitStatus.addonSlots > 0 && (
                <div className={styles.limitItem}>
                  <span className={styles.limitItemLabel}>Addon Slots</span>
                  <span className={styles.limitItemValue}>+{memberLimitStatus.addonMembers.toLocaleString()}</span>
                </div>
              )}
              <div className={styles.limitItem}>
                <span className={styles.limitItemLabel}>Remaining</span>
                <span className={styles.limitItemValue}>{memberLimitStatus.remaining.toLocaleString()}</span>
              </div>
            </div>

            {/* Addon Purchase Section */}
            {memberAddonInfo?.canPurchase && (
              <div className={styles.addonSection}>
                <div className={styles.addonTitle}>Need More Members?</div>
                <p className={styles.addonDescription}>
                  Purchase additional member slots at ${memberAddonInfo.pricePerSlot} per {memberAddonInfo.membersPerSlot.toLocaleString()} members.
                </p>
                <div className={styles.addonControls}>
                  <div className={styles.addonInput}>
                    <label>Slots:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={addonSlots}
                      onChange={(e) => setAddonSlots(Math.max(1, parseInt(e.target.value) || 1))}
                      className={styles.addonInputField}
                    />
                  </div>
                  <span className={styles.addonCost}>
                    = {(addonSlots * memberAddonInfo.membersPerSlot).toLocaleString()} members for ${addonSlots * memberAddonInfo.pricePerSlot}
                  </span>
                  <button
                    onClick={handlePurchaseAddon}
                    disabled={purchasingAddon}
                    className={styles.addonButton}
                  >
                    {purchasingAddon ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            )}

            {/* Starter Plan Message */}
            {!memberAddonInfo?.canPurchase && details?.plan === 'STARTER' && (
              <div className={styles.addonSection}>
                <div className={styles.addonTitle}>Upgrade to Add More Members</div>
                <p className={styles.addonDescription}>
                  The Starter plan is limited to {memberLimitStatus.baseLimit} members.
                  Upgrade to a paid plan to unlock more members and additional features.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
      {(details.plan === 'STARTER' || details.plan === 'BASIC') && !details.hasSubscription && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Upgrade Your Plan</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Unlock more features and capacity by upgrading to a paid plan.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#244b7a' : '#e5e7eb',
                color: billingCycle === 'monthly' ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: billingCycle === 'annual' ? '#244b7a' : '#e5e7eb',
                color: billingCycle === 'annual' ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Annual
              <span style={{
                background: billingCycle === 'annual' ? 'rgba(255,255,255,0.2)' : '#d1fae5',
                color: billingCycle === 'annual' ? 'white' : '#065f46',
                padding: '0.15rem 0.4rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: '700',
              }}>
                2 months free
              </span>
            </button>
          </div>

          {/* Plan Options */}
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {/* Basic Plan */}
            {details.plan === 'STARTER' && (
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.25rem',
                background: '#f9fafb',
              }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>Basic</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#244b7a', margin: '0 0 0.5rem' }}>
                  ${billingCycle === 'annual' ? '490' : '49'}
                  <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#6b7280' }}>
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </p>
                <ul style={{ margin: '0 0 1rem', padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: '#4b5563' }}>
                  <li>Up to 1,000 members</li>
                  <li>Unlimited rewards</li>
                  <li>Email support</li>
                </ul>
                <button
                  onClick={() => handleUpgrade('BASIC')}
                  disabled={upgrading === 'BASIC'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: upgrading === 'BASIC' ? '#9ca3af' : '#244b7a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: upgrading === 'BASIC' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {upgrading === 'BASIC' ? 'Processing...' : 'Upgrade to Basic'}
                </button>
              </div>
            )}

            {/* Premium Plan */}
            <div style={{
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                right: '1rem',
                background: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                Most Popular
              </span>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>Premium</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#065f46', margin: '0 0 0.5rem' }}>
                ${billingCycle === 'annual' ? '990' : '99'}
                <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#047857' }}>
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </p>
              <ul style={{ margin: '0 0 1rem', padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: '#065f46' }}>
                <li>Up to 5,000 members</li>
                <li>USDC stablecoin rewards</li>
                <li>Blockchain verification</li>
                <li>Priority support</li>
              </ul>
              <button
                onClick={() => handleUpgrade('PREMIUM')}
                disabled={upgrading === 'PREMIUM'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: upgrading === 'PREMIUM' ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: upgrading === 'PREMIUM' ? 'not-allowed' : 'pointer',
                }}
              >
                {upgrading === 'PREMIUM' ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
            All paid plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      )}

      {/* Already subscribed - link to pricing */}
      {details.hasSubscription && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Change Plan</h3>
          <p className={styles.upgradeText}>
            Want to change your plan? Visit our{' '}
            <a href="/pricing" className={styles.link} target="_blank">
              pricing page
            </a>{' '}
            or contact support for assistance.
          </p>
        </div>
      )}

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
