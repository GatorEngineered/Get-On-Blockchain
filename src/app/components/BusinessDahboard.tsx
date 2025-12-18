'use client';

 

import React from 'react';

import styles from '../styles/dashboard-mockups.module.css';

 

type Merchant = {

  id: string;

  name: string;

  slug: string;

  plan: string;

};

 

type EventStats = {

  total: number;

  SCAN: number;

  CONNECT_WALLET: number;

  CREATE_EMAIL: number;

  REWARD_EARNED: number;

  REWARD_REDEEMED: number;

};

 

type BusinessDashboardProps = {

  merchants: Merchant[];

  membersByMerchant: Record<string, number>;

  eventsByMerchant: Record<string, EventStats>;

};

 

export default function BusinessDashboard({

  merchants,

  membersByMerchant,

  eventsByMerchant

}: BusinessDashboardProps) {

  // Calculate aggregate stats across all merchants

  const totalMembers = Object.values(membersByMerchant).reduce((sum, count) => sum + count, 0);

  const totalScans = Object.values(eventsByMerchant).reduce((sum, stats) => sum + stats.SCAN, 0);

  const totalPointsIssued = Object.values(eventsByMerchant).reduce((sum, stats) => sum + stats.REWARD_EARNED, 0);

  const totalRedemptions = Object.values(eventsByMerchant).reduce((sum, stats) => sum + stats.REWARD_REDEEMED, 0);

 

  // Get recent activity (most active merchants)

  const recentActivity = merchants.slice(0, 6).map((merchant, index) => {

    const stats = eventsByMerchant[merchant.id] || { SCAN: 0, REWARD_REDEEMED: 0 };

    const action = stats.REWARD_REDEEMED > 0

      ? `Redeemed reward (${stats.REWARD_REDEEMED} total)`

      : `${stats.SCAN} scans`;

 

    return {

      id: merchant.id,

      merchant: merchant.name,

      action: action,

      time: "Recently",

      location: merchant.slug

    };

  });

 

  // Top merchants by activity

  const topMerchants = merchants

    .map(merchant => {

      const stats = eventsByMerchant[merchant.id] || { total: 0, SCAN: 0 };

      const members = membersByMerchant[merchant.id] || 0;

 

      return {

        id: merchant.id,

        name: merchant.name,

        visits: stats.SCAN,

        members: members,

        tier: merchant.plan,

        avatar: merchant.name.substring(0, 2).toUpperCase()

      };

    })

    .sort((a, b) => b.visits - a.visits)

    .slice(0, 5);

 

  // Weekly scans (mock data for now - you can replace with real time-series data)

  const weeklyScans = [

    { day: "Mon", scans: Math.floor(totalScans * 0.14) },

    { day: "Tue", scans: Math.floor(totalScans * 0.16) },

    { day: "Wed", scans: Math.floor(totalScans * 0.17) },

    { day: "Thu", scans: Math.floor(totalScans * 0.16) },

    { day: "Fri", scans: Math.floor(totalScans * 0.20) },

    { day: "Sat", scans: Math.floor(totalScans * 0.10) },

    { day: "Sun", scans: Math.floor(totalScans * 0.07) },

  ];

 

  const maxScans = Math.max(...weeklyScans.map(d => d.scans));

 

  return (

    <div className={styles.mockupContainer}>

      {/* Header Section */}

      <div className={styles.businessHeader}>

        <div>

          <h1>Blockchain Reward & Loyalty</h1>

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

            <p className={styles.metricLabel}>Total Members</p>

            <h3 className={styles.metricValue}>{totalMembers.toLocaleString()}</h3>

            <p className={styles.metricChange}>Across all merchants</p>

          </div>

        </div>

 

        <div className={styles.metricCard}>

          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />

            </svg>

          </div>

          <div className={styles.metricContent}>

            <p className={styles.metricLabel}>Total Scans</p>

            <h3 className={styles.metricValue}>{totalScans.toLocaleString()}</h3>

            <p className={styles.metricChange}>{merchants.length} active merchants</p>

          </div>

        </div>

 

        <div className={styles.metricCard}>

          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />

            </svg>

          </div>

          <div className={styles.metricContent}>

            <p className={styles.metricLabel}>Rewards Earned</p>

            <h3 className={styles.metricValue}>{totalPointsIssued.toLocaleString()}</h3>

            <p className={styles.metricChange}>Total rewards issued</p>

          </div>

        </div>

 

        <div className={styles.metricCard}>

          <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

          </div>

          <div className={styles.metricContent}>

            <p className={styles.metricLabel}>Redemptions</p>

            <h3 className={styles.metricValue}>{totalRedemptions.toLocaleString()}</h3>

            <p className={styles.metricChange}>Total redeemed</p>

          </div>

        </div>

      </div>

 

      {/* Charts and Activity Row */}

      <div className={styles.twoColumnGrid}>

        {/* Weekly Activity Chart */}

        <div className={styles.chartCard}>

          <h3 className={styles.cardTitle}>Scan Activity Distribution</h3>

          <div className={styles.chartContainer}>

            <div className={styles.barChart}>

              {weeklyScans.map((dayData, index) => {

                const height = maxScans > 0 ? (dayData.scans / maxScans) * 100 : 0;

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

          <h3 className={styles.cardTitle}>Merchant Activity</h3>

          <div className={styles.activityList}>

            {recentActivity.length > 0 ? (

              recentActivity.map((activity) => (

                <div key={activity.id} className={styles.activityItem}>

                  <div className={styles.activityDot}></div>

                  <div className={styles.activityContent}>

                    <p className={styles.activityText}>

                      <strong>{activity.merchant}</strong> {activity.action}

                    </p>

                    <p className={styles.activityMeta}>

                      {activity.time} • {activity.location}

                    </p>

                  </div>

                </div>

              ))

            ) : (

              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>

                No activity yet

              </p>

            )}

          </div>

        </div>

      </div>

 

      {/* Top Merchants Table */}

      <div className={styles.tableCard}>

        <div className={styles.tableHeader}>

          <h3 className={styles.cardTitle}>Top Merchants by Activity</h3>

        </div>

        <div className={styles.tableWrapper}>

          <table className={styles.customersTable}>

            <thead>

              <tr>

                <th>Merchant</th>

                <th>Total Scans</th>

                <th>Members</th>

                <th>Plan</th>

              </tr>

            </thead>

            <tbody>

              {topMerchants.length > 0 ? (

                topMerchants.map((merchant) => (

                  <tr key={merchant.id}>

                    <td>

                      <div className={styles.customerCell}>

                        <div className={styles.customerAvatar}>{merchant.avatar}</div>

                        <span className={styles.customerName}>{merchant.name}</span>

                      </div>

                    </td>

                    <td className={styles.visitCell}>{merchant.visits.toLocaleString()}</td>

                    <td className={styles.pointsCell}>{merchant.members.toLocaleString()}</td>

                    <td>

                      <span className={`${styles.tierBadgeTable} ${styles.tierGold}`}>

                        {merchant.tier}

                      </span>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>

                    No merchants yet

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

 