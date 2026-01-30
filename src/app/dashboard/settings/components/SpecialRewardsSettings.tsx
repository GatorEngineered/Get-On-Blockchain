'use client';

import React, { useState, useEffect } from 'react';
import styles from './SpecialRewardsSettings.module.css';

interface SpecialRewardsSettingsProps {
  merchantData: any;
  onUpdate?: (data: any) => void;
}

interface AvailableReward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
}

interface SpecialRewardsData {
  birthday: {
    enabled: boolean;
    points: number;
    windowDays: number;
    rewardId: string | null;
    claimsThisYear: number;
  };
  anniversary: {
    enabled: boolean;
    points: number;
    windowDays: number;
    rewardId: string | null;
    claimsThisYear: number;
  };
  availableRewards: AvailableReward[];
}

export default function SpecialRewardsSettings({ merchantData, onUpdate }: SpecialRewardsSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<SpecialRewardsData | null>(null);

  // Form state
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayPoints, setBirthdayPoints] = useState(50);
  const [birthdayWindowDays, setBirthdayWindowDays] = useState(7);
  const [birthdayRewardId, setBirthdayRewardId] = useState<string | null>(null);
  const [anniversaryEnabled, setAnniversaryEnabled] = useState(false);
  const [anniversaryPoints, setAnniversaryPoints] = useState(50);
  const [anniversaryWindowDays, setAnniversaryWindowDays] = useState(7);
  const [anniversaryRewardId, setAnniversaryRewardId] = useState<string | null>(null);
  const [availableRewards, setAvailableRewards] = useState<AvailableReward[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/settings/special-rewards');
      if (!res.ok) {
        throw new Error('Failed to fetch special rewards settings');
      }
      const responseData = await res.json();
      setData(responseData);

      // Initialize form state
      setBirthdayEnabled(responseData.birthday.enabled);
      setBirthdayPoints(responseData.birthday.points);
      setBirthdayWindowDays(responseData.birthday.windowDays);
      setBirthdayRewardId(responseData.birthday.rewardId || null);
      // Use relationshipAnniversary from API
      setAnniversaryEnabled(responseData.relationshipAnniversary?.enabled || false);
      setAnniversaryPoints(responseData.relationshipAnniversary?.points || 50);
      setAnniversaryWindowDays(responseData.relationshipAnniversary?.windowDays || 7);
      setAnniversaryRewardId(responseData.relationshipAnniversary?.rewardId || null);
      setAvailableRewards(responseData.availableRewards || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/merchant/settings/special-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthdayRewardEnabled: birthdayEnabled,
          birthdayRewardPoints: birthdayPoints,
          birthdayRewardWindowDays: birthdayWindowDays,
          birthdayRewardId: birthdayRewardId,
          relationshipAnniversaryRewardEnabled: anniversaryEnabled,
          relationshipAnniversaryRewardPoints: anniversaryPoints,
          relationshipAnniversaryRewardWindowDays: anniversaryWindowDays,
          relationshipAnniversaryRewardId: anniversaryRewardId,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      fetchSettings(); // Refresh data

      if (onUpdate) {
        onUpdate(responseData);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading special rewards settings...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>Special Rewards</h2>
      <p className={styles.subtitle}>
        Reward members on their birthday and anniversary to increase engagement and loyalty
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      {/* Info Card */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>How Special Rewards Work</h3>
        <p className={styles.infoText}>
          Members can claim special rewards within a configurable window around their birthday or anniversary.
          Each reward can only be claimed once per year.
        </p>
        <ul className={styles.infoList}>
          <li>Birthday rewards require members to set their birthday in their profile</li>
          <li>Anniversary rewards use the member's join date (or custom date they set)</li>
          <li>You can adjust the claim window to give members flexibility</li>
        </ul>
      </div>

      {/* Birthday Rewards Section */}
      <div className={styles.rewardSection}>
        <div className={styles.rewardHeader}>
          <div className={styles.rewardIconWrapper} style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          </div>
          <div className={styles.rewardTitleWrapper}>
            <h3 className={styles.rewardTitle}>Birthday Rewards</h3>
            <p className={styles.rewardDescription}>
              Surprise members with bonus points on their special day
            </p>
          </div>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={birthdayEnabled}
              onChange={(e) => setBirthdayEnabled(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        {birthdayEnabled && (
          <div className={styles.rewardSettings}>
            <div className={styles.settingRow}>
              <div className={styles.settingField}>
                <label className={styles.settingLabel}>Points to Award</label>
                <input
                  type="number"
                  className={styles.settingInput}
                  value={birthdayPoints}
                  onChange={(e) => setBirthdayPoints(parseInt(e.target.value) || 0)}
                  min="1"
                  max="10000"
                />
                <p className={styles.settingHint}>Points awarded when member claims their birthday reward</p>
              </div>
              <div className={styles.settingField}>
                <label className={styles.settingLabel}>Claim Window (days)</label>
                <input
                  type="number"
                  className={styles.settingInput}
                  value={birthdayWindowDays}
                  onChange={(e) => setBirthdayWindowDays(parseInt(e.target.value) || 1)}
                  min="1"
                  max="30"
                />
                <p className={styles.settingHint}>Days before/after birthday to allow claiming</p>
              </div>
            </div>

            {/* Optional Free Reward */}
            <div className={styles.settingRow} style={{ marginTop: '1rem' }}>
              <div className={styles.settingField} style={{ flex: 1 }}>
                <label className={styles.settingLabel}>Bonus Free Reward (Optional)</label>
                <select
                  className={styles.settingInput}
                  value={birthdayRewardId || ''}
                  onChange={(e) => setBirthdayRewardId(e.target.value || null)}
                  style={{ width: '100%' }}
                >
                  <option value="">Points only (no free reward)</option>
                  {availableRewards.map((reward) => (
                    <option key={reward.id} value={reward.id}>
                      {reward.name} (normally {reward.pointsCost} pts)
                    </option>
                  ))}
                </select>
                <p className={styles.settingHint}>
                  In addition to points, member receives this reward for free on their birthday
                </p>
              </div>
            </div>

            {data && (
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{data.birthday.claimsThisYear}</span>
                  <span className={styles.statLabel}>Claims this year</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anniversary Rewards Section */}
      <div className={styles.rewardSection}>
        <div className={styles.rewardHeader}>
          <div className={styles.rewardIconWrapper} style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className={styles.rewardTitleWrapper}>
            <h3 className={styles.rewardTitle}>Anniversary Rewards</h3>
            <p className={styles.rewardDescription}>
              Celebrate members' loyalty on their membership anniversary
            </p>
          </div>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={anniversaryEnabled}
              onChange={(e) => setAnniversaryEnabled(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        {anniversaryEnabled && (
          <div className={styles.rewardSettings}>
            <div className={styles.settingRow}>
              <div className={styles.settingField}>
                <label className={styles.settingLabel}>Points to Award</label>
                <input
                  type="number"
                  className={styles.settingInput}
                  value={anniversaryPoints}
                  onChange={(e) => setAnniversaryPoints(parseInt(e.target.value) || 0)}
                  min="1"
                  max="10000"
                />
                <p className={styles.settingHint}>Points awarded when member claims their anniversary reward</p>
              </div>
              <div className={styles.settingField}>
                <label className={styles.settingLabel}>Claim Window (days)</label>
                <input
                  type="number"
                  className={styles.settingInput}
                  value={anniversaryWindowDays}
                  onChange={(e) => setAnniversaryWindowDays(parseInt(e.target.value) || 1)}
                  min="1"
                  max="30"
                />
                <p className={styles.settingHint}>Days before/after anniversary to allow claiming</p>
              </div>
            </div>

            {/* Optional Free Reward */}
            <div className={styles.settingRow} style={{ marginTop: '1rem' }}>
              <div className={styles.settingField} style={{ flex: 1 }}>
                <label className={styles.settingLabel}>Bonus Free Reward (Optional)</label>
                <select
                  className={styles.settingInput}
                  value={anniversaryRewardId || ''}
                  onChange={(e) => setAnniversaryRewardId(e.target.value || null)}
                  style={{ width: '100%' }}
                >
                  <option value="">Points only (no free reward)</option>
                  {availableRewards.map((reward) => (
                    <option key={reward.id} value={reward.id}>
                      {reward.name} (normally {reward.pointsCost} pts)
                    </option>
                  ))}
                </select>
                <p className={styles.settingHint}>
                  In addition to points, member receives this reward for free on their anniversary
                </p>
              </div>
            </div>

            {data && (
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{data.relationshipAnniversary?.claimsThisYear || 0}</span>
                  <span className={styles.statLabel}>Claims this year</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className={styles.saveButtonWrapper}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
