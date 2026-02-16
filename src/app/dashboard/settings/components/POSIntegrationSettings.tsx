'use client';

import React, { useState, useEffect } from 'react';
import styles from './POSIntegrationSettings.module.css';

interface POSProvider {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
}

interface POSStatus {
  provider: string;
  connected: boolean;
  locationId?: string;
  shopDomain?: string;
  error?: string;
}

interface Props {
  merchantData: any;
  onUpdate: (data: any) => void;
}

const PROVIDERS: POSProvider[] = [
  {
    id: 'square',
    name: 'Square',
    description: 'Connect Square to automatically award points on purchases',
    color: '#006aff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    ),
    features: [
      'Automatic points on every purchase',
      'Sync customer data',
      'Real-time transaction tracking',
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Connect Toast POS for restaurant loyalty integration',
    color: '#ff6900',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    features: [
      'Restaurant-focused loyalty',
      'Menu item tracking',
      'Server attribution',
    ],
  },
  {
    id: 'clover',
    name: 'Clover',
    description: 'Connect Clover POS for seamless payment tracking',
    color: '#2ecc71',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    features: [
      'Real-time payment sync',
      'Multi-location support',
      'Customer matching',
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect Shopify for ecommerce loyalty points',
    color: '#96bf48',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M15.337 3.415c-.188-.085-.42-.086-.632-.004a1.03 1.03 0 00-.53.532c-.283.627-.557 1.257-.817 1.893-.14.343-.276.687-.409 1.031-.048.123-.093.247-.137.371L9.37 5.652c-.177-.075-.373-.09-.56-.044a.915.915 0 00-.445.29.951.951 0 00-.215.482L7.66 9.9a.69.69 0 00.024.39.713.713 0 00.245.306l4.78 3.444-.002.003 1.596 1.15a.706.706 0 00.838-.026l4.59-4.588a.954.954 0 00.268-.486l.717-3.524a.968.968 0 00-.215-.8.926.926 0 00-.745-.354h-3.419z"/>
      </svg>
    ),
    features: [
      'Online & in-store sync',
      'Order-based points',
      'Customer account linking',
    ],
  },
  {
    id: 'vagaro',
    name: 'Vagaro',
    description: 'Connect Vagaro for salon & spa loyalty integration',
    color: '#00b4d8',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
    ),
    features: [
      'Salon & spa focused',
      'Appointment & service tracking',
      'Automatic points on transactions',
    ],
  },
  {
    id: 'booksy',
    name: 'Booksy',
    description: 'Connect Booksy for salon & spa appointment loyalty',
    color: '#7b68ee',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
      </svg>
    ),
    features: [
      'Salon & spa appointment tracking',
      'Automatic points on bookings',
      'Customer matching',
    ],
  },
];

