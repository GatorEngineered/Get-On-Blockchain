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

  useEffect(() => {
    fetchRewards();
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
