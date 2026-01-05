'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './scan.module.css';

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [scanData, setScanData] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      handleScan();
    }
  }, [slug]);

  async function handleScan() {
    try {
      setLoading(true);
      setError('');

      // Call the QR scan API
      const res = await fetch(`/api/qr-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessSlug: slug }),
      });

      if (!res.ok) {
        const data = await res.json();

        // If unauthorized, redirect to login with return URL
        if (res.status === 401) {
          const returnUrl = encodeURIComponent(`/scan/${slug}`);
          router.push(`/member/login?redirect=${returnUrl}`);
          return;
        }

        throw new Error(data.error || 'Failed to scan QR code');
      }

      const data = await res.json();
      setScanData(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to scan QR code');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <h2>Processing your scan...</h2>
          <p>Please wait while we award your points</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>❌</div>
          <h2>Scan Failed</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={handleScan} className={styles.retryButton}>
            Try Again
          </button>
          <button
            onClick={() => router.push('/member/dashboard')}
            className={styles.dashboardButton}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success && scanData) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2>Points Awarded!</h2>
          <p className={styles.successMessage}>You've successfully earned points at {scanData.businessName}</p>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Points Earned</span>
              <span className={styles.statValue}>+{scanData.pointsAwarded}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Points</span>
              <span className={styles.statValue}>{scanData.totalPoints}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Current Tier</span>
              <span className={`${styles.statValue} ${styles[scanData.tier.toLowerCase()]}`}>
                {scanData.tier}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Visit Count</span>
              <span className={styles.statValue}>{scanData.visitCount}</span>
            </div>
          </div>

          {scanData.nextTier && (
            <div className={styles.progressCard}>
              <h3>Next Tier: {scanData.nextTier.name}</h3>
              <p>
                {scanData.nextTier.pointsNeeded} more points to reach {scanData.nextTier.name} tier
              </p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(scanData.totalPoints / (scanData.totalPoints + scanData.nextTier.pointsNeeded)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {scanData.canClaimPayout && (
            <div className={styles.payoutAlert}>
              <h3>💰 Payout Available!</h3>
              <p>You have enough points to claim a ${scanData.payoutAmount} USDC reward!</p>
              <button
                onClick={() => router.push('/member/dashboard')}
                className={styles.claimButton}
              >
                Claim Now
              </button>
            </div>
          )}

          <button
            onClick={() => router.push('/member/dashboard')}
            className={styles.dashboardButton}
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
