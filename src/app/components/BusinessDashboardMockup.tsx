'use client';

import React from 'react';
import styles from '../styles/dashboard-mockups.module.css';

export default function BusinessDashboardMockup() {
  // Sample data for mockup
  const businessData = {
    businessName: "Spokesman Coffee",
    stats: {
      activeMembers: 1247,
      totalScansToday: 89,
      totalScansWeek: 523,
      pointsIssued: 15840,
      redemptionsToday: 12,
    },
    recentActivity: [
      { id: 1, customer: "Sarah J.", action: "Earned 25 points", time: "2 min ago", location: "Downtown" },
      { id: 2, customer: "Mike R.", action: "Redeemed Free Coffee", time: "8 min ago", location: "Main Street" },
      { id: 3, customer: "Emily T.", action: "Earned 35 points", time: "15 min ago", location: "Downtown" },
      { id: 4, customer: "James K.", action: "Earned 30 points", time: "22 min ago", location: "Downtown" },
      { id: 5, customer: "Lisa M.", action: "Earned 45 points", time: "28 min ago", location: "Main Street" },
      { id: 6, customer: "David P.", action: "Redeemed 10% Off", time: "35 min ago", location: "Downtown" },
    ],
    topCustomers: [
      { id: 1, name: "Sarah Johnson", visits: 47, points: 1250, tier: "Gold", avatar: "SJ" },
      { id: 2, name: "Michael Rodriguez", visits: 42, points: 1100, tier: "Gold", avatar: "MR" },
      { id: 3, name: "Emily Thompson", visits: 38, points: 980, tier: "Silver", avatar: "ET" },
      { id: 4, name: "James Kim", visits: 35, points: 875, tier: "Silver", avatar: "JK" },
      { id: 5, name: "Lisa Martinez", visits: 31, points: 820, tier: "Silver", avatar: "LM" },
    ],
    weeklyScans: [
      { day: "Mon", scans: 67 },
      { day: "Tue", scans: 82 },
      { day: "Wed", scans: 91 },
      { day: "Thu", scans: 88 },
      { day: "Fri", scans: 105 },
      { day: "Sat", scans: 54 },
      { day: "Sun", scans: 36 },
    ]
  };

  // Calculate max scans for chart scaling
  const maxScans = Math.max(...businessData.weeklyScans.map(d => d.scans));

  return (
    <div className={styles.mockupContainer}>
      {/* Header Section */}
      <div className={styles.businessHeader}>
        <div>
          <h1>{businessData.businessName}</h1>
          <p className={styles.headerSubtext}>Business Analytics Dashboard</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.exportButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
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
            <p className={styles.metricChange}>+12% from last month</p>
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
            <p className={styles.metricChange}>{businessData.stats.totalScansWeek} this week</p>
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
            <p className={styles.metricChange}>+8% from last period</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Redemptions Today</p>
            <h3 className={styles.metricValue}>{businessData.stats.redemptionsToday}</h3>
            <p className={styles.metricChange}>Average: 15/day</p>
          </div>
        </div>
      </div>

      {/* Charts and Activity Row */}
      <div className={styles.twoColumnGrid}>
        {/* Weekly Activity Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Weekly Scan Activity</h3>
          <div className={styles.chartContainer}>
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
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className={styles.activityCard}>
          <h3 className={styles.cardTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {businessData.recentActivity.map((activity) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.cardTitle}>Top Customers</h3>
          <button className={styles.viewAllButton}>View All →</button>
        </div>
        <div className={styles.tableWrapper}>
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
                    <button className={styles.actionButton}>View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
