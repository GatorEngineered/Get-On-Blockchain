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
    } catch (err: any) {
      setError(err.message || 'Failed to load payout statistics');
    } finally {
      setLoading(false);
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
