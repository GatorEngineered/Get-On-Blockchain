'use client';

import React, { useState, useEffect } from 'react';
import styles from './RewardsSettings.module.css';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: 'TRADITIONAL' | 'USDC_PAYOUT';
  usdcAmount: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface RewardsSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

export default function RewardsSettings({ merchantData, onUpdate }: RewardsSettingsProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: 50,
    rewardType: 'TRADITIONAL' as 'TRADITIONAL' | 'USDC_PAYOUT',
    usdcAmount: '',
    isActive: true,
  });

  // Referral settings state
  const [referralEnabled, setReferralEnabled] = useState(merchantData?.referralEnabled ?? true);
  const [referralPointsValue, setReferralPointsValue] = useState(merchantData?.referralPointsValue ?? 50);
  const [savingReferral, setSavingReferral] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState('');

  // Special rewards (birthday/anniversaries) state
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayPoints, setBirthdayPoints] = useState(50);
  const [birthdayWindowDays, setBirthdayWindowDays] = useState(7);
  const [birthdayClaimsThisYear, setBirthdayClaimsThisYear] = useState(0);
  // Member Anniversary (join date)
  const [memberAnniversaryEnabled, setMemberAnniversaryEnabled] = useState(false);
  const [memberAnniversaryPoints, setMemberAnniversaryPoints] = useState(50);
  const [memberAnniversaryWindowDays, setMemberAnniversaryWindowDays] = useState(7);
  const [memberAnniversaryClaimsThisYear, setMemberAnniversaryClaimsThisYear] = useState(0);
  // Relationship Anniversary (wedding/relationship)
  const [relationshipAnniversaryEnabled, setRelationshipAnniversaryEnabled] = useState(false);
  const [relationshipAnniversaryPoints, setRelationshipAnniversaryPoints] = useState(50);
  const [relationshipAnniversaryWindowDays, setRelationshipAnniversaryWindowDays] = useState(7);
  const [relationshipAnniversaryClaimsThisYear, setRelationshipAnniversaryClaimsThisYear] = useState(0);
  const [savingSpecialRewards, setSavingSpecialRewards] = useState(false);
  const [specialRewardsSuccess, setSpecialRewardsSuccess] = useState('');

  useEffect(() => {
    fetchRewards();
    fetchSpecialRewardsSettings();
  }, []);

  async function fetchRewards() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/rewards');
      if (!res.ok) throw new Error('Failed to fetch rewards');
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSpecialRewardsSettings() {
    try {
      const res = await fetch('/api/merchant/settings/special-rewards');
      if (res.ok) {
        const data = await res.json();
        // Birthday
        setBirthdayEnabled(data.birthday.enabled);
        setBirthdayPoints(data.birthday.points);
        setBirthdayWindowDays(data.birthday.windowDays);
        setBirthdayClaimsThisYear(data.birthday.claimsThisYear || 0);
        // Member Anniversary
        setMemberAnniversaryEnabled(data.memberAnniversary.enabled);
        setMemberAnniversaryPoints(data.memberAnniversary.points);
        setMemberAnniversaryWindowDays(data.memberAnniversary.windowDays);
        setMemberAnniversaryClaimsThisYear(data.memberAnniversary.claimsThisYear || 0);
        // Relationship Anniversary
        setRelationshipAnniversaryEnabled(data.relationshipAnniversary.enabled);
        setRelationshipAnniversaryPoints(data.relationshipAnniversary.points);
        setRelationshipAnniversaryWindowDays(data.relationshipAnniversary.windowDays);
        setRelationshipAnniversaryClaimsThisYear(data.relationshipAnniversary.claimsThisYear || 0);
      }
    } catch (err) {
      console.error('Failed to fetch special rewards settings:', err);
    }
  }

  async function handleSaveSpecialRewards() {
    try {
      setSavingSpecialRewards(true);
      setError('');
      setSpecialRewardsSuccess('');

      const res = await fetch('/api/merchant/settings/special-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Birthday
          birthdayRewardEnabled: birthdayEnabled,
          birthdayRewardPoints: birthdayPoints,
          birthdayRewardWindowDays: birthdayWindowDays,
          // Member Anniversary
          memberAnniversaryRewardEnabled: memberAnniversaryEnabled,
          memberAnniversaryRewardPoints: memberAnniversaryPoints,
          memberAnniversaryRewardWindowDays: memberAnniversaryWindowDays,
          // Relationship Anniversary
          relationshipAnniversaryRewardEnabled: relationshipAnniversaryEnabled,
          relationshipAnniversaryRewardPoints: relationshipAnniversaryPoints,
          relationshipAnniversaryRewardWindowDays: relationshipAnniversaryWindowDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save special rewards settings');
      }

      setSpecialRewardsSuccess('Special rewards settings saved!');
      setTimeout(() => setSpecialRewardsSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSpecialRewards(false);
    }
  }

  function openCreateModal() {
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      pointsCost: 50,
      rewardType: 'TRADITIONAL',
      usdcAmount: '',
      isActive: true,
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function openEditModal(reward: Reward) {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      usdcAmount: reward.usdcAmount?.toString() || '',
      isActive: reward.isActive,
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Reward name is required');
      return;
    }

    if (formData.rewardType === 'USDC_PAYOUT' && !formData.usdcAmount) {
      setError('USDC amount is required for payout rewards');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = editingReward
        ? `/api/merchant/rewards/${editingReward.id}`
        : '/api/merchant/rewards';

      const method = editingReward ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          pointsCost: formData.pointsCost,
          rewardType: formData.rewardType,
          usdcAmount: formData.rewardType === 'USDC_PAYOUT' ? formData.usdcAmount : null,
          isActive: formData.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save reward');
      }

      setSuccess(editingReward ? 'Reward updated!' : 'Reward created!');
      setShowModal(false);
      fetchRewards();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reward: Reward) {
    if (!confirm(`Are you sure you want to delete "${reward.name}"?`)) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/merchant/rewards/${reward.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete reward');
      }

      setSuccess('Reward deleted');
      fetchRewards();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(reward: Reward) {
    try {
      const res = await fetch(`/api/merchant/rewards/${reward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !reward.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update reward');

      fetchRewards();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSaveReferralSettings() {
    try {
      setSavingReferral(true);
      setError('');
      setReferralSuccess('');

      const res = await fetch('/api/merchant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralEnabled,
          referralPointsValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save referral settings');
      }

      setReferralSuccess('Referral settings saved!');
      // Update parent component
      onUpdate({
        ...merchantData,
        referralEnabled,
        referralPointsValue,
      });

      setTimeout(() => setReferralSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingReferral(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className={styles.title}>Rewards Catalog</h2>
        <div className={styles.loadingState}>Loading rewards...</div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Rewards Catalog</h2>
          <p className={styles.subtitle}>
            Create and manage rewards that customers can redeem with their points
          </p>
        </div>
        <button onClick={openCreateModal} className={styles.addButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Reward
        </button>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Rewards List */}
      {rewards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No rewards yet</h3>
          <p className={styles.emptyText}>
            Create your first reward to give customers something to work towards!
          </p>
          <button onClick={openCreateModal} className={styles.emptyButton}>
            Create Your First Reward
          </button>
        </div>
      ) : (
        <div className={styles.rewardsList}>
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`${styles.rewardCard} ${!reward.isActive ? styles.inactive : ''}`}
            >
              <div className={styles.rewardHeader}>
                <div className={styles.rewardInfo}>
                  <h3 className={styles.rewardName}>{reward.name}</h3>
                  {reward.description && (
                    <p className={styles.rewardDescription}>{reward.description}</p>
                  )}
                </div>
                <div className={styles.rewardBadges}>
                  <span className={`${styles.typeBadge} ${reward.rewardType === 'USDC_PAYOUT' ? styles.usdcBadge : ''}`}>
                    {reward.rewardType === 'USDC_PAYOUT' ? 'USDC Payout' : 'Traditional'}
                  </span>
                  {!reward.isActive && (
                    <span className={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
              </div>

              <div className={styles.rewardDetails}>
                <div className={styles.pointsCost}>
                  <span className={styles.pointsValue}>{reward.pointsCost}</span>
                  <span className={styles.pointsLabel}>points</span>
                </div>
                {reward.rewardType === 'USDC_PAYOUT' && reward.usdcAmount && (
                  <div className={styles.usdcAmount}>
                    ${reward.usdcAmount.toFixed(2)} USDC
                  </div>
                )}
              </div>

              <div className={styles.rewardActions}>
                <button
                  onClick={() => toggleActive(reward)}
                  className={`${styles.toggleButton} ${reward.isActive ? styles.activeToggle : ''}`}
                  title={reward.isActive ? 'Deactivate' : 'Activate'}
                >
                  {reward.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => openEditModal(reward)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(reward)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Referral Settings Section */}
      <div className={styles.infoCard} style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h4 className={styles.infoTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎁</span>
              Referral Program
            </h4>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Let members earn points by referring friends to your loyalty program
            </p>
          </div>
        </div>

        {referralSuccess && (
          <div className={styles.successAlert} style={{ marginBottom: '1rem' }}>
            {referralSuccess}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
          }}>
            <div>
              <label style={{ fontWeight: '600', color: '#1f2937' }}>
                Enable Referrals
              </label>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                Show referral option in member dashboard
              </p>
            </div>
            <button
              onClick={() => setReferralEnabled(!referralEnabled)}
              style={{
                width: '50px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: referralEnabled ? '#10b981' : '#d1d5db',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: referralEnabled ? '24px' : '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '12px',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>

          {referralEnabled && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
            }}>
              <div>
                <label style={{ fontWeight: '600', color: '#92400e' }}>
                  Points Per Referral
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#78350f' }}>
                  Points awarded when referred friend signs up
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={referralPointsValue}
                  onChange={(e) => setReferralPointsValue(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                  style={{
                    width: '80px',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    background: 'white',
                  }}
                />
                <span style={{ color: '#92400e', fontWeight: '500' }}>pts</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveReferralSettings}
            disabled={savingReferral}
            style={{
              padding: '0.75rem 1.5rem',
              background: savingReferral ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: savingReferral ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
            }}
          >
            {savingReferral ? 'Saving...' : 'Save Referral Settings'}
          </button>
        </div>
      </div>

      {/* Special Rewards (Birthday & Anniversary) Section */}
      <div className={styles.infoCard} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 className={styles.infoTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎂</span>
            Special Rewards
          </h4>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Reward members on their birthday and relationship anniversary to increase engagement
          </p>
        </div>

        {specialRewardsSuccess && (
          <div className={styles.successAlert} style={{ marginBottom: '1rem' }}>
            {specialRewardsSuccess}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Birthday Rewards */}
          <div style={{
            padding: '1rem',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#92400e' }}>
                  Birthday Rewards
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#78350f' }}>
                  Members can claim once per year around their birthday
                </p>
              </div>
              <button
                onClick={() => setBirthdayEnabled(!birthdayEnabled)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: birthdayEnabled ? '#f59e0b' : '#d1d5db',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: birthdayEnabled ? '24px' : '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {birthdayEnabled && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#78350f', marginBottom: '0.25rem' }}>Points</label>
                  <input
                    type="number"
                    value={birthdayPoints}
                    onChange={(e) => setBirthdayPoints(parseInt(e.target.value) || 0)}
                    min="1"
                    max="10000"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #fcd34d',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#78350f', marginBottom: '0.25rem' }}>Window (days)</label>
                  <input
                    type="number"
                    value={birthdayWindowDays}
                    onChange={(e) => setBirthdayWindowDays(parseInt(e.target.value) || 1)}
                    min="1"
                    max="30"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #fcd34d',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                {birthdayClaimsThisYear > 0 && (
                  <div style={{ flex: '1', minWidth: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#78350f' }}>Claims this year</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#92400e' }}>{birthdayClaimsThisYear}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member Anniversary Rewards (Join Date) */}
          <div style={{
            padding: '1rem',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#1e40af' }}>
                  Member Anniversary Rewards
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
                  Members can claim once per year on their membership anniversary (join date)
                </p>
              </div>
              <button
                onClick={() => setMemberAnniversaryEnabled(!memberAnniversaryEnabled)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: memberAnniversaryEnabled ? '#3b82f6' : '#d1d5db',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: memberAnniversaryEnabled ? '24px' : '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {memberAnniversaryEnabled && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Points</label>
                  <input
                    type="number"
                    value={memberAnniversaryPoints}
                    onChange={(e) => setMemberAnniversaryPoints(parseInt(e.target.value) || 0)}
                    min="1"
                    max="10000"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #93c5fd',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Window (days)</label>
                  <input
                    type="number"
                    value={memberAnniversaryWindowDays}
                    onChange={(e) => setMemberAnniversaryWindowDays(parseInt(e.target.value) || 1)}
                    min="1"
                    max="30"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #93c5fd',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                {memberAnniversaryClaimsThisYear > 0 && (
                  <div style={{ flex: '1', minWidth: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#1e3a8a' }}>Claims this year</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' }}>{memberAnniversaryClaimsThisYear}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Relationship Anniversary Rewards (Wedding/Relationship Date) */}
          <div style={{
            padding: '1rem',
            background: '#fce7f3',
            border: '1px solid #f9a8d4',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#be185d' }}>
                  Relationship Anniversary Rewards
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9d174d' }}>
                  Members can claim once per year around their wedding/relationship anniversary
                </p>
              </div>
              <button
                onClick={() => setRelationshipAnniversaryEnabled(!relationshipAnniversaryEnabled)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: relationshipAnniversaryEnabled ? '#db2777' : '#d1d5db',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: relationshipAnniversaryEnabled ? '24px' : '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {relationshipAnniversaryEnabled && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9d174d', marginBottom: '0.25rem' }}>Points</label>
                  <input
                    type="number"
                    value={relationshipAnniversaryPoints}
                    onChange={(e) => setRelationshipAnniversaryPoints(parseInt(e.target.value) || 0)}
                    min="1"
                    max="10000"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #f9a8d4',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9d174d', marginBottom: '0.25rem' }}>Window (days)</label>
                  <input
                    type="number"
                    value={relationshipAnniversaryWindowDays}
                    onChange={(e) => setRelationshipAnniversaryWindowDays(parseInt(e.target.value) || 1)}
                    min="1"
                    max="30"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #f9a8d4',
                      borderRadius: '6px',
                      background: 'white',
                    }}
                  />
                </div>
                {relationshipAnniversaryClaimsThisYear > 0 && (
                  <div style={{ flex: '1', minWidth: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9d174d' }}>Claims this year</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#be185d' }}>{relationshipAnniversaryClaimsThisYear}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveSpecialRewards}
            disabled={savingSpecialRewards}
            style={{
              padding: '0.75rem 1.5rem',
              background: savingSpecialRewards ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: savingSpecialRewards ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
            }}
          >
            {savingSpecialRewards ? 'Saving...' : 'Save Special Rewards Settings'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>Reward Types</h4>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Traditional Rewards</strong>
            <p>Items redeemed at your business (e.g., Free Coffee, 10% Off). Staff marks as redeemed when claimed.</p>
          </div>
          <div className={styles.infoItem}>
            <strong>USDC Payout</strong>
            <p>Crypto rewards sent to customer's wallet. Requires wallet configuration and sufficient USDC balance.</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
              </h3>
              <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.errorAlert}>{error}</div>}

              <div className={styles.formGroup}>
                <label className={styles.label}>Reward Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  placeholder="e.g., Free Coffee, 10% Off, $5 Cashback"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.textarea}
                  placeholder="e.g., Any size, any blend"
                  rows={2}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Points Required *</label>
                  <input
                    type="number"
                    value={formData.pointsCost}
                    onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                    className={styles.input}
                    min="1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Reward Type *</label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as 'TRADITIONAL' | 'USDC_PAYOUT' })}
                    className={styles.select}
                  >
                    <option value="TRADITIONAL">Traditional (In-Store)</option>
                    <option value="USDC_PAYOUT">USDC Payout</option>
                  </select>
                </div>
              </div>

              {formData.rewardType === 'USDC_PAYOUT' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>USDC Amount *</label>
                  <div className={styles.currencyInput}>
                    <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.usdcAmount}
                      onChange={(e) => setFormData({ ...formData, usdcAmount: e.target.value })}
                      className={styles.input}
                      placeholder="5.00"
                      min="0.01"
                    />
                    <span className={styles.currencyLabel}>USDC</span>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className={styles.checkbox}
                  />
                  <span>Active (visible to customers)</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : (editingReward ? 'Update Reward' : 'Create Reward')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
