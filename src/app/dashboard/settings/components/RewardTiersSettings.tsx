'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './RewardTiersSettings.module.css';
import { getTierDisplay, getTierBadgeText, getTierFullName, tiersByPlan, TierDisplayInfo } from '@/app/lib/tier-display';

interface RewardTiersSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

// Tier badge colors
const tierColors: Record<string, { bg: string; text: string }> = {
  BASE: { bg: '#e5e7eb', text: '#374151' },
  VIP: { bg: '#dbeafe', text: '#1e40af' },
  SERGEANT: { bg: '#d1fae5', text: '#065f46' },
  CAPTAIN: { bg: '#e0e7ff', text: '#3730a3' },
  MAJOR: { bg: '#fce7f3', text: '#9d174d' },
  SUPER: { bg: '#fef3c7', text: '#92400e' },
};

export default function RewardTiersSettings({ merchantData, onUpdate }: RewardTiersSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [tiers, setTiers] = useState({
    welcomePoints: merchantData?.welcomePoints || 10,
    earnPerVisit: merchantData?.earnPerVisit || 10,
    vipThreshold: merchantData?.vipThreshold || 100,
    superThreshold: merchantData?.superThreshold || 200,
    payoutMilestonePoints: merchantData?.payoutMilestonePoints || 100,
    payoutAmountUSD: merchantData?.payoutAmountUSD || 5.0,
    payoutEnabled: merchantData?.payoutEnabled ?? false,
  });

  // Custom thresholds for intermediate tiers (stored in state when editing)
  const [customTierThresholds, setCustomTierThresholds] = useState<Record<string, number>>({});

  useEffect(() => {
    if (merchantData) {
      setTiers({
        welcomePoints: merchantData.welcomePoints || 10,
        earnPerVisit: merchantData.earnPerVisit || 10,
        vipThreshold: merchantData.vipThreshold || 100,
        superThreshold: merchantData.superThreshold || 200,
        payoutMilestonePoints: merchantData.payoutMilestonePoints || 100,
        payoutAmountUSD: merchantData.payoutAmountUSD || 5.0,
        payoutEnabled: merchantData.payoutEnabled ?? false,
      });
      // Initialize custom tier thresholds from merchantData if available
      if (merchantData.customTierThresholds) {
        setCustomTierThresholds(merchantData.customTierThresholds);
      }
    }
  }, [merchantData]);

  async function handleSave() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate
      if (tiers.vipThreshold >= tiers.superThreshold) {
        setError('Soldier threshold must be less than General threshold');
        setLoading(false);
        return;
      }

      // Build the request data including custom tier thresholds
      const requestData = {
        ...tiers,
        customTierThresholds,
      };

      const res = await fetch('/api/merchant/reward-tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update reward tiers');
      }

      const data = await res.json();
      setSuccess('Reward tiers updated successfully!');
      setEditing(false);

      // Update parent component
      onUpdate(data.tiers);
    } catch (err: any) {
      setError(err.message || 'Failed to update reward tiers');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    // Reset to current merchant data
    setTiers({
      welcomePoints: merchantData?.welcomePoints || 10,
      earnPerVisit: merchantData?.earnPerVisit || 10,
      vipThreshold: merchantData?.vipThreshold || 100,
      superThreshold: merchantData?.superThreshold || 200,
      payoutMilestonePoints: merchantData?.payoutMilestonePoints || 100,
      payoutAmountUSD: merchantData?.payoutAmountUSD || 5.0,
      payoutEnabled: merchantData?.payoutEnabled ?? false,
    });
    setCustomTierThresholds(merchantData?.customTierThresholds || {});
    setEditing(false);
    setError('');
  }

  function calculateVisitsToTier(threshold: number): number {
    return Math.ceil(threshold / tiers.earnPerVisit);
  }

  // Get tiers for the current plan with calculated thresholds
  const planTiers = useMemo(() => {
    const plan = merchantData?.plan || 'STARTER';
    const tierKeys = tiersByPlan[plan] || tiersByPlan.STARTER;
    const vip = tiers.vipThreshold;
    const general = tiers.superThreshold;

    // Calculate intermediate thresholds evenly distributed (as defaults)
    const result: Array<{ key: string; threshold: number; nextThreshold: number | null; isIntermediate: boolean }> = [];

    // Calculate default intermediate thresholds
    const intermediates = tierKeys.filter(k => k !== 'BASE' && k !== 'VIP' && k !== 'SUPER');
    const step = intermediates.length > 0 ? (general - vip) / (intermediates.length + 1) : 0;

    tierKeys.forEach((key, index) => {
      let threshold = 0;
      let isIntermediate = false;

      if (key === 'BASE') {
        threshold = 0;
      } else if (key === 'VIP') {
        threshold = vip;
      } else if (key === 'SUPER') {
        threshold = general;
      } else {
        // Intermediate tiers - use custom threshold if set, otherwise calculate
        isIntermediate = true;
        const intermediateIndex = intermediates.indexOf(key);
        const defaultThreshold = Math.round(vip + step * (intermediateIndex + 1));
        threshold = customTierThresholds[key] ?? defaultThreshold;
      }

      result.push({ key, threshold, nextThreshold: null, isIntermediate });
    });

    // Sort by threshold to calculate nextThreshold correctly
    result.sort((a, b) => a.threshold - b.threshold);

    // Calculate nextThreshold for each tier
    result.forEach((tier, index) => {
      if (index < result.length - 1) {
        tier.nextThreshold = result[index + 1].threshold;
      }
    });

    // Re-sort by original order
    return tierKeys.map(key => result.find(r => r.key === key)!);
  }, [merchantData?.plan, tiers.vipThreshold, tiers.superThreshold, customTierThresholds]);

  return (
    <div>
      <h2 className={styles.title}>Reward Tiers</h2>
      <p className={styles.subtitle}>
        Configure points earned and tier thresholds for your loyalty program
      </p>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Points Configuration */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Points Configuration</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className={styles.editButton}>
              Edit
            </button>
          )}
        </div>

        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <label className={styles.label}>Welcome Points</label>
            <p className={styles.description}>Points awarded when a new member signs up</p>
            {editing ? (
              <input
                type="number"
                value={tiers.welcomePoints}
                onChange={(e) =>
                  setTiers({ ...tiers, welcomePoints: parseInt(e.target.value) || 0 })
                }
                className={styles.input}
                min="0"
              />
            ) : (
              <div className={styles.value}>{tiers.welcomePoints} points</div>
            )}
          </div>

          <div className={styles.configItem}>
            <label className={styles.label}>Points per Visit</label>
            <p className={styles.description}>Points earned each time a member scans the QR code</p>
            {editing ? (
              <input
                type="number"
                value={tiers.earnPerVisit}
                onChange={(e) =>
                  setTiers({ ...tiers, earnPerVisit: parseInt(e.target.value) || 0 })
                }
                className={styles.input}
                min="0"
              />
            ) : (
              <div className={styles.value}>{tiers.earnPerVisit} points</div>
            )}
          </div>
        </div>

        {editing && (
          <div className={styles.buttonGroup}>
            <button onClick={handleSave} disabled={loading} className={styles.saveButton}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Tier Thresholds */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Tier Thresholds</h3>
        <p className={styles.cardDescription}>
          Set point requirements for each membership tier level ({planTiers.length} tiers on {merchantData?.plan || 'STARTER'} plan)
        </p>

        <div className={styles.tiersList}>
          {planTiers.map(({ key, threshold, nextThreshold, isIntermediate }, index) => {
            const colors = tierColors[key] || tierColors.BASE;
            const tierInfo = getTierDisplay(key);
            const isEditable = key !== 'BASE'; // All tiers except BASE are editable
            const isLastTier = nextThreshold === null;

            return (
              <div key={key} className={styles.tierItem}>
                <div className={styles.tierHeader}>
                  <div
                    className={styles.tierBadge}
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {getTierBadgeText(key)}
                  </div>
                  <div className={styles.tierName}>{getTierFullName(key)}</div>
                </div>
                <div className={styles.tierDetails}>
                  {editing && isEditable ? (
                    <div className={styles.thresholdEdit}>
                      <label className={styles.smallLabel}>Threshold:</label>
                      <input
                        type="number"
                        value={
                          key === 'VIP'
                            ? tiers.vipThreshold
                            : key === 'SUPER'
                            ? tiers.superThreshold
                            : (customTierThresholds[key] ?? threshold)
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (key === 'VIP') {
                            setTiers({ ...tiers, vipThreshold: val });
                          } else if (key === 'SUPER') {
                            setTiers({ ...tiers, superThreshold: val });
                          } else {
                            // Intermediate tier - store in customTierThresholds
                            setCustomTierThresholds({ ...customTierThresholds, [key]: val });
                          }
                        }}
                        className={styles.smallInput}
                        min="0"
                      />
                      <span>points</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.tierRange}>
                        {isLastTier
                          ? `${threshold}+ points`
                          : `${threshold} - ${(nextThreshold || threshold + 1) - 1} points`
                        }
                      </div>
                      <div className={styles.tierVisits}>
                        {tierInfo.subtitle}
                        {threshold > 0 && ` • Unlocked after ${calculateVisitsToTier(threshold)} visits`}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout Configuration */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Payout Rewards (USDC)</h3>
        <p className={styles.cardDescription}>
          Configure milestone points and USDC payout amount for Premium plan members
        </p>

        {/* Enable/Disable Toggle */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div
              onClick={() => editing && setTiers({ ...tiers, payoutEnabled: !tiers.payoutEnabled })}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                background: tiers.payoutEnabled ? '#10b981' : '#d1d5db',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: editing ? 'pointer' : 'not-allowed',
                opacity: editing ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: tiers.payoutEnabled ? '25px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#374151' }}>
                {tiers.payoutEnabled ? 'USDC Payouts Enabled' : 'USDC Payouts Disabled'}
              </span>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                {tiers.payoutEnabled
                  ? 'Members can claim USDC rewards when they reach the milestone'
                  : 'USDC payout option will not be shown to members'}
              </p>
            </div>
          </label>
        </div>

        <div className={styles.payoutConfig} style={{ opacity: tiers.payoutEnabled ? 1 : 0.5, pointerEvents: tiers.payoutEnabled ? 'auto' : 'none' }}>
          <div className={styles.payoutItem}>
            <label className={styles.label}>Milestone Points</label>
            <p className={styles.description}>Points required to redeem USDC payout</p>
            {editing ? (
              <input
                type="number"
                value={tiers.payoutMilestonePoints}
                onChange={(e) =>
                  setTiers({ ...tiers, payoutMilestonePoints: parseInt(e.target.value) || 0 })
                }
                className={styles.input}
                min="0"
              />
            ) : (
              <div className={styles.value}>{tiers.payoutMilestonePoints} points</div>
            )}
          </div>

          <div className={styles.payoutItem}>
            <label className={styles.label}>Payout Amount</label>
            <p className={styles.description}>USDC amount sent when milestone is reached</p>
            {editing ? (
              <div className={styles.currencyInput}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={tiers.payoutAmountUSD}
                  onChange={(e) =>
                    setTiers({ ...tiers, payoutAmountUSD: parseFloat(e.target.value) || 0 })
                  }
                  className={styles.input}
                  min="0"
                />
                <span className={styles.currencyLabel}>USDC</span>
              </div>
            ) : (
              <div className={styles.value}>${tiers.payoutAmountUSD.toFixed(2)} USDC</div>
            )}
          </div>
        </div>

        {tiers.payoutEnabled && (
          <div className={styles.payoutSummary}>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Payout Ratio:</div>
              <div className={styles.summaryValue}>
                {tiers.payoutMilestonePoints} points = ${tiers.payoutAmountUSD.toFixed(2)} USDC
              </div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Visits Required:</div>
              <div className={styles.summaryValue}>
                {calculateVisitsToTier(tiers.payoutMilestonePoints)} visits per payout
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>How Reward Tiers Work</h4>
        <ul className={styles.infoList}>
          <li>Members start as a {getTierDisplay('BASE').name} and earn points with each visit</li>
          <li>As members accumulate points, they automatically advance to higher ranks</li>
          <li>Higher ranks can unlock special perks and recognition in your business</li>
          <li>
            Members on Premium plan can redeem {tiers.payoutMilestonePoints} points for $
            {tiers.payoutAmountUSD.toFixed(2)} USDC
          </li>
          <li>Points accumulate across all your business locations</li>
        </ul>
      </div>
    </div>
  );
}
