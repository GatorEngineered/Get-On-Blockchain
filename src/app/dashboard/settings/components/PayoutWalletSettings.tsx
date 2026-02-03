'use client';

import React, { useState, useEffect } from 'react';
import styles from './PayoutWalletSettings.module.css';

interface PayoutWalletSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

interface PayoutStats {
  walletAddress: string | null;
  payoutEnabled: boolean;
  payoutAmountUSD: number;
  payoutMilestonePoints: number;
  totalPaidOut: number;
  totalPayouts: number;
  // Monthly Budget Cap
  monthlyPayoutBudget: number | null;
  payoutBudgetResetDay: number | null;
  currentMonthPayouts: number;
  lastBudgetResetAt: string | null;
  recentPayouts: Array<{
    id: string;
    memberName: string;
    memberEmail: string;
    amount: number;
    pointsDeducted: number;
    location: string;
    txHash: string | null;
    createdAt: string;
    walletAddress: string | null;
  }>;
}

export default function PayoutWalletSettings({ merchantData, onUpdate }: PayoutWalletSettingsProps) {
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settingUpWallet, setSettingUpWallet] = useState(false);

  // Budget cap form state
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [resetDay, setResetDay] = useState('1');
  const [savingBudget, setSavingBudget] = useState(false);

  // Change wallet state
  const [showChangeWallet, setShowChangeWallet] = useState(false);
  const [walletOption, setWalletOption] = useState<'custom' | 'generate'>('custom');
  const [customAddress, setCustomAddress] = useState('');
  const [changingWallet, setChangingWallet] = useState(false);

  useEffect(() => {
    fetchPayoutStats();
  }, []);

  async function fetchPayoutStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/payout-wallet/stats');

      if (!res.ok) {
        throw new Error('Failed to fetch payout statistics');
      }

      const data = await res.json();
      setStats(data);

      // Initialize budget form from stats
      if (data.monthlyPayoutBudget !== null) {
        setBudgetEnabled(true);
        setMonthlyBudget(data.monthlyPayoutBudget.toString());
        setResetDay((data.payoutBudgetResetDay || 1).toString());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payout statistics');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBudget() {
    try {
      setSavingBudget(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/payout-wallet/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: budgetEnabled,
          monthlyBudget: budgetEnabled ? parseFloat(monthlyBudget) : null,
          resetDay: budgetEnabled ? parseInt(resetDay) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save budget settings');
      }

      setSuccess('Budget settings saved successfully!');
      await fetchPayoutStats();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget settings');
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleSetupWallet() {
    try {
      setSettingUpWallet(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/payout-wallet/setup', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to setup wallet');
      }

      const data = await res.json();
      setSuccess('Payout wallet created successfully!');

      // Refresh stats
      await fetchPayoutStats();

      // Update parent component
      onUpdate({ payoutEnabled: true, payoutWalletAddress: data.walletAddress });
    } catch (err: any) {
      setError(err.message || 'Failed to setup wallet');
    } finally {
      setSettingUpWallet(false);
    }
  }

  async function handleChangeWallet() {
    try {
      setChangingWallet(true);
      setError('');
      setSuccess('');

      const body: { walletAddress?: string; generateNew?: boolean } = {};

      if (walletOption === 'custom') {
        if (!customAddress) {
          setError('Please enter a wallet address');
          setChangingWallet(false);
          return;
        }
        body.walletAddress = customAddress;
      } else {
        body.generateNew = true;
      }

      const res = await fetch('/api/merchant/payout-wallet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update wallet');
      }

      setSuccess(
        walletOption === 'custom'
          ? 'Wallet updated successfully! Fund this address with USDC to enable payouts.'
          : 'New wallet generated successfully! Fund this address with USDC to enable payouts.'
      );

      // Reset form
      setShowChangeWallet(false);
      setCustomAddress('');
      setWalletOption('custom');

      // Refresh stats
      await fetchPayoutStats();

      // Update parent component
      onUpdate({ payoutEnabled: true, payoutWalletAddress: data.walletAddress });
    } catch (err: any) {
      setError(err.message || 'Failed to update wallet');
    } finally {
      setChangingWallet(false);
    }
  }

  function truncateAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess('Address copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div>
        <h2 className={styles.title}>Payout Wallet</h2>
        <p className={styles.subtitle}>Connect your wallet and manage payouts</p>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>Payout Wallet</h2>
      <p className={styles.subtitle}>
        Manage your payout wallet for sending USDC rewards to members
      </p>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Wallet Status */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Wallet Status</h3>

        {stats?.walletAddress ? (
          <div className={styles.walletConnected}>
            <div className={styles.walletInfo}>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot}></span>
                Connected
              </div>
              <div className={styles.addressContainer}>
                <span className={styles.label}>Wallet Address:</span>
                <div className={styles.addressRow}>
                  <code className={styles.address}>{stats.walletAddress}</code>
                  <button
                    onClick={() => copyToClipboard(stats.walletAddress!)}
                    className={styles.copyButton}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setShowChangeWallet(true)}
                    className={styles.changeButton}
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className={styles.fundingInstructions}>
                <p className={styles.instructionTitle}>
                  <strong>Important:</strong> Fund this wallet with USDC
                </p>
                <p className={styles.instructionText}>
                  To enable member payouts, send USDC (Polygon network) to this wallet address.
                  Members can redeem {stats.payoutMilestonePoints} points for ${stats.payoutAmountUSD} USDC.
                </p>
              </div>
            </div>

            {/* Change Wallet Modal */}
            {showChangeWallet && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <h3 className={styles.modalTitle}>Change Payout Wallet</h3>
                  <p className={styles.modalDescription}>
                    Update your wallet address for receiving USDC payouts. You can use your own wallet or generate a new one.
                  </p>

                  <div className={styles.walletOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="walletOption"
                        checked={walletOption === 'custom'}
                        onChange={() => setWalletOption('custom')}
                      />
                      <span>Use my own wallet address</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="walletOption"
                        checked={walletOption === 'generate'}
                        onChange={() => setWalletOption('generate')}
                      />
                      <span>Generate new custodial wallet</span>
                    </label>
                  </div>

                  {walletOption === 'custom' && (
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Wallet Address (Polygon)</label>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="0x..."
                        className={styles.addressInput}
                      />
                      <p className={styles.inputHint}>
                        Enter an Ethereum-compatible address. USDC payouts will be sent on the Polygon network.
                      </p>
                    </div>
                  )}

                  {walletOption === 'generate' && (
                    <div className={styles.generateWarning}>
                      <p>
                        <strong>Note:</strong> A new wallet will be generated. Your previous wallet will no longer be used.
                        Make sure to withdraw any remaining USDC before changing.
                      </p>
                    </div>
                  )}

                  <div className={styles.modalActions}>
                    <button
                      onClick={() => {
                        setShowChangeWallet(false);
                        setCustomAddress('');
                        setWalletOption('custom');
                      }}
                      className={styles.cancelButton}
                      disabled={changingWallet}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangeWallet}
                      className={styles.confirmButton}
                      disabled={changingWallet || (walletOption === 'custom' && !customAddress)}
                    >
                      {changingWallet ? 'Updating...' : 'Update Wallet'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.walletNotConnected}>
            <p className={styles.notConnectedText}>
              No payout wallet connected. Generate a custodial wallet to start accepting member payouts.
            </p>
            <button
              onClick={handleSetupWallet}
              disabled={settingUpWallet}
              className={styles.setupButton}
            >
              {settingUpWallet ? 'Setting up...' : 'Generate Payout Wallet'}
            </button>
          </div>
        )}
      </div>

      {/* Payout Statistics */}
      {stats?.walletAddress && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Payout Summary</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>${stats.totalPaidOut.toFixed(2)}</div>
              <div className={styles.statLabel}>Total USDC Paid Out</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{stats.totalPayouts}</div>
              <div className={styles.statLabel}>Total Payouts</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>${stats.payoutAmountUSD}</div>
              <div className={styles.statLabel}>Per Payout Amount</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{stats.payoutMilestonePoints}</div>
              <div className={styles.statLabel}>Points Required</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Budget Cap */}
      {stats?.walletAddress && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Monthly Budget Cap</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Limit how much USDC you pay out each month to control costs. Members can only claim once per budget cycle.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={budgetEnabled}
                onChange={(e) => setBudgetEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500', color: '#374151' }}>Enable monthly budget cap</span>
            </label>
          </div>

          {budgetEnabled && (
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Monthly Budget ($USDC)
                </label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  min="1"
                  step="1"
                  placeholder="e.g., 100"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Maximum USDC to pay out per month. Once reached, members can request notifications.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Budget Reset Day
                </label>
                <select
                  value={resetDay}
                  onChange={(e) => setResetDay(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    background: 'white',
                  }}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Budget resets on this day. Members waiting for notifications are emailed 3 days after reset.
                </p>
              </div>
            </div>
          )}

          {budgetEnabled && stats.currentMonthPayouts > 0 && (
            <div style={{
              padding: '1rem',
              background: '#eff6ff',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontWeight: '600', color: '#1e40af', margin: 0 }}>
                Current cycle: ${stats.currentMonthPayouts.toFixed(2)} / ${stats.monthlyPayoutBudget?.toFixed(2)} USDC
              </p>
              <div style={{
                height: '8px',
                background: '#dbeafe',
                borderRadius: '4px',
                marginTop: '0.5rem',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (stats.currentMonthPayouts / (stats.monthlyPayoutBudget || 1)) * 100)}%`,
                  background: stats.currentMonthPayouts >= (stats.monthlyPayoutBudget || 0) ? '#ef4444' : '#3b82f6',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}

          <button
            onClick={handleSaveBudget}
            disabled={savingBudget || (budgetEnabled && (!monthlyBudget || parseFloat(monthlyBudget) <= 0))}
            style={{
              padding: '0.75rem 1.5rem',
              background: savingBudget ? '#9ca3af' : '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: savingBudget ? 'not-allowed' : 'pointer',
            }}
          >
            {savingBudget ? 'Saving...' : 'Save Budget Settings'}
          </button>
        </div>
      )}

      {/* Recent Payouts */}
      {stats?.walletAddress && stats.recentPayouts.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recent Payouts</h3>
          <div className={styles.tableContainer}>
            <table className={styles.payoutTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Location</th>
                  <th>Points</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className={styles.dateCell}>{formatDate(payout.createdAt)}</td>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.memberName}>{payout.memberName}</div>
                        <div className={styles.memberEmail}>{payout.memberEmail}</div>
                      </div>
                    </td>
                    <td>{payout.location}</td>
                    <td className={styles.pointsCell}>-{payout.pointsDeducted}</td>
                    <td className={styles.amountCell}>${payout.amount?.toFixed(2)}</td>
                    <td>
                      <span className={styles.successBadge}>Success</span>
                      {payout.txHash && (
                        <a
                          href={`https://polygonscan.com/tx/${payout.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.txLink}
                        >
                          View Tx
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.walletAddress && stats.recentPayouts.length === 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recent Payouts</h3>
          <p className={styles.emptyState}>No payouts yet. Fund your wallet to enable member rewards!</p>
        </div>
      )}
    </div>
  );
}
