'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type QRCodeData = {
  qrCode: {
    id: string;
    code: string;
    createdAt: string;
    isActive: boolean;
  };
  stats: {
    totalScans: number;
    scansToday: number;
  };
  business: {
    id: string;
    name: string;
  };
};

export default function QRCodesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QRCodeData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function loadQRCode() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/qr-code');

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load QR code');
      }

      const json = await res.json();
      setData(json);

      // Generate QR code on canvas
      if (canvasRef.current && json.qrCode?.code) {
        await QRCode.toCanvas(canvasRef.current, json.qrCode.code, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!confirm('Are you sure you want to regenerate your QR code? The old QR code will no longer work.')) {
      return;
    }

    try {
      setRegenerating(true);
      setMessage(null);

      const res = await fetch('/api/merchant/qr-code/regenerate', {
        method: 'POST',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to regenerate QR code');
      }

      setMessage({ type: 'success', text: json.message });
      await loadQRCode();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRegenerating(false);
    }
  }

  function handleDownloadPNG() {
    if (!canvasRef.current) return;

    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${data?.business.name || 'QR-Code'}-loyalty.png`;
    link.href = url;
    link.click();
  }

  useEffect(() => {
    loadQRCode();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading QR code...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
          QR Code Management
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Manage your loyalty program QR code for POS integration
        </p>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* QR Code Display */}
        <div style={{
          padding: '2rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
            Active QR Code
          </h2>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              <strong>Business:</strong> {data?.business.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              <strong>Created:</strong> {data?.qrCode.createdAt ? new Date(data.qrCode.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Status:</strong>{' '}
              <span style={{
                color: data?.qrCode.isActive ? '#059669' : '#dc2626',
                fontWeight: '600'
              }}>
                {data?.qrCode.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <button
              onClick={handleDownloadPNG}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Download PNG for POS
            </button>

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.6 : 1,
                width: '100%'
              }}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate QR Code'}
            </button>
          </div>
        </div>

        {/* Statistics & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Cards */}
          <div style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Scan Statistics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                  Today
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1e3a8a' }}>
                  {data?.stats.scansToday || 0}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#15803d', marginBottom: '0.25rem' }}>
                  Total
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#14532d' }}>
                  {data?.stats.totalScans || 0}
                </p>
              </div>
            </div>
          </div>

          {/* POS Integration Guide */}
          <div style={{
            padding: '1.5rem',
            background: '#fff7ed',
            borderRadius: '12px',
            border: '1px solid #fed7aa'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#9a3412', marginBottom: '1rem' }}>
              POS Integration Guide
            </h3>

            <div style={{ fontSize: '0.95rem', color: '#7c2d12', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>1. Download QR Code:</strong> Click "Download PNG for POS" above
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>2. Upload to POS:</strong> Add the PNG to your POS screen or receipt template
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>3. Display Options:</strong>
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
                <li>Customer-facing screen (recommended)</li>
                <li>Printed on receipts</li>
                <li>Checkout counter display</li>
              </ul>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>4. Customer Action:</strong> Customers scan with their mobile device to earn points
              </p>
              <p style={{ color: '#c2410c', fontWeight: '600', fontSize: '0.875rem', marginTop: '1rem' }}>
                Note: Customers can only scan once per day (same calendar day) to prevent fraud.
              </p>
            </div>
          </div>

          {/* Security Info */}
          <div style={{
            padding: '1.5rem',
            background: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#991b1b', marginBottom: '1rem' }}>
              Security & Management
            </h3>

            <div style={{ fontSize: '0.95rem', color: '#7f1d1d', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>When to Regenerate:</strong>
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
                <li>Suspected fraudulent scanning</li>
                <li>Periodic security updates (monthly/quarterly)</li>
                <li>QR code has been compromised</li>
              </ul>
              <p style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.875rem' }}>
                Warning: Regenerating will immediately invalidate the old QR code. Update your POS system promptly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
