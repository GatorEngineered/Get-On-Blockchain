'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/dashboard-mockups.module.css';

type VerifiedRedemption = {
  id: string;
  status: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reward: {
    id: string;
    name: string;
    description: string | null;
    pointsCost: number;
    rewardType: 'TRADITIONAL' | 'USDC_PAYOUT';
    usdcAmount: number | null;
  };
  memberBalance: number;
  memberTier: string;
  memberNote: string | null;
  expiresAt: string;
  expiresInMinutes: number;
  createdAt: string;
};

type ScanState =
  | 'idle'
  | 'scanning'
  | 'verifying'
  | 'verified'
  | 'confirming'
  | 'confirmed'
  | 'declined'
  | 'error';

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [verifiedRedemption, setVerifiedRedemption] = useState<VerifiedRedemption | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<{
    id: string;
    pointsDeducted: number;
    newBalance: number;
    rewardName: string;
  } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // QR code scanning interval
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera
  async function startCamera() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setScanState('scanning');
        startScanning();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions or enter code manually.');
    }
  }

  // Stop camera
  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
    setScanState('idle');
  }

  // Start QR scanning
  function startScanning() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use jsQR for QR code detection (dynamically import)
      try {
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code?.data) {
          // Found QR code
          if (code.data.startsWith('gob:redeem:')) {
            stopCamera();
            await verifyRedemption(code.data);
          }
        }
      } catch {
        // jsQR not available, continue scanning
      }
    }, 250);
  }

  // Verify redemption QR
  async function verifyRedemption(qrData: string) {
    setScanState('verifying');
    setError(null);

    try {
      const res = await fetch('/api/merchant/redemption/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeHash: qrData }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid QR code');
        setScanState('error');
        return;
      }

      setVerifiedRedemption(data.redemption);
      setScanState('verified');
    } catch (err: any) {
      console.error('Verify error:', err);
      setError(err.message || 'Failed to verify redemption');
      setScanState('error');
    }
  }

  // Confirm redemption
  async function handleConfirm() {
    if (!verifiedRedemption) return;

    setScanState('confirming');
    setError(null);

    try {
      const res = await fetch('/api/merchant/redemption/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId: verifiedRedemption.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to confirm redemption');
        setScanState('verified');
        return;
      }

      setConfirmedTransaction(data.transaction);
      setScanState('confirmed');
    } catch (err: any) {
      console.error('Confirm error:', err);
      setError(err.message || 'Failed to confirm');
      setScanState('verified');
    }
  }

  // Decline redemption
  async function handleDecline() {
    if (!verifiedRedemption) return;

    try {
      await fetch('/api/merchant/redemption/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId: verifiedRedemption.id }),
      });

      setScanState('declined');
    } catch (err: any) {
      console.error('Decline error:', err);
    }
  }

  // Reset to scan again
  function handleScanAnother() {
    setVerifiedRedemption(null);
    setConfirmedTransaction(null);
    setError(null);
    setScanState('idle');
  }

  // Manual code entry
  async function handleManualEntry() {
    if (!manualCode.trim()) return;

    let qrData = manualCode.trim();
    if (!qrData.startsWith('gob:redeem:')) {
      qrData = `gob:redeem:${qrData}`;
    }

    await verifyRedemption(qrData);
    setManualCode('');
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={styles.mockupContainer}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Scan Redemption QR
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Scan member's QR code to verify and process reward redemption
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Idle State - Start Scanning */}
        {scanState === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#244b7a">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              Ready to Scan
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Point your camera at the member's redemption QR code
            </p>
            <button
              onClick={startCamera}
              style={{
                padding: '1rem 2rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Start Camera
            </button>

            {/* Manual Entry */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Or enter code manually:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter redemption code"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                />
                <button
                  onClick={handleManualEntry}
                  disabled={!manualCode.trim()}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: manualCode.trim() ? '#244b7a' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanning State - Camera Active */}
        {scanState === 'scanning' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '1rem',
                background: '#000',
              }}
            >
              <video
                ref={videoRef}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                playsInline
                muted
              />
              {/* Scan overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '3px solid rgba(36, 75, 122, 0.8)',
                  borderRadius: '12px',
                }}
              />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Scanning for QR code...</p>
            <button
              onClick={stopCamera}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Verifying State */}
        {scanState === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#244b7a',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: '#6b7280' }}>Verifying redemption...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {scanState === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
              Verification Failed
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={handleScanAnother}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Verified State - Show Member & Reward Info */}
        {(scanState === 'verified' || scanState === 'confirming') && verifiedRedemption && (
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span style={{ fontWeight: '600', color: '#15803d' }}>Valid Redemption Request</span>
            </div>

            {/* Member Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Member</h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#244b7a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '1.25rem',
                  }}
                >
                  {verifiedRedemption.member.firstName?.[0] || verifiedRedemption.member.email[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {verifiedRedemption.member.firstName} {verifiedRedemption.member.lastName}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                    {verifiedRedemption.member.email}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                    Tier: <span style={{ fontWeight: '600' }}>{verifiedRedemption.memberTier}</span>
                  </p>
                </div>
              </div>

              {/* Member Note */}
              {verifiedRedemption.memberNote && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#e0f2fe',
                    border: '1px solid #7dd3fc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    style={{ flexShrink: 0, marginTop: '0.125rem' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    />
                  </svg>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      Note for Staff
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#0c4a6e', margin: 0, lineHeight: 1.4 }}>
                      {verifiedRedemption.memberNote}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reward Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Reward</h3>
              <div
                style={{
                  padding: '1rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontWeight: '600', color: '#92400e', margin: 0, fontSize: '1.1rem' }}>
                  {verifiedRedemption.reward.name}
                </p>
                {verifiedRedemption.reward.description && (
                  <p style={{ fontSize: '0.875rem', color: '#a16207', margin: '0.25rem 0 0 0' }}>
                    {verifiedRedemption.reward.description}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#fef3c7',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#78350f',
                    }}
                  >
                    {verifiedRedemption.reward.pointsCost} points
                  </span>
                  {verifiedRedemption.reward.rewardType === 'USDC_PAYOUT' && (
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#dbeafe',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1e40af',
                      }}
                    >
                      ${verifiedRedemption.reward.usdcAmount} USDC
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Balance</h3>
              <div
                style={{
                  padding: '1rem',
                  background:
                    verifiedRedemption.memberBalance >= verifiedRedemption.reward.pointsCost
                      ? '#f0fdf4'
                      : '#fef2f2',
                  border: `1px solid ${
                    verifiedRedemption.memberBalance >= verifiedRedemption.reward.pointsCost
                      ? '#bbf7d0'
                      : '#fecaca'
                  }`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Current Balance:</span>
                  <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '1.25rem' }}>
                    {verifiedRedemption.memberBalance.toLocaleString()} pts
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                  }}
                >
                  <span style={{ color: '#6b7280' }}>Required:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>
                    -{verifiedRedemption.reward.pointsCost} pts
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed #d1d5db',
                  }}
                >
                  <span style={{ color: '#6b7280' }}>After Redemption:</span>
                  <span style={{ fontWeight: '700', color: '#16a34a' }}>
                    {(verifiedRedemption.memberBalance - verifiedRedemption.reward.pointsCost).toLocaleString()}{' '}
                    pts
                  </span>
                </div>
              </div>
            </div>

            {/* Expiry Warning */}
            {verifiedRedemption.expiresInMinutes <= 2 && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span style={{ color: '#dc2626', fontWeight: '500' }}>
                  Expires in {verifiedRedemption.expiresInMinutes} minute(s)
                </span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  color: '#dc2626',
                }}
              >
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleDecline}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Decline
              </button>
              <button
                onClick={handleConfirm}
                disabled={scanState === 'confirming'}
                style={{
                  flex: 2,
                  padding: '1rem',
                  background: scanState === 'confirming' ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: scanState === 'confirming' ? 'not-allowed' : 'pointer',
                }}
              >
                {scanState === 'confirming' ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed State */}
        {scanState === 'confirmed' && confirmedTransaction && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                background: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#16a34a">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginBottom: '0.5rem' }}>
              Redemption Complete!
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '0.25rem' }}>
              {confirmedTransaction.rewardName}
            </p>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              {confirmedTransaction.pointsDeducted} points deducted
            </p>

            <div
              style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Member's new balance:{' '}
                <strong style={{ color: '#1f2937' }}>
                  {confirmedTransaction.newBalance.toLocaleString()} points
                </strong>
              </p>
            </div>

            <button
              onClick={handleScanAnother}
              style={{
                padding: '1rem 2rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Scan Another
            </button>
          </div>
        )}

        {/* Declined State */}
        {scanState === 'declined' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
              Redemption Declined
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              The member can generate a new QR code if needed.
            </p>
            <button
              onClick={handleScanAnother}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Scan Another
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: '2rem',
          maxWidth: '600px',
          margin: '2rem auto 0',
        }}
      >
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.75rem' }}>
            How it works
          </h3>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Member selects a reward in their app and shows you their QR code
            </li>
            <li style={{ marginBottom: '0.5rem' }}>Scan the QR code with your camera or enter code manually</li>
            <li style={{ marginBottom: '0.5rem' }}>
              Verify the member and reward details, then confirm to deduct points
            </li>
            <li>Provide the reward to the member - the QR code can only be used once</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