export default function POSIntegrationSettings({ merchantData, onUpdate }: Props) {
  const [statuses, setStatuses] = useState<POSStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [showVagaroModal, setShowVagaroModal] = useState(false);
  const [vagaroClientId, setVagaroClientId] = useState('');
  const [vagaroClientSecret, setVagaroClientSecret] = useState('');
  const [vagaroBusinessId, setVagaroBusinessId] = useState('');
  const [pointsPerDollar, setPointsPerDollar] = useState(merchantData?.posPointsPerDollar || 1);
  const [savingPoints, setSavingPoints] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    try {
      const res = await fetch('/api/merchant/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses || []);
        setAvailableProviders(data.availableProviders || []);
      }
    } catch (error) {
      console.error('Failed to fetch POS statuses:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(providerId: string): POSStatus | undefined {
    return statuses.find(s => s.provider === providerId);
  }

  function isConnected(providerId: string): boolean {
    const status = getStatus(providerId);
    return status?.connected || false;
  }

  function isAvailable(providerId: string): boolean {
    return availableProviders.includes(providerId);
  }

  async function handleConnect(providerId: string) {
    if (providerId === 'shopify') {
      setShowShopifyModal(true);
      return;
    }

    if (providerId === 'vagaro') {
      setShowVagaroModal(true);
      return;
    }

    setConnecting(providerId);
    try {
      const res = await fetch(`/api/merchant/integrations/${providerId}/connect`);
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to start connection');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  }

  async function handleShopifyConnect() {
    if (!shopifyDomain.trim()) {
      alert('Please enter your Shopify store domain');
      return;
    }

    const domain = shopifyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    setConnecting('shopify');
    setShowShopifyModal(false);

    try {
      const res = await fetch(`/api/merchant/integrations/shopify/connect?shop=${encodeURIComponent(domain)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to start Shopify connection');
      }
    } catch (error) {
      console.error('Shopify connection error:', error);
      alert('Failed to connect to Shopify. Please try again.');
    } finally {
      setConnecting(null);
      setShopifyDomain('');
    }
  }

  async function handleVagaroConnect() {
    if (!vagaroClientId.trim() || !vagaroClientSecret.trim() || !vagaroBusinessId.trim()) {
      alert('Please fill in all Vagaro credentials');
      return;
    }

    setConnecting('vagaro');
    setShowVagaroModal(false);

    try {
      const res = await fetch('/api/merchant/integrations/vagaro/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: vagaroClientId.trim(),
          clientSecret: vagaroClientSecret.trim(),
          businessId: vagaroBusinessId.trim(),
        }),
      });

      if (res.ok) {
        fetchStatuses();
        alert('Vagaro connected successfully! Configure your webhook in Vagaro to complete setup.');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to connect Vagaro');
      }
    } catch (error) {
      console.error('Vagaro connection error:', error);
      alert('Failed to connect to Vagaro. Please try again.');
    } finally {
      setConnecting(null);
      setVagaroClientId('');
      setVagaroClientSecret('');
      setVagaroBusinessId('');
    }
  }

  async function handleDisconnect(providerId: string) {
    if (!confirm(`Are you sure you want to disconnect ${PROVIDERS.find(p => p.id === providerId)?.name}?`)) {
      return;
    }

    setDisconnecting(providerId);
    try {
      const res = await fetch(`/api/merchant/integrations/${providerId}/disconnect`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchStatuses();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleSavePointsPerDollar() {
    setSavingPoints(true);
    try {
      const res = await fetch('/api/merchant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posPointsPerDollar: pointsPerDollar }),
      });

      if (res.ok) {
        onUpdate({ posPointsPerDollar: pointsPerDollar });
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    } finally {
      setSavingPoints(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading POS integrations...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>POS Integrations</h2>
        <p>Connect your point-of-sale system to automatically award loyalty points on purchases</p>
      </div>

      {/* Points per dollar setting */}
      <div className={styles.section}>
        <h3>Points Configuration</h3>
        <div className={styles.pointsConfig}>
          <label htmlFor="pointsPerDollar">Points earned per dollar spent:</label>
          <div className={styles.pointsInput}>
            <input
              type="number"
              id="pointsPerDollar"
              value={pointsPerDollar}
              onChange={(e) => setPointsPerDollar(Math.max(0.01, parseFloat(e.target.value) || 1))}
              min="0.01"
              step="0.01"
              aria-describedby="pointsHelp"
            />
            <span className={styles.pointsLabel}>points</span>
            <button
              className={styles.saveBtn}
              onClick={handleSavePointsPerDollar}
              disabled={savingPoints}
            >
              {savingPoints ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p id="pointsHelp" className={styles.helpText}>
            Example: At {pointsPerDollar} point(s) per dollar, a $100 purchase earns {Math.round(100 * pointsPerDollar)} points (rounded)
          </p>
        </div>
      </div>

      {/* Provider cards */}
      <div className={styles.section}>
        <h3>Available Integrations</h3>
        <div className={styles.providersGrid}>
          {PROVIDERS.map((provider) => {
            const connected = isConnected(provider.id);
            const available = isAvailable(provider.id);
            const status = getStatus(provider.id);

            return (
              <div
                key={provider.id}
                className={`${styles.providerCard} ${connected ? styles.connected : ''} ${!available ? styles.unavailable : ''}`}
              >
                <div
                  className={styles.providerIcon}
                  style={{ backgroundColor: provider.color }}
                >
                  {provider.icon}
                </div>

                <div className={styles.providerInfo}>
                  <h4>{provider.name}</h4>
                  <p>{provider.description}</p>

                  <ul className={styles.featureList}>
                    {provider.features.map((feature, i) => (
                      <li key={i}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.providerActions}>
                  {!available ? (
                    <div className={styles.notConfigured}>
                      <span>Not configured</span>
                      <p>Contact support to enable this integration</p>
                    </div>
                  ) : connected ? (
                    <>
                      <div className={styles.connectedStatus}>
                        <span className={styles.statusDot} />
                        Connected
                        {status?.locationId && (
                          <span className={styles.locationId}>
                            ID: {status.locationId.slice(0, 8)}...
                          </span>
                        )}
                        {status?.shopDomain && (
                          <span className={styles.locationId}>
                            {status.shopDomain}
                          </span>
                        )}
                      </div>
                      <button
                        className={styles.disconnectBtn}
                        onClick={() => handleDisconnect(provider.id)}
                        disabled={disconnecting === provider.id}
                      >
                        {disconnecting === provider.id ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.connectBtn}
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                      style={{ backgroundColor: provider.color }}
                    >
                      {connecting === provider.id ? 'Connecting...' : `Connect ${provider.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className={styles.section}>
        <h3>How POS Integration Works</h3>
        <div className={styles.howItWorks}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div>
              <h4>Connect Your POS</h4>
              <p>Authorize Get On Blockchain to access your POS transaction data securely</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div>
              <h4>Match Customers</h4>
              <p>We match transactions to members using email or phone number from your POS</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div>
              <h4>Award Points Automatically</h4>
              <p>Points are awarded instantly based on purchase amount and your configuration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shopify domain modal */}
      {showShopifyModal && (
        <div className={styles.modal} role="dialog" aria-labelledby="shopify-modal-title" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 id="shopify-modal-title">Connect Shopify Store</h3>
            <p>Enter your Shopify store domain to connect</p>
            <div className={styles.shopifyInput}>
              <input
                type="text"
                value={shopifyDomain}
                onChange={(e) => setShopifyDomain(e.target.value)}
                placeholder="your-store.myshopify.com"
                aria-label="Shopify store domain"
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowShopifyModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.connectBtn}
                onClick={handleShopifyConnect}
                style={{ backgroundColor: '#96bf48' }}
              >
                Connect Shopify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vagaro credentials modal */}
      {showVagaroModal && (
        <div className={styles.modal} role="dialog" aria-labelledby="vagaro-modal-title" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 id="vagaro-modal-title">Connect Vagaro</h3>

            <div style={{ background: '#f0f9ff', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>How to get your credentials:</strong>
              <ol style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                <li>Log into your <a href="https://www.vagaro.com/pro/login" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>Vagaro Pro account</a></li>
                <li>Go to <strong>Settings → Developers → APIs & Webhooks</strong></li>
                <li>Create a new API application or use an existing one</li>
                <li>Copy the Client ID, Client Secret, and your Business ID</li>
              </ol>
            </div>

            <div className={styles.shopifyInput} style={{ marginBottom: '1rem' }}>
              <label htmlFor="vagaro-client-id" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                Client ID
              </label>
              <input
                id="vagaro-client-id"
                type="text"
                value={vagaroClientId}
                onChange={(e) => setVagaroClientId(e.target.value)}
                placeholder="Your Vagaro Client ID"
              />
            </div>

            <div className={styles.shopifyInput} style={{ marginBottom: '1rem' }}>
              <label htmlFor="vagaro-client-secret" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                Client Secret
              </label>
              <input
                id="vagaro-client-secret"
                type="password"
                value={vagaroClientSecret}
                onChange={(e) => setVagaroClientSecret(e.target.value)}
                placeholder="Your Vagaro Client Secret"
              />
            </div>

            <div className={styles.shopifyInput} style={{ marginBottom: '1rem' }}>
              <label htmlFor="vagaro-business-id" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                Business ID
              </label>
              <input
                id="vagaro-business-id"
                type="text"
                value={vagaroBusinessId}
                onChange={(e) => setVagaroBusinessId(e.target.value)}
                placeholder="Your Vagaro Business ID"
              />
            </div>

            <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>After connecting, set up a webhook in Vagaro:</strong>
              <ol style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                <li>In Vagaro, go to <strong>Settings → Developers → Webhooks</strong></li>
                <li>Create a new webhook with this URL:</li>
              </ol>
              <code style={{ display: 'block', background: '#fde68a', padding: '6px 10px', borderRadius: '4px', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                {typeof window !== 'undefined' ? window.location.origin : 'https://getonblockchain.com'}/api/webhooks/vagaro
              </code>
              <p style={{ margin: '0.5rem 0 0 0' }}>Select events: <strong>Transactions</strong> (required), Customers (optional)</p>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowVagaroModal(false);
                  setVagaroClientId('');
                  setVagaroClientSecret('');
                  setVagaroBusinessId('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.connectBtn}
                onClick={handleVagaroConnect}
                style={{ backgroundColor: '#00b4d8' }}
              >
                Connect Vagaro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
