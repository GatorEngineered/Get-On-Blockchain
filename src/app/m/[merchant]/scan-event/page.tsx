'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

export default function ScanEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const merchantSlug = params.merchant as string;
  const qrCode = searchParams.get('code');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    checkAuthAndProcess();
  }, []);

  async function checkAuthAndProcess() {
    try {
      setLoading(true);

      // Check if member is logged in
      const authRes = await fetch('/api/member/me');

      if (!authRes.ok) {
        // Not logged in - redirect to member login
        const returnUrl = `/m/${merchantSlug}/scan-event?code=${encodeURIComponent(qrCode || '')}`;
        router.push(`/member/login?returnTo=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Member is logged in - get merchant info
      const businessRes = await fetch(`/api/business/${merchantSlug}`);
      if (businessRes.ok) {
        const businessData = await businessRes.json();
        setMerchantName(businessData.merchantName || businessData.name);
      }

      // If QR code is present in URL, process scan immediately
      if (qrCode) {
        await processScan();
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      setResult({
        success: false,
        message: err.message || 'Failed to verify authentication'
      });
    } finally {
      setLoading(false);
    }
  }

  async function processScan() {
    try {
      setProcessing(true);
      setResult(null);

      if (!qrCode) {
        throw new Error('No QR code provided');
      }

      const res = await fetch('/api/member/scan-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process event scan');
      }

      setResult({
        success: true,
        message: data.message,
        data: data.eventScan
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to process event scan'
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ⏳
          </div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite'
          }}>
            🎫
          </div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Processing your event check-in...
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: result.success
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem'
          }}>
            {result.success ? '🎉' : '⚠️'}
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: result.success ? '#d97706' : '#dc2626',
            marginBottom: '1rem'
          }}>
            {result.success ? 'Event Check-In Complete!' : 'Oops!'}
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#374151',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {result.message}
          </p>

          {result.success && result.data && (
            <div style={{
              background: '#fffbeb',
              border: '2px solid #fcd34d',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              {result.data.eventName && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Event
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>
                    {result.data.eventName}
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                textAlign: 'left'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Event Points
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#d97706' }}>
                    +{result.data.pointsAwarded}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Total Points
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0891b2' }}>
                    {result.data.totalPoints}
                  </p>
                </div>
              </div>

              {result.data.tier && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Current Tier
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: result.data.tier === 'SUPER' ? '#9333ea' : result.data.tier === 'VIP' ? '#f59e0b' : '#6b7280'
                  }}>
                    {result.data.tier}
                    {result.data.tierUpgrade && ' 🎊 UPGRADED!'}
                  </p>
                </div>
              )}

              {result.data.tokensMinted > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Tokens Minted
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6366f1' }}>
                    +{result.data.tokensMinted} 🪙
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/member/dashboard')}
              style={{
                padding: '1rem 2rem',
                background: result.success ? '#d97706' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              View My Dashboard
            </button>

            <button
              onClick={() => router.push(`/m/${merchantSlug}`)}
              style={{
                padding: '1rem 2rem',
                background: 'white',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to {merchantName || 'Business'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state (shouldn't reach here normally)
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
          Event Check-In
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Scan the event QR code at {merchantName} to earn bonus points
        </p>
        <button
          onClick={() => router.push(`/m/${merchantSlug}`)}
          style={{
            padding: '1rem 2rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Business Page
        </button>
      </div>
    </div>
  );
}
