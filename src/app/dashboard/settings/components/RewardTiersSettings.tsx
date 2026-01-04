'use client';

import React, { useState, useEffect } from 'react';
import styles from './RewardTiersSettings.module.css';

interface RewardTiersSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

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
  });

  useEffect(() => {
    if (merchantData) {
      setTiers({
        welcomePoints: merchantData.welcomePoints || 10,
        earnPerVisit: merchantData.earnPerVisit || 10,
        vipThreshold: merchantData.vipThreshold || 100,
        superThreshold: merchantData.superThreshold || 200,
        payoutMilestonePoints: merchantData.payoutMilestonePoints || 100,
        payoutAmountUSD: merchantData.payoutAmountUSD || 5.0,
      });
    }
  }, [merchantData]);

  async function handleSave() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate
      if (tiers.vipThreshold >= tiers.superThreshold) {
        setError('VIP threshold must be less than Super threshold');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/merchant/reward-tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tiers),
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
    });
    setEditing(false);
    setError('');
  }

  function calculateVisitsToTier(threshold: number): number {
    return Math.ceil(threshold / tiers.earnPerVisit);
  }

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
          Set point requirements for each membership tier level
        </p>

        <div className={styles.tiersList}>
          {/* Base Tier */}
          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={styles.tierBadge} style={{ background: '#e5e7eb', color: '#374151' }}>
                BASE
              </div>
              <div className={styles.tierName}>Base Member</div>
            </div>
            <div className={styles.tierDetails}>
              <div className={styles.tierRange}>0 - {tiers.vipThreshold - 1} points</div>
              <div className={styles.tierVisits}>Starter level</div>
            </div>
          </div>

          {/* VIP Tier */}
          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={styles.tierBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>
                VIP
              </div>
              <div className={styles.tierName}>VIP Member</div>
            </div>
            <div className={styles.tierDetails}>
              {editing ? (
                <div className={styles.thresholdEdit}>
                  <label className={styles.smallLabel}>Threshold:</label>
                  <input
                    type="number"
                    value={tiers.vipThreshold}
                    onChange={(e) =>
                      setTiers({ ...tiers, vipThreshold: parseInt(e.target.value) || 0 })
                    }
                    className={styles.smallInput}
                    min="0"
                  />
                  <span>points</span>
                </div>
              ) : (
                <>
                  <div className={styles.tierRange}>
                    {tiers.vipThreshold} - {tiers.superThreshold - 1} points
                  </div>
                  <div className={styles.tierVisits}>
                    Unlocked after {calculateVisitsToTier(tiers.vipThreshold)} visits
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Super Tier */}
          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={styles.tierBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
                SUPER
              </div>
              <div className={styles.tierName}>Super Member</div>
            </div>
            <div className={styles.tierDetails}>
              {editing ? (
                <div className={styles.thresholdEdit}>
                  <label className={styles.smallLabel}>Threshold:</label>
                  <input
                    type="number"
                    value={tiers.superThreshold}
                    onChange={(e) =>
                      setTiers({ ...tiers, superThreshold: parseInt(e.target.value) || 0 })
                    }
                    className={styles.smallInput}
                    min="0"
                  />
                  <span>points</span>
                </div>
              ) : (
                <>
                  <div className={styles.tierRange}>{tiers.superThreshold}+ points</div>
                  <div className={styles.tierVisits}>
                    Unlocked after {calculateVisitsToTier(tiers.superThreshold)} visits
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payout Configuration */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Payout Rewards (USDC)</h3>
        <p className={styles.cardDescription}>
          Configure milestone points and USDC payout amount for Premium plan members
        </p>

        <div className={styles.payoutConfig}>
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
      </div>

      {/* Info Note */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>How Reward Tiers Work</h4>
        <ul className={styles.infoList}>
          <li>Members start in the BASE tier and earn points with each visit</li>
          <li>As members accumulate points, they automatically advance to higher tiers</li>
          <li>Higher tiers can unlock special perks and recognition in your business</li>
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
