'use client';

 

import React, { useState } from 'react';

import CustomerDashboardMockup from '@/app/components/CustomerDashboardMockup';

import BusinessDashboardMockup from '@/app/components/BusinessDashboardMockup';

import styles from '@/app/demo-dashboards/demo-dashboards.module.css';

 

export default function DemoDashboardsPage() {

  const [activeView, setActiveView] = useState<'customer' | 'business'>('customer');

 

  return (

    <div className={styles.demoPage}>

      {/* Demo Header */}

      <div className={styles.demoHeader}>

        <div className={styles.headerContent}>

          <div className={styles.headerText}>

            <h1>Spokesman Coffee Dashboard Mockups</h1>

            <p className={styles.headerSubtext}>

              Interactive preview for January demo - Toggle between customer and business views

            </p>

          </div>

 

          {/* View Toggle */}

          <div className={styles.viewToggle}>

            <button

              className={`${styles.toggleButton} ${activeView === 'customer' ? styles.toggleButtonActive : ''}`}

              onClick={() => setActiveView('customer')}

            >

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />

              </svg>

              Customer View

            </button>

            <button

              className={`${styles.toggleButton} ${activeView === 'business' ? styles.toggleButtonActive : ''}`}

              onClick={() => setActiveView('business')}

            >

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />

              </svg>

              Business View

            </button>

          </div>

        </div>

      </div>

 

      {/* Info Banners */}

      <div className={styles.infoBanner}>

        {activeView === 'customer' ? (

          <div className={styles.bannerContent}>

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

            <div>

              <strong>Customer Dashboard:</strong> What customers see when they scan QR codes or check their loyalty points.

              Features include points balance, rewards progress, transaction history, and QR code for scanning.

            </div>

          </div>

        ) : (

          <div className={styles.bannerContent}>

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

            <div>

              <strong>Business Dashboard:</strong> Analytics and management tools for Spokesman Coffee owners.

              Track active members, scan activity, top customers, and business metrics in real-time.

            </div>

          </div>

        )}

      </div>

 

      {/* Dashboard Display */}

      <div className={styles.dashboardContainer}>

        {activeView === 'customer' ? (

          <CustomerDashboardMockup />

        ) : (

          <BusinessDashboardMockup />

        )}

      </div>

    </div>

  );

}