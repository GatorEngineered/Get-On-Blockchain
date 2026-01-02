'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type MemberProfile = {
  member: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    memberSince: string;
    joinedBusiness: string;
  };
  loyalty: {
    points: number;
    tier: string;
    nextTier: string | null;
    nextTierThreshold: number | null;
    tierProgress: number;
    totalVisits: number;
    lastVisit: string | null;
  };
  scans: Array<{
    id: string;
    scannedAt: string;
    pointsAwarded: number;
    status: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string | null;
    status: string;
    createdAt: string;
    txHash: string | null;
  }>;
  business: {
    id: string;
    name: string;
  };
};

export default function MemberProfilePage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Points adjustment modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [memberId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/members/${memberId}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/dashboard/login');
          return;
        }
        throw new Error('Failed to load member profile');
      }

      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error('Load profile error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustPoints() {
    if (!adjustAmount || adjustAmount === '0') {
      alert('Please enter a valid amount');
      return;
    }

    if (!adjustReason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    try {
      setAdjusting(true);

      const res = await fetch(`/api/merchant/members/${memberId}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(adjustAmount),
          reason: adjustReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust points');
      }

      alert(data.message);
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      await loadProfile(); // Reload profile
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading member profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: '1.1rem', marginBottom: '1rem' }}>{error || 'Member not found'}</p>
        <button
          onClick={() => router.push('/dashboard/members')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#244b7a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Back to Members
        </button>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'SUPER': return '#9333ea';
      case 'VIP': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => router.push('/dashboard/members')}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Members
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            {profile.member.fullName}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Member since {new Date(profile.member.joinedBusiness).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#244b7a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adjust Points
        </button>
      </div>

      {/* Top Row - Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Member Info Card */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem' }}>
            Contact Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Email</p>
              <p style={{ fontSize: '0.95rem', color: '#1f2937' }}>{profile.member.email}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Phone</p>
              <p style={{ fontSize: '0.95rem', color: '#1f2937' }}>{profile.member.phone || 'Not provided'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Member ID</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                {profile.member.id.slice(0, 12)}...
              </p>
            </div>
          </div>
        </div>

        {/* Points & Tier Card */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem' }}>
            Points & Tier
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '3rem', fontWeight: '700', color: '#244b7a', lineHeight: '1' }}>
              {profile.loyalty.points}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Total Points</p>
          </div>
          <div style={{
            padding: '0.75rem',
            background: getTierColor(profile.loyalty.tier) + '15',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: getTierColor(profile.loyalty.tier) }}>
              {profile.loyalty.tier} TIER
            </p>
          </div>
          {profile.loyalty.nextTier && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                <span>Progress to {profile.loyalty.nextTier}</span>
                <span>{Math.round(profile.loyalty.tierProgress)}%</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${profile.loyalty.tierProgress}%`,
                  height: '100%',
                  background: getTierColor(profile.loyalty.nextTier),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Visit Stats Card */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem' }}>
            Visit Statistics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Total Visits</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>{profile.loyalty.totalVisits}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Last Visit</p>
              <p style={{ fontSize: '0.95rem', color: '#1f2937' }}>
                {profile.loyalty.lastVisit
                  ? new Date(profile.loyalty.lastVisit).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Scans */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Recent Visits
            </h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {profile.scans.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <p>No visits yet</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#6b7280' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.scans.map((scan, idx) => (
                    <tr key={scan.id} style={{ borderBottom: idx < profile.scans.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>
                        {new Date(scan.scannedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                        +{scan.pointsAwarded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Transaction History
            </h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {profile.transactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <p>No transactions yet</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Reason</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#6b7280' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.transactions.map((tx, idx) => (
                    <tr key={tx.id} style={{ borderBottom: idx < profile.transactions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: tx.type === 'EARN' ? '#d1fae5' : tx.type === 'REDEEM' ? '#fee2e2' : '#e0e7ff',
                          color: tx.type === 'EARN' ? '#065f46' : tx.type === 'REDEEM' ? '#991b1b' : '#3730a3'
                        }}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.reason || '-'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: tx.type === 'EARN' ? '#059669' : tx.type === 'REDEEM' ? '#dc2626' : '#6366f1',
                        fontWeight: '600'
                      }}>
                        {tx.type === 'REDEEM' ? '-' : '+'}{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Points Adjustment Modal */}
      {showAdjustModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>
              Adjust Points
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Points Amount
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter positive or negative number (e.g., 50 or -20)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Use positive numbers to add points, negative to remove
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Reason (Required)
              </label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Customer complaint compensation, Duplicate scan correction, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustAmount('');
                  setAdjustReason('');
                }}
                disabled={adjusting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: adjusting ? 'not-allowed' : 'pointer',
                  opacity: adjusting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustPoints}
                disabled={adjusting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#244b7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: adjusting ? 'not-allowed' : 'pointer',
                  opacity: adjusting ? 0.6 : 1
                }}
              >
                {adjusting ? 'Adjusting...' : 'Confirm Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
