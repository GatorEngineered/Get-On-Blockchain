'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: 'TRADITIONAL' | 'USDC_PAYOUT';
  usdcAmount: number | null;
};

type RedemptionQRModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward;
  merchantId: string;
  merchantName: string;
  memberPoints: number;
  onRedemptionComplete?: () => void;
};

type RedemptionState = 'idle' | 'creating' | 'active' | 'confirmed' | 'declined' | 'expired' | 'error';

export default function RedemptionQRModal({
  isOpen,
  onClose,
  reward,
  merchantId,
  merchantName,
  memberPoints,
  onRedemptionComplete,
}: RedemptionQRModalProps) {
  const [state, setState] = useState<RedemptionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [redemptionId, setRedemptionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showGuide, setShowGuide] = useState(true);

  // Create redemption request when modal opens
  useEffect(() => {
    if (isOpen && state === 'idle') {
      // Check if user has seen the guide before
      const hasSeenGuide = localStorage.getItem('gob_redemption_guide_seen');
      setShowGuide(!hasSeenGuide);
    }
  }, [isOpen, state]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || state !== 'active') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setState('expired');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, state]);

  // Poll for status updates (check if staff confirmed/declined)
  useEffect(() => {
    if (!redemptionId || state !== 'active') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/member/redemption/status?id=${redemptionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'CONFIRMED') {
            setState('confirmed');
            clearInterval(pollInterval);
            onRedemptionComplete?.();
          } else if (data.status === 'DECLINED') {
            setState('declined');
            clearInterval(pollInterval);
          } else if (data.status === 'EXPIRED') {
            setState('expired');
            clearInterval(pollInterval);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [redemptionId, state, onRedemptionComplete]);

  async function createRedemption() {
    setState('creating');
    setError(null);

    try {
      const res = await fetch('/api/member/redemption/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          rewardId: reward.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create redemption');
        setState('error');
        return;
      }

      setQrCodeData(data.qrCodeData);
      setRedemptionId(data.redemptionId);
      setExpiresAt(new Date(data.expiresAt));
      setTimeRemaining(data.expiresInMinutes * 60);
      setState('active');
    } catch (err: any) {
      setError(err.message || 'Failed to create redemption');
      setState('error');
    }
  }

  async function cancelRedemption() {
    if (!redemptionId) return;

    try {
      await fetch('/api/member/redemption/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId }),
      });
    } catch {
      // Ignore cancel errors
    }

    handleClose();
  }

  function handleClose() {
    setState('idle');
    setError(null);
    setQrCodeData(null);
    setRedemptionId(null);
    setExpiresAt(null);
    setTimeRemaining(0);
    setShowGuide(false);
    onClose();
  }

  function handleStartRedemption() {
    // Mark guide as seen
    localStorage.setItem('gob_redemption_guide_seen', 'true');
    setShowGuide(false);
    createRedemption();
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && state !== 'active') handleClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '0',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937', fontWeight: '700' }}>
              Redeem Reward
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              {merchantName}
            </p>
          </div>
          {state !== 'active' && (
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
              }}
            >
              x
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Guide / Instructions (first time) */}
          {showGuide && state === 'idle' && (
            <div>
              <div
                style={{
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#1e40af', fontWeight: '600' }}>
                  How Redemption Works
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { step: 1, text: 'Tap "Generate QR Code" below', icon: '📱' },
                    { step: 2, text: 'Show the QR code to staff at checkout', icon: '🔍' },
                    { step: 3, text: 'Staff scans your code to verify', icon: '✓' },
                    { step: 4, text: 'Enjoy your reward!', icon: '🎉' },
                  ].map((item) => (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <p style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
                  <strong>Important:</strong> The QR code expires in 10 minutes. Make sure you're ready at
                  checkout before generating it.
                </p>
              </div>

              {/* Reward Preview */}
              <div
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                  Redeeming
                </p>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '1.1rem' }}>{reward.name}</p>
                <p style={{ margin: '0.5rem 0 0', color: '#dc2626', fontWeight: '600' }}>
                  {reward.pointsCost} points will be deducted
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Your balance: {memberPoints} points
                </p>
              </div>

              <button
                onClick={handleStartRedemption}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Generate QR Code
              </button>
            </div>
          )}

          {/* Creating state */}
          {state === 'creating' && (
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
              <p style={{ color: '#6b7280' }}>Generating your QR code...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Active state - Show QR */}
          {state === 'active' && qrCodeData && (
            <div style={{ textAlign: 'center' }}>
              {/* Timer */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: timeRemaining <= 60 ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '20px',
                  marginBottom: '1.5rem',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={timeRemaining <= 60 ? '#dc2626' : '#16a34a'}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span style={{ fontWeight: '600', color: timeRemaining <= 60 ? '#dc2626' : '#16a34a' }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* QR Code */}
              <div
                style={{
                  padding: '1.5rem',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  display: 'inline-block',
                  marginBottom: '1.5rem',
                }}
              >
                <QRCodeSVG
                  value={qrCodeData}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#244b7a"
                />
              </div>

              {/* Reward Info */}
              <div
                style={{
                  padding: '1rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: 0, fontWeight: '600', color: '#92400e', fontSize: '1.1rem' }}>
                  {reward.name}
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#78350f', fontSize: '0.875rem' }}>
                  Show this QR code to staff
                </p>
              </div>

              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Waiting for staff to scan...
              </p>

              <button
                onClick={cancelRedemption}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Cancel Redemption
              </button>
            </div>
          )}

          {/* Confirmed state */}
          {state === 'confirmed' && (
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
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#16a34a', fontWeight: '700' }}>
                Redemption Complete!
              </h3>
              <p style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem' }}>{reward.name}</p>
              <p style={{ margin: '0.5rem 0 1.5rem', color: '#6b7280' }}>
                {reward.pointsCost} points have been deducted
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '1rem 2rem',
                  background: '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Declined state */}
          {state === 'declined' && (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#dc2626', fontWeight: '600' }}>
                Redemption Declined
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: '#6b7280' }}>
                The staff member declined this redemption. Please speak with them if you have questions.
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* Expired state */}
          {state === 'expired' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: '#fef3c7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#d97706', fontWeight: '600' }}>
                QR Code Expired
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: '#6b7280' }}>
                The QR code has expired. No points were deducted. You can generate a new one when you're ready.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setState('idle');
                    setShowGuide(false);
                    createRedemption();
                  }}
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
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
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
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#dc2626', fontWeight: '600' }}>
                Something went wrong
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: '#6b7280' }}>{error}</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setState('idle');
                    setError(null);
                    setShowGuide(false);
                    createRedemption();
                  }}
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
            </div>
          )}

          {/* Returning user - skip guide */}
          {!showGuide && state === 'idle' && (
            <div>
              {/* Reward Preview */}
              <div
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                  Redeeming
                </p>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '1.1rem' }}>{reward.name}</p>
                {reward.description && (
                  <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    {reward.description}
                  </p>
                )}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                    {reward.pointsCost} points will be deducted
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Your balance: {memberPoints} points → {memberPoints - reward.pointsCost} points
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartRedemption}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Generate QR Code
              </button>

              <p
                style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}
              >
                QR code expires in 10 minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
