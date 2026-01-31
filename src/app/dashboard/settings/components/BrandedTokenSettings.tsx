'use client';

import React, { useState, useEffect } from 'react';
import styles from './BrandedTokenSettings.module.css';

interface MerchantToken {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  contractAddress: string | null;
  network: string;
  deployTxHash: string | null;
  deployedAt: string | null;
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  isActive: boolean;
  isPaused: boolean;
}

interface BrandedTokenSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

export default function BrandedTokenSettings({ merchantData, onUpdate }: BrandedTokenSettingsProps) {
  const [token, setToken] = useState<MerchantToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for creating/editing token
  const [formData, setFormData] = useState({
    tokenName: '',
    tokenSymbol: '',
  });

  // Check if merchant has Growth or Pro plan
  const hasTokenAccess = merchantData?.plan === 'GROWTH' || merchantData?.plan === 'PRO';

  useEffect(() => {
    if (hasTokenAccess) {
      fetchToken();
    } else {
      setLoading(false);
    }
  }, [hasTokenAccess]);

  async function fetchToken() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/merchant/token');
      const data = await res.json();

      if (!res.ok) {
        // Handle errors (403 for wrong plan, 500 for server error)
        throw new Error(data.error || 'Failed to fetch token');
      }

      if (data.hasToken && data.token) {
        // Token exists
        setToken(data.token);
      } else {
        // No token yet - use suggested values
        setToken(null);
        setFormData({
          tokenName: data.suggestedName || `${merchantData?.name || 'My'} Token`,
          tokenSymbol: data.suggestedSymbol || generateSymbol(merchantData?.name || 'TOKEN'),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function generateSymbol(name: string): string {
    // Generate 3-4 letter symbol from business name
    const words = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      return words.slice(0, 3).map(w => w[0].toUpperCase()).join('') + 'T';
    } else if (words.length === 2) {
      return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
    } else if (words[0]) {
      return (words[0].slice(0, 3) + 'T').toUpperCase();
    }
    return 'TKN';
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.tokenName.trim()) {
      setError('Token name is required');
      return;
    }
    if (!formData.tokenSymbol.trim()) {
      setError('Token symbol is required');
      return;
    }
    if (formData.tokenSymbol.length < 2 || formData.tokenSymbol.length > 6) {
      setError('Token symbol must be 2-6 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await fetch('/api/merchant/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: formData.tokenName.trim(),
          tokenSymbol: formData.tokenSymbol.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create token');
      }

      // Re-fetch to get the full token data
      await fetchToken();
      setSuccess('Token configuration saved! You can now deploy it to the blockchain.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    if (token) {
      setFormData({
        tokenName: `${merchantData?.name || 'My'} Token`,
        tokenSymbol: generateSymbol(merchantData?.name || 'TOKEN'),
      });
      setEditing(true);
      setError('');
      setSuccess('');
    }
  }

  async function handleUpdateToken(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.tokenName.trim()) {
      setError('Token name is required');
      return;
    }
    if (!formData.tokenSymbol.trim()) {
      setError('Token symbol is required');
      return;
    }
    if (formData.tokenSymbol.length < 2 || formData.tokenSymbol.length > 6) {
      setError('Token symbol must be 2-6 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await fetch('/api/merchant/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: formData.tokenName.trim(),
          tokenSymbol: formData.tokenSymbol.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update token');
      }

      setEditing(false);
      await fetchToken();
      setSuccess('Token updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploy() {
    if (!token) return;

    try {
      setDeploying(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/token/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deploy token');
      }

      const data = await res.json();
      setToken(data.token);
      setSuccess('Token deployed successfully! View it on the blockchain explorer.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  }

  function getExplorerUrl(network: string, address: string): string {
    if (network === 'polygon') {
      return `https://polygonscan.com/address/${address}`;
    }
    return `https://amoy.polygonscan.com/address/${address}`;
  }

  function getTxExplorerUrl(network: string, txHash: string): string {
    if (network === 'polygon') {
      return `https://polygonscan.com/tx/${txHash}`;
    }
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading token settings...</p>
      </div>
    );
  }

  // Plan gate - show upgrade prompt
  if (!hasTokenAccess) {
    return (
      <div>
        <h2 className={styles.title}>Branded Token</h2>
        <p className={styles.subtitle}>Create your own branded loyalty token on the blockchain</p>

        <div className={styles.upgradeCard}>
          <div className={styles.upgradeIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className={styles.upgradeTitle}>Unlock Branded Tokens</h3>
          <p className={styles.upgradeText}>
            Branded tokens are available on the <strong>Growth</strong> and <strong>Pro</strong> plans.
            Create your own custom loyalty token that members can earn and trade.
          </p>
          <ul className={styles.featureList}>
            <li>Custom token with your brand name</li>
            <li>Deployed on Polygon blockchain</li>
            <li>Members earn tokens on check-ins</li>
            <li>Real crypto tokens in member wallets</li>
            <li>Full transparency on the blockchain</li>
          </ul>
          <button
            className={styles.upgradeButton}
            onClick={() => window.location.href = '/dashboard/settings?tab=plans'}
          >
            Upgrade to Growth Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Branded Token</h2>
          <p className={styles.subtitle}>Create and manage your branded loyalty token</p>
        </div>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* No token yet - show creation form */}
      {!token && (
        <div className={styles.createCard}>
          <h3 className={styles.createTitle}>Create Your Branded Token</h3>
          <p className={styles.createText}>
            Set up your custom loyalty token. Once created, you can deploy it to the Polygon blockchain.
          </p>

          <form onSubmit={handleCreateToken} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Token Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.tokenName}
                onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                placeholder="e.g., Orlando Cafe Token"
                maxLength={50}
              />
              <p className={styles.hint}>The full name of your token (max 50 characters)</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Token Symbol</label>
              <input
                type="text"
                className={styles.input}
                value={formData.tokenSymbol}
                onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                placeholder="e.g., ORCA"
                maxLength={6}
              />
              <p className={styles.hint}>2-6 characters, will be shown in wallets (e.g., ORCA)</p>
            </div>

            <div className={styles.infoBox}>
              <strong>Note:</strong> Tokens use 0 decimals (whole tokens only), matching your points system.
              Members will earn tokens just like they earn points today.
            </div>

            <button
              type="submit"
              className={styles.createButton}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Token Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* Token exists - show info and deploy option */}
      {token && (
        <>
          <div className={styles.tokenCard}>
            <div className={styles.tokenHeader}>
              <div className={styles.tokenIcon}>
                <span>{token.tokenSymbol.slice(0, 2)}</span>
              </div>
              <div className={styles.tokenInfo}>
                <h3 className={styles.tokenName}>{token.tokenName}</h3>
                <p className={styles.tokenSymbolDisplay}>{token.tokenSymbol}</p>
              </div>
              <div className={styles.tokenBadges}>
                {token.contractAddress ? (
                  <span className={styles.deployedBadge}>Deployed</span>
                ) : (
                  <>
                    <span className={styles.pendingBadge}>Not Deployed</span>
                    <button
                      className={styles.editButton}
                      onClick={startEditing}
                      title="Edit token name and symbol"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </>
                )}
                {token.isPaused && (
                  <span className={styles.pausedBadge}>Paused</span>
                )}
              </div>
            </div>

            {/* Edit form for undeployed tokens */}
            {editing && !token.contractAddress && (
              <form onSubmit={handleUpdateToken} className={styles.editForm}>
                <div className={styles.editFormRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Token Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.tokenName}
                      onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                      placeholder="e.g., My Business Token"
                      maxLength={50}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Symbol</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., MBT"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className={styles.editFormActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {token.contractAddress ? (
              <>
                <div className={styles.tokenDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Contract Address</span>
                    <a
                      href={getExplorerUrl(token.network, token.contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.addressLink}
                    >
                      {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Network</span>
                    <span className={styles.detailValue}>
                      {token.network === 'polygon' ? 'Polygon Mainnet' : 'Polygon Amoy (Testnet)'}
                    </span>
                  </div>
                  {token.deployTxHash && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Deploy Transaction</span>
                      <a
                        href={getTxExplorerUrl(token.network, token.deployTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.addressLink}
                      >
                        View on Explorer
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{token.totalMinted.toLocaleString()}</span>
                    <span className={styles.statLabel}>Total Minted</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{token.totalBurned.toLocaleString()}</span>
                    <span className={styles.statLabel}>Total Burned</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{token.circulatingSupply.toLocaleString()}</span>
                    <span className={styles.statLabel}>Circulating</span>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.deploySection}>
                <p className={styles.deployText}>
                  Your token is configured and ready to deploy. Once deployed, members will automatically
                  receive tokens when they earn points.
                </p>
                <button
                  className={styles.deployButton}
                  onClick={handleDeploy}
                  disabled={deploying}
                >
                  {deploying ? (
                    <>
                      <span className={styles.deploySpinner}></span>
                      Deploying to Polygon...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Deploy to Polygon
                    </>
                  )}
                </button>
                <p className={styles.deployHint}>
                  Deployment requires a small gas fee paid by GOB. This may fail if the relayer wallet is not funded.
                </p>
              </div>
            )}
          </div>

          {/* How it works info */}
          <div className={styles.howItWorks}>
            <h4 className={styles.howItWorksTitle}>How Branded Tokens Work</h4>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <strong>Member Checks In</strong>
                  <p>When a member earns points at your business</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <strong>Tokens Minted</strong>
                  <p>Equivalent tokens are minted to their wallet</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <strong>On-Chain Balance</strong>
                  <p>Tokens live on Polygon blockchain forever</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <strong>Redeem Rewards</strong>
                  <p>Members burn tokens to claim rewards</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
