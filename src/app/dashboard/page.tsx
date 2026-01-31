'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/dashboard-mockups.module.css';
import PayoutHistory from './components/PayoutHistory';
import LocationSelector from './components/LocationSelector';
import SendAnnouncementModal from './members/SendAnnouncementModal';

type Business = {
  id: string;
  name: string;
  locationNickname: string | null;
  address: string;
  slug: string;
};

type DashboardMetrics = {
  businessName: string;
  businessId: string;
  locationNickname: string | null;
  stats: {
    activeMembers: number;
    totalScansToday: number;
    totalScansWeek: number;
    pointsIssued: number;
    redemptionsToday: number;
    totalPayoutUSDC: string;
  };
  recentActivity: Array<{
    id: string;
    customer: string;
    action: string;
    time: string;
    location: string;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    visits: number;
    points: number;
    tier: string;
    avatar: string;
  }>;
  weeklyScans: Array<{
    day: string;
    scans: number;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<DashboardMetrics | null>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

  // Points adjustment modal state
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string; name: string; points: number} | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'reward' | 'confiscate'>('reward');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageCustomer, setMessageCustomer] = useState<{id: string; name: string} | null>(null);

  // Initial load - fetch merchant data first to get all businesses
  useEffect(() => {
    fetchMerchantData();
    fetchWalletBalance();
  }, []);

  // Fetch dashboard metrics when business selection changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchDashboardMetrics(selectedBusinessId);
      fetchQRCode(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  async function fetchMerchantData() {
    try {
      const res = await fetch('/api/merchant/me');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/dashboard/login');
          return;
        }
        throw new Error('Failed to fetch merchant data');
      }

      const data = await res.json();
      const allBusinesses = data.businesses || [];
      setBusinesses(allBusinesses);

      // Set initial selected business (from localStorage or first one)
      const savedBusinessId = typeof window !== 'undefined'
        ? localStorage.getItem('gob_selected_business')
        : null;

      const initialBusinessId = savedBusinessId && allBusinesses.some((b: Business) => b.id === savedBusinessId)
        ? savedBusinessId
        : allBusinesses[0]?.id;

      if (initialBusinessId) {
        setSelectedBusinessId(initialBusinessId);
      } else {
        setLoading(false);
        setError('No business locations found');
      }
    } catch (err: any) {
      console.error('Failed to fetch merchant data:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  function handleSelectBusiness(businessId: string) {
    setSelectedBusinessId(businessId);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('gob_selected_business', businessId);
    }
  }

  async function fetchDashboardMetrics(businessId: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/dashboard-metrics?businessId=${businessId}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/dashboard/login');
          return;
        }

        // Try to get error details from response
        const errorData = await res.json().catch(() => null);
        console.error('Dashboard API error:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });

        // Show detailed error message for debugging
        const errorMsg = errorData?.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData?.error || `Failed to fetch dashboard metrics (${res.status})`;
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setBusinessData(data);
      setError(null);
    } catch (err: any) {
      console.error('Dashboard metrics error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchQRCode(businessId: string) {
    try {
      const res = await fetch(`/api/merchant/qr-code?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } catch (err) {
      console.error('Failed to load QR code:', err);
    }
  }

  async function fetchWalletBalance() {
    try {
      const res = await fetch('/api/merchant/wallet-balance');
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    }
  }

  // Calculate max scans for chart scaling
  const maxScans = businessData?.weeklyScans.length
    ? Math.max(...businessData.weeklyScans.map(d => d.scans), 1)
    : 1;

  function handleLogout() {
    // Clear merchant session
    document.cookie = "gob_merchant_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/dashboard/login");
  }

  // Open points adjustment modal
  function openPointsModal(customer: {id: string; name: string; points: number}, type: 'reward' | 'confiscate') {
    setSelectedCustomer(customer);
    setAdjustmentType(type);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError(null);
    setShowPointsModal(true);
  }

  // Handle points adjustment submission
  async function handlePointsAdjustment() {
    if (!selectedCustomer) return;

    const amount = parseInt(adjustAmount);
    if (!amount || amount <= 0) {
      setAdjustError('Please enter a valid amount greater than 0');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Please provide a reason');
      return;
    }

    setAdjusting(true);
    setAdjustError(null);

    try {
      const res = await fetch(`/api/merchant/members/${selectedCustomer.id}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: adjustmentType === 'reward' ? amount : -amount,
          reason: adjustReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust points');
      }

      // Close modal and refresh data
      setShowPointsModal(false);
      if (selectedBusinessId) {
        fetchDashboardMetrics(selectedBusinessId);
      }
    } catch (err: any) {
      setAdjustError(err.message);
    } finally {
      setAdjusting(false);
    }
  }

  // Open message modal
  function openMessageModal(customer: {id: string; name: string}) {
    setMessageCustomer(customer);
    setShowMessageModal(true);
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.mockupContainer}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !businessData) {
    return (
      <div className={styles.mockupContainer}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: '#dc2626', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {error || 'Failed to load dashboard data'}
          </p>
          <button
            onClick={() => selectedBusinessId && fetchDashboardMetrics(selectedBusinessId)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mockupContainer}>
      {/* Dashboard Info Banner */}
      <div style={{
        background: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <strong style={{ color: '#1565c0' }}>Business Dashboard:</strong>
          <span style={{ color: '#424242' }}> Analytics and management tools for your business. Track active members, scan activity, top customers, and business metrics in real-time.</span>
        </div>
      </div>

      {/* Location Selector - only show if multiple locations */}
      {businesses.length > 1 && (
        <LocationSelector
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onSelectBusiness={handleSelectBusiness}
        />
      )}

      {/* Header Section */}
      <div className={styles.businessHeader}>
        <div>
          <h1>{businessData.businessName}</h1>
          <p className={styles.headerSubtext}>Business Analytics Dashboard</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className={styles.headerButtonPrimary}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button className={styles.headerButtonSecondary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
          <button
            onClick={handleLogout}
            className={styles.headerButtonSecondary}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #8bbcff 0%, #244b7a 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Active Members</p>
            <h3 className={styles.metricValue}>{businessData.stats.activeMembers.toLocaleString()}</h3>
            <p className={styles.metricChange}>
              {businessData.stats.activeMembers === 0
                ? 'Members will appear when they scan your QR code'
                : '+12% from last month'}
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Scans Today</p>
            <h3 className={styles.metricValue}>{businessData.stats.totalScansToday}</h3>
            <p className={styles.metricChange}>
              {businessData.stats.totalScansToday === 0
                ? 'Track customer visits in real-time'
                : `${businessData.stats.totalScansWeek} this week`}
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Points Issued (30d)</p>
            <h3 className={styles.metricValue}>{businessData.stats.pointsIssued.toLocaleString()}</h3>
            <p className={styles.metricChange}>
              {businessData.stats.pointsIssued === 0
                ? 'Total loyalty points awarded to members'
                : '+8% from last period'}
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Payouts</p>
            <h3 className={styles.metricValue}>${businessData.stats.totalPayoutUSDC}</h3>
            <p className={styles.metricChange}>
              {businessData.stats.totalPayoutUSDC === '0.00'
                ? 'USDC sent to members'
                : 'Total USDC paid out'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Activity Row */}
      <div className={styles.twoColumnGrid}>
        {/* Weekly Activity Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Weekly Scan Activity</h3>
          <div className={styles.chartContainer}>
            {maxScans === 1 && businessData.weeklyScans.every(d => d.scans === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 1rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p style={{ fontSize: '0.95rem' }}>No scan data yet</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Activity will appear here when members scan your QR code</p>
              </div>
            ) : (
              <div className={styles.barChart}>
                {businessData.weeklyScans.map((dayData, index) => {
                  const height = (dayData.scans / maxScans) * 100;
                  return (
                    <div key={index} className={styles.barWrapper}>
                      <div className={styles.barColumn}>
                        <div
                          className={styles.bar}
                          style={{ height: `${height}%` }}
                          title={`${dayData.scans} scans`}
                        >
                          <span className={styles.barValue}>{dayData.scans}</span>
                        </div>
                      </div>
                      <span className={styles.barLabel}>{dayData.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className={styles.activityCard}>
          <h3 className={styles.cardTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {businessData.recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ fontSize: '0.95rem' }}>No activity yet</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Member transactions will appear here</p>
              </div>
            ) : (
              businessData.recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>
                      <strong>{activity.customer}</strong> {activity.action}
                    </p>
                    <p className={styles.activityMeta}>
                      {activity.time} • {activity.location}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.cardTitle}>Top Customers</h3>
          {businessData.topCustomers.length > 0 && (
            <button
              className={styles.viewAllButton}
              onClick={() => router.push('/dashboard/members')}
            >
              View All →
            </button>
          )}
        </div>
        <div className={styles.tableWrapper}>
          {businessData.topCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>No customers yet</p>
              <p style={{ fontSize: '0.9rem' }}>Your top members will appear here when they start earning points</p>
            </div>
          ) : (
            <table className={styles.customersTable}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Visits</th>
                  <th>Points Balance</th>
                  <th>Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {businessData.topCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.customerCell}>
                        <div className={styles.customerAvatar}>{customer.avatar}</div>
                        <span className={styles.customerName}>{customer.name}</span>
                      </div>
                    </td>
                    <td className={styles.visitCell}>{customer.visits}</td>
                    <td className={styles.pointsCell}>{customer.points.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.tierBadgeTable} ${styles[`tier${customer.tier}`]}`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Reward Button */}
                        <button
                          onClick={() => openPointsModal({id: customer.id, name: customer.name, points: customer.points}, 'reward')}
                          title="Reward points"
                          style={{
                            padding: '0.4rem 0.6rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Reward
                        </button>

                        {/* Confiscate Button */}
                        <button
                          onClick={() => openPointsModal({id: customer.id, name: customer.name, points: customer.points}, 'confiscate')}
                          title="Confiscate points"
                          style={{
                            padding: '0.4rem 0.6rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                          Confiscate
                        </button>

                        {/* Email Button */}
                        <button
                          onClick={() => openMessageModal({id: customer.id, name: customer.name})}
                          title="Send message"
                          style={{
                            padding: '0.4rem 0.5rem',
                            background: '#244b7a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {/* View Profile Button */}
                        <button
                          className={styles.actionButton}
                          onClick={() => router.push(`/dashboard/members/${customer.id}`)}
                          style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QR Code Widget */}
      {qrData && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className={styles.qrCodeHeader}>
            <div className={styles.qrCodeHeaderText}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem', margin: 0 }}>
                Your QR Code
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                Display this code at your point of sale for customers to scan and earn points
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/settings?tab=qr-codes')}
              className={styles.headerButtonPrimary}
              style={{ flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
            <div style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📱</div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Preview available on QR Codes page
                </p>
              </div>
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <p style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
                    Scans Today
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e3a8a' }}>
                    {qrData.stats?.scansToday || 0}
                  </p>
                </div>

                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <p style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
                    Total Scans
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#14532d' }}>
                    {qrData.stats?.totalScans || 0}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#fff7ed',
                borderRadius: '8px',
                border: '1px solid #fed7aa'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#9a3412', lineHeight: '1.5' }}>
                  <strong>How to use:</strong> Download the QR code from the QR Codes page and display it on your POS screen or print it on receipts. Customers scan to earn loyalty points instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance Widget */}
      {walletData && walletData.hasWallet && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                Payout Wallet Balance
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Wallet: {walletData.walletAddress?.slice(0, 6)}...{walletData.walletAddress?.slice(-4)}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/settings?tab=payout-wallet')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#244b7a',
                border: '1px solid #244b7a',
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Wallet
            </button>
          </div>

          {/* Low Balance Alerts */}
          {(walletData.alerts?.isLowBalance || walletData.alerts?.isLowGas) && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.25rem' }}>
                    Low Balance Warning
                  </p>
                  {walletData.alerts.isLowBalance && (
                    <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '0.25rem' }}>
                      USDC balance is below ${walletData.alerts.lowBalanceThreshold}. Please add funds to continue payouts.
                    </p>
                  )}
                  {walletData.alerts.isLowGas && (
                    <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                      MATIC balance is low. You need MATIC for gas fees to process transactions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="wallet-balance-grid">
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '10px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  USDC Balance
                </p>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                ${parseFloat(walletData.balances?.usdc || '0').toFixed(2)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                On Polygon Network
              </p>
            </div>

            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '10px',
              border: '1px solid #fcd34d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#92400e', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  MATIC Balance
                </p>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#78350f', marginBottom: '0.25rem' }}>
                {parseFloat(walletData.balances?.matic || '0').toFixed(3)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#d97706' }}>
                For gas fees
              </p>
            </div>

            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '10px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#15803d', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  Payouts Ready
                </p>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#14532d', marginBottom: '0.25rem' }}>
                {walletData.payout?.payoutsRemaining || 0}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                ${walletData.payout?.amountPerPayout || 0} each
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5' }}>
              <strong>How it works:</strong> When members reach {walletData.payout?.pointsRequired || 100} points, they can claim ${walletData.payout?.amountPerPayout || 5} USDC. Funds are automatically transferred from this wallet to their custodial wallet. Make sure to keep your balance above ${walletData.alerts?.lowBalanceThreshold || 50} to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Wallet Not Configured */}
      {walletData && !walletData.hasWallet && (
        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
            Set Up Your Payout Wallet
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Configure your payout wallet in Settings to start rewarding your loyal customers with USDC payments on Polygon.
          </p>
          <button
            onClick={() => router.push('/dashboard/settings?tab=payout-wallet')}
            style={{
              padding: '0.75rem 2rem',
              background: '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Configure Wallet
          </button>
        </div>
      )}

      {/* Payout History */}
      {walletData && walletData.hasWallet && (
        <div style={{ marginTop: '2rem' }}>
          <PayoutHistory />
        </div>
      )}

      {/* Points Adjustment Modal */}
      {showPointsModal && selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPointsModal(false);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: adjustmentType === 'reward' ? '#059669' : '#dc2626',
                }}>
                  {adjustmentType === 'reward' ? 'Reward Points' : 'Confiscate Points'}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedCustomer.name} • Current: {selectedCustomer.points.toLocaleString()} pts
                </p>
              </div>
              <button
                onClick={() => setShowPointsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#9ca3af',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {adjustError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}>
                  {adjustError}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Points to {adjustmentType === 'reward' ? 'Add' : 'Remove'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={adjusting}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Reason
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={adjustmentType === 'reward' ? 'e.g., Birthday bonus, Loyalty reward' : 'e.g., Policy violation, Fraud correction'}
                  disabled={adjusting}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Preview */}
              {adjustAmount && parseInt(adjustAmount) > 0 && (
                <div style={{
                  padding: '1rem',
                  background: adjustmentType === 'reward' ? '#ecfdf5' : '#fef2f2',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: adjustmentType === 'reward' ? '#065f46' : '#991b1b',
                  }}>
                    New balance: <strong>{(adjustmentType === 'reward'
                      ? selectedCustomer.points + parseInt(adjustAmount)
                      : Math.max(0, selectedCustomer.points - parseInt(adjustAmount))
                    ).toLocaleString()} pts</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowPointsModal(false)}
                disabled={adjusting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePointsAdjustment}
                disabled={adjusting || !adjustAmount || !adjustReason.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: adjustmentType === 'reward' ? '#10b981' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: adjusting || !adjustAmount || !adjustReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: adjusting || !adjustAmount || !adjustReason.trim() ? 0.6 : 1,
                }}
              >
                {adjusting ? 'Processing...' : (adjustmentType === 'reward' ? 'Add Points' : 'Remove Points')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      <SendAnnouncementModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setMessageCustomer(null);
        }}
        memberIds={messageCustomer ? [messageCustomer.id] : undefined}
        memberName={messageCustomer?.name}
        onSuccess={() => {
          // Optionally show success feedback
        }}
      />
    </div>
  );
}
