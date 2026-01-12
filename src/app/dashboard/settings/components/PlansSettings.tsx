'use client';

import { useState, useEffect } from 'react';
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
    features: ['5 active members', '1 location', '1 reward', 'Basic dashboard'],
  },
  BASIC: {
    name: 'Basic',
    price: 49,
    interval: 'month',
    description: 'Points & rewards for small businesses',
    features: [
      'Up to 150 active members',
      '1 location',
      'Up to 3 rewards',
      'Full dashboard & analytics',
      'Email support',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 99,
    interval: 'month',
    description: 'Everything in Basic + stablecoin rewards',
    features: [
      'Up to 500 active members',
      'Up to 3 locations',
      'Up to 7 rewards',
      'USDC stablecoin payouts',
      'Blockchain-verified rewards',
      'Priority email support',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: 149,
    interval: 'month',
    description: 'Scale your loyalty program',
    features: [
      'Up to 2,000 active members',
      'Up to 10 locations',
      'Up to 25 rewards',
      'Custom loyalty tiers',
      'Multiple milestones',
      'Priority support',
    ],
  },
  PRO: {
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'High-volume businesses with custom workflows',
    features: [
      'Up to 35,000 active members',
      'Up to 100 locations',
      'Up to 100 rewards',
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

      const res = await fetch('/api/merchant/member-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: addonSlots,
          paymentIntentId: `demo_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to purchase addon');
      }

      if (data.action === 'PAYMENT_REQUIRED') {
        setSuccess(`Ready to add ${data.purchase.membersAdded.toLocaleString()} members for $${data.purchase.cost}. Payment integration coming soon.`);
      } else {
        setSuccess(data.message);
        await fetchMemberLimitStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase addon');
    } finally {
      setPurchasingAddon(false);
    }
  }

  async function handleUpgrade(targetPlan: 'BASIC' | 'PREMIUM' | 'GROWTH') {
    if (!merchantData?.id || !merchantData?.loginEmail) {
      setError('Session expired. Please refresh the page.');
      return;
    }

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
        | 'PREMIUM_ANNUAL'
        | 'GROWTH_MONTHLY'
        | 'GROWTH_ANNUAL';

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
        <h2 className={styles.title}>Plan</h2>
        <p className={styles.subtitle}>Manage your plan and member limits</p>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div>
        <h2 className={styles.title}>Plan</h2>
        <p className={styles.subtitle}>Manage your plan and member limits</p>
        <div className={styles.errorAlert}>Failed to load plan details</div>
      </div>
    );
  }

  const currentPlan = PLAN_DETAILS[details.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.STARTER;

  return (
    <div>
      <h2 className={styles.title}>Plan</h2>
      <p className={styles.subtitle}>Manage your plan and member limits</p>

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
              <span className={styles.warningIcon}>Warning</span>
              <span className={styles.warningText}>
                You're approaching your member limit ({memberLimitStatus.percentUsed.toFixed(0)}% used).
                Consider upgrading or purchasing additional member slots.
              </span>
            </div>
          )}

          {/* At Limit Warning */}
          {memberLimitStatus.isAtLimit && (
            <div className={styles.warningBanner}>
              <span className={styles.warningIcon}>Limit Reached</span>
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
      {(details.plan === 'STARTER' || details.plan === 'BASIC' || details.plan === 'PREMIUM') && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Upgrade Your Plan</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Unlock more features and capacity by upgrading to a higher plan.
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
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                  <li>150 members</li>
                  <li>1 location</li>
                  <li>3 rewards</li>
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
                  {upgrading === 'BASIC' ? 'Processing...' : 'Upgrade'}
                </button>
              </div>
            )}

            {/* Premium Plan */}
            {(details.plan === 'STARTER' || details.plan === 'BASIC') && (
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
                  <li>500 members</li>
                  <li>3 locations</li>
                  <li>7 rewards</li>
                  <li>USDC rewards</li>
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
                  {upgrading === 'PREMIUM' ? 'Processing...' : 'Upgrade'}
                </button>
              </div>
            )}

            {/* Growth Plan */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              background: '#f9fafb',
            }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>Growth</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#244b7a', margin: '0 0 0.5rem' }}>
                ${billingCycle === 'annual' ? '1,490' : '149'}
                <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#6b7280' }}>
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </p>
              <ul style={{ margin: '0 0 1rem', padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: '#4b5563' }}>
                <li>2,000 members</li>
                <li>10 locations</li>
                <li>25 rewards</li>
                <li>Custom tiers</li>
              </ul>
              <button
                onClick={() => handleUpgrade('GROWTH')}
                disabled={upgrading === 'GROWTH'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: upgrading === 'GROWTH' ? '#9ca3af' : '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: upgrading === 'GROWTH' ? 'not-allowed' : 'pointer',
                }}
              >
                {upgrading === 'GROWTH' ? 'Processing...' : 'Upgrade'}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
            All paid plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      )}

      {/* Already on highest plan */}
      {(details.plan === 'GROWTH' || details.plan === 'PRO') && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Plan Changes</h3>
          <p className={styles.upgradeText}>
            Need to change your plan? Visit our{' '}
            <a href="/pricing" className={styles.link} target="_blank">
              pricing page
            </a>{' '}
            or contact support for assistance with custom plans.
          </p>
        </div>
      )}

      {/* Canceled Status */}
      {details.cancelAtPeriodEnd && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Subscription Canceled</h3>
          <div className={styles.canceledInfo}>
            <p>
              Your subscription has been canceled. You can continue to access all features
              until <strong>{formatDate(details.subscriptionEndsAt)}</strong>.
            </p>
            <p>
              <a href="/pricing" className={styles.link}>Resubscribe</a> to continue using premium features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
