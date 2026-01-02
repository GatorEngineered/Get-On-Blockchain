"use client";

import { useState } from "react";

type WalletFundingGuideProps = {
  walletAddress: string;
  onClose?: () => void;
};

export default function WalletFundingGuide({ walletAddress, onClose }: WalletFundingGuideProps) {
  const [activeTab, setActiveTab] = useState<"usdc" | "matic">("usdc");
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #244b7a 0%, #366ba6 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              How to Fund Your Payout Wallet
            </h2>
            <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
              Follow these steps to add USDC and MATIC to your wallet
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Wallet Address */}
      <div style={{
        padding: '1.25rem',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
          Your Payout Wallet Address
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px'
        }}>
          <code style={{
            flex: 1,
            fontSize: '0.95rem',
            fontFamily: 'monospace',
            color: '#1f2937',
            wordBreak: 'break-all'
          }}>
            {walletAddress}
          </code>
          <button
            onClick={handleCopyAddress}
            style={{
              padding: '0.5rem 1rem',
              background: copied ? '#10b981' : '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <button
          onClick={() => setActiveTab("usdc")}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === "usdc" ? 'white' : 'transparent',
            border: 'none',
            borderBottom: activeTab === "usdc" ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === "usdc" ? '#1f2937' : '#6b7280',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Fund with USDC
        </button>
        <button
          onClick={() => setActiveTab("matic")}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === "matic" ? 'white' : 'transparent',
            border: 'none',
            borderBottom: activeTab === "matic" ? '3px solid #f59e0b' : '3px solid transparent',
            color: activeTab === "matic" ? '#1f2937' : '#6b7280',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Fund with MATIC
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {activeTab === "usdc" ? (
          <div>
            <div style={{
              padding: '1rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Important: Use Polygon Network
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                    Make sure to send USDC on the Polygon network (not Ethereum mainnet). Sending on the wrong network will result in lost funds.
                  </p>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Option 1: Buy USDC on Polygon Directly
            </h3>

            <div style={{ marginLeft: '1rem', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Step 1:</strong> Create an account on a crypto exchange that supports Polygon:
                </p>
                <ul style={{ marginLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <li><strong>Coinbase</strong> - Easy for beginners, supports direct Polygon withdrawals</li>
                  <li><strong>Binance</strong> - Lower fees, supports Polygon network</li>
                  <li><strong>Kraken</strong> - Supports Polygon withdrawals</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Step 2:</strong> Buy USDC (or any crypto you can swap for USDC)
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '1.5rem' }}>
                  Purchase USDC directly or buy another crypto like MATIC and swap it for USDC
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Step 3:</strong> Withdraw USDC to your wallet
                </p>
                <div style={{
                  marginLeft: '1.5rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#1f2937' }}>Network:</strong> Polygon (MATIC)
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#1f2937' }}>Token:</strong> USDC
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <strong style={{ color: '#1f2937' }}>Address:</strong> {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Option 2: Bridge from Another Network
            </h3>

            <div style={{ marginLeft: '1rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                If you already have USDC on Ethereum mainnet or another chain, use a bridge:
              </p>
              <ul style={{ marginLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.8' }}>
                <li><strong>Polygon Bridge</strong> (polygon.technology/bridge) - Official bridge, takes ~7 mins</li>
                <li><strong>Hop Protocol</strong> (app.hop.exchange) - Faster, small fee</li>
                <li><strong>Synapse Bridge</strong> (synapseprotocol.com) - Cross-chain bridge</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Why you need MATIC
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    MATIC is used to pay gas fees on the Polygon network. You need a small amount (~0.1-0.5 MATIC) to process USDC transactions. Without MATIC, payouts will fail.
                  </p>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              How to Get MATIC
            </h3>

            <div style={{ marginLeft: '1rem', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Method 1: Buy on Exchange</strong>
                </p>
                <ul style={{ marginLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <li>Buy MATIC on Coinbase, Binance, or Kraken</li>
                  <li>Withdraw to your wallet on <strong>Polygon network</strong></li>
                  <li>Make sure to select "Polygon" as the withdrawal network (not Ethereum)</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Method 2: Swap on Polygon</strong>
                </p>
                <ul style={{ marginLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <li>If you already have USDC on Polygon, swap a small amount for MATIC</li>
                  <li>Use QuickSwap (quickswap.exchange) or Uniswap (app.uniswap.org)</li>
                  <li>Connect your wallet and swap USDC → MATIC</li>
                  <li>$5-10 worth of MATIC should last for hundreds of transactions</li>
                </ul>
              </div>

              <div>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#1f2937' }}>Method 3: Polygon Gas Station (Faucet)</strong>
                </p>
                <ul style={{ marginLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <li>Visit faucet.polygon.technology</li>
                  <li>Get a small amount of free MATIC (0.001-0.01) for testing</li>
                  <li>Note: Faucets have daily limits and may not always be available</li>
                </ul>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: '600', marginBottom: '0.5rem' }}>
                Recommended Starting Balance
              </p>
              <p style={{ fontSize: '0.875rem', color: '#15803d' }}>
                0.1 - 0.5 MATIC (≈ $0.08 - $0.40) should be sufficient for 100+ payout transactions
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div style={{
        padding: '1.5rem',
        background: '#fef2f2',
        borderTop: '1px solid #fecaca'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Security Tips
        </h3>
        <ul style={{ marginLeft: '1.5rem', color: '#7f1d1d', fontSize: '0.875rem', lineHeight: '1.8' }}>
          <li>Always double-check the wallet address before sending</li>
          <li>Make sure you select <strong>Polygon</strong> as the network, not Ethereum</li>
          <li>Start with a small test transaction first</li>
          <li>Never share your private keys or seed phrase with anyone</li>
          <li>Keep your wallet funded to avoid payout delays</li>
        </ul>
      </div>
    </div>
  );
}
