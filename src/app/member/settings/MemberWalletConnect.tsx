"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type MemberWalletConnectProps = {
  currentWallet: string | null;
  onWalletConnected: (address: string) => void;
};

export default function MemberWalletConnect({
  currentWallet,
  onWalletConnected,
}: MemberWalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // When wallet connects, save it to the member's profile
  useEffect(() => {
    if (isConnected && address && !currentWallet && !saving && !success) {
      saveWalletToProfile(address);
    }
  }, [isConnected, address, currentWallet]);

  async function saveWalletToProfile(walletAddress: string) {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("member_token");
      if (!token) {
        setError("Please log in again to connect your wallet");
        return;
      }

      const res = await fetch("/api/member/connect-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect wallet");
      }

      setSuccess(true);
      onWalletConnected(walletAddress);
    } catch (err: any) {
      setError(err.message);
      // Disconnect the wallet if save failed
      disconnect();
    } finally {
      setSaving(false);
    }
  }

  // If wallet is already connected to profile, show connected state
  if (currentWallet) {
    return (
      <div className="wallet-connected-state">
        <div className="wallet-connected-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Wallet Connected</span>
        </div>
        <code className="wallet-address-display">{currentWallet}</code>
        <p className="wallet-help-text">
          This wallet will receive USDC payouts when you claim rewards.
        </p>
        <style jsx>{`
          .wallet-connected-state {
            padding: 1.5rem;
            background: #d1fae5;
            border-radius: 12px;
            text-align: center;
          }
          .wallet-connected-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #065f46;
            font-weight: 600;
            margin-bottom: 0.75rem;
          }
          .wallet-address-display {
            display: block;
            font-size: 0.85rem;
            color: #047857;
            background: rgba(255,255,255,0.5);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            word-break: break-all;
            margin-bottom: 0.75rem;
          }
          .wallet-help-text {
            font-size: 0.85rem;
            color: #065f46;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="wallet-connect-container">
      {error && (
        <div className="wallet-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {success ? (
        <div className="wallet-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Wallet connected successfully!</span>
        </div>
      ) : saving ? (
        <div className="wallet-saving">
          <div className="spinner"></div>
          <span>Connecting wallet...</span>
        </div>
      ) : (
        <div className="wallet-prompt">
          <div className="wallet-icon-large">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3>No Wallet Connected</h3>
          <p>
            Connect a cryptocurrency wallet to receive USDC payouts from merchants
            that offer real money rewards.
          </p>
          <div className="connect-button-wrapper">
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => {
                const ready = mounted;
                return (
                  <div {...(!ready && { style: { opacity: 0, pointerEvents: "none" } })}>
                    <button onClick={openConnectModal} className="connect-wallet-btn">
                      Connect Wallet
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      )}

      <style jsx>{`
        .wallet-connect-container {
          text-align: center;
        }
        .wallet-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .wallet-success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 12px;
          font-weight: 600;
        }
        .wallet-saving {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: #6b7280;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #244b7a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .wallet-prompt {
          padding: 2rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px dashed #d1d5db;
        }
        .wallet-icon-large {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          background: #e5e7eb;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }
        .wallet-prompt h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }
        .wallet-prompt p {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          font-size: 0.9rem;
        }
        .connect-button-wrapper {
          display: flex;
          justify-content: center;
        }
        .connect-wallet-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #244b7a;
          border: 2px solid #244b7a;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .connect-wallet-btn:hover {
          background: #244b7a;
          color: white;
        }
      `}</style>
    </div>
  );
}
