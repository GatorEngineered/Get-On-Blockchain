"use client";

 

import { useEffect, useState } from "react";

 

type WalletInfo = {

  payoutEnabled: boolean;

  walletAddress: string | null;

  usdcBalance: number;

  network: string;

  lastBalanceCheck: string | null;

  lowBalanceThreshold: number;

};

 

export default function WalletBalanceWidget() {

  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

 

  useEffect(() => {

    loadWalletInfo();

  }, []);

 

  async function loadWalletInfo() {

    try {

      const res = await fetch("/api/merchant/me");

      if (!res.ok) throw new Error("Failed to load merchant info");

 

      const merchant = await res.json();

 

      if (merchant.payoutEnabled && merchant.payoutWalletAddress) {

        setWallet({

          payoutEnabled: merchant.payoutEnabled,

          walletAddress: merchant.payoutWalletAddress,

          usdcBalance: merchant.usdcBalance || 0,

          network: merchant.payoutNetwork || "polygon",

          lastBalanceCheck: merchant.lastBalanceCheck,

          lowBalanceThreshold: merchant.lowBalanceThreshold || 50.0,

        });

      } else {

        setWallet(null);

      }

    } catch (err: any) {

      console.error("Failed to load wallet info:", err);

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }

 

  if (loading) {

    return (

      <div className="wallet-widget wallet-widget--loading">

        <h3>💰 Payout Wallet</h3>

        <p>Loading...</p>

      </div>

    );

  }

 

  if (error) {

    return (

      <div className="wallet-widget wallet-widget--error">

        <h3>💰 Payout Wallet</h3>

        <p className="wallet-widget-error">{error}</p>

      </div>

    );

  }

 

  if (!wallet || !wallet.payoutEnabled) {

    return (

      <div className="wallet-widget wallet-widget--setup-needed">

        <h3>💰 Payout Wallet</h3>

        <p>No wallet configured</p>

        <a href="/dashboard/settings" className="wallet-widget-link">

          Set up payout wallet →

        </a>

      </div>

    );

  }

 

  const isLowBalance = wallet.usdcBalance < wallet.lowBalanceThreshold;

 

  return (

    <div className={`wallet-widget ${isLowBalance ? "wallet-widget--low-balance" : ""}`}>

      <h3>💰 Payout Wallet</h3>

 

      <div className="wallet-widget-balance">

        <div className="wallet-widget-balance-amount">

          ${wallet.usdcBalance.toFixed(2)}

        </div>

        <div className="wallet-widget-balance-label">USDC Balance</div>

      </div>

 

      {isLowBalance && (

        <div className="wallet-widget-warning">

          ⚠️ Balance below ${wallet.lowBalanceThreshold.toFixed(2)}

        </div>

      )}

 

      <div className="wallet-widget-details">

        <div className="wallet-widget-detail">

          <span className="wallet-widget-detail-label">Address:</span>

          <code className="wallet-widget-detail-value">

            {wallet.walletAddress?.slice(0, 8)}...{wallet.walletAddress?.slice(-6)}

          </code>

        </div>

        <div className="wallet-widget-detail">

          <span className="wallet-widget-detail-label">Network:</span>

          <span className="wallet-widget-detail-value">

            {wallet.network === "mumbai" ? "Mumbai Testnet" : "Polygon Mainnet"}

          </span>

        </div>

        {wallet.lastBalanceCheck && (

          <div className="wallet-widget-detail">

            <span className="wallet-widget-detail-label">Last checked:</span>

            <span className="wallet-widget-detail-value">

              {new Date(wallet.lastBalanceCheck).toLocaleTimeString()}

            </span>

          </div>

        )}

      </div>

 

      <div className="wallet-widget-actions">

        <button onClick={loadWalletInfo} className="wallet-widget-refresh">

          Refresh

        </button>

        <a href="/dashboard/settings" className="wallet-widget-link">

          Manage →

        </a>

      </div>

    </div>

  );

}

 