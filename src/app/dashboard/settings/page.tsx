'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './settings.module.css';
import AccountSettings from './components/AccountSettings';
import BillingSettings from './components/BillingSettings';
import PayoutWalletSettings from './components/PayoutWalletSettings';
import PlansSettings from './components/PlansSettings';
import RewardTiersSettings from './components/RewardTiersSettings';
import RewardsSettings from './components/RewardsSettings';
import EmailMarketingSettings from './components/EmailMarketingSettings';
import SupportSettings from './components/SupportSettings';
import QRCodesSettings from './components/QRCodesSettings';
import EventsSettings from './components/EventsSettings';
import POSIntegrationSettings from './components/POSIntegrationSettings';
import BrandedTokenSettings from './components/BrandedTokenSettings';
import SpecialRewardsSettings from './components/SpecialRewardsSettings';

type SettingsTab = 'account' | 'billing' | 'payout-wallet' | 'plans' | 'reward-tiers' | 'rewards' | 'special-rewards' | 'qr-codes' | 'events' | 'pos-integrations' | 'email-marketing' | 'branded-token' | 'support';

export default function MerchantSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab;
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  async function fetchMerchantData() {
    try {
      const res = await fetch('/api/merchant/settings');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/dashboard/login');
          return;
        }
        throw new Error('Failed to fetch merchant data');
      }
      const data = await res.json();
      setMerchantData(data);
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab: SettingsTab) {
    setActiveTab(tab);
    router.push(`/dashboard/settings?tab=${tab}`, { scroll: false });
  }

  function handleDataUpdate(updatedData: any) {
    setMerchantData({ ...merchantData, ...updatedData });
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your business account and preferences</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className={styles.backButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'billing' ? styles.active : ''}`}
              onClick={() => handleTabChange('billing')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'payout-wallet' ? styles.active : ''}`}
              onClick={() => handleTabChange('payout-wallet')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payout Wallet
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'plans' ? styles.active : ''}`}
              onClick={() => handleTabChange('plans')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Plans
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'reward-tiers' ? styles.active : ''}`}
              onClick={() => handleTabChange('reward-tiers')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Reward Tiers
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'rewards' ? styles.active : ''}`}
              onClick={() => handleTabChange('rewards')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Rewards Catalog
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'special-rewards' ? styles.active : ''}`}
              onClick={() => handleTabChange('special-rewards')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 003 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
              </svg>
              Special Rewards
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'qr-codes' ? styles.active : ''}`}
              onClick={() => handleTabChange('qr-codes')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Codes
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'events' ? styles.active : ''}`}
              onClick={() => handleTabChange('events')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Event QR Codes
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'pos-integrations' ? styles.active : ''}`}
              onClick={() => handleTabChange('pos-integrations')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              POS Integrations
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'email-marketing' ? styles.active : ''}`}
              onClick={() => handleTabChange('email-marketing')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Marketing
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'branded-token' ? styles.active : ''}`}
              onClick={() => handleTabChange('branded-token')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Branded Token
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'support' ? styles.active : ''}`}
              onClick={() => handleTabChange('support')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Support
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className={styles.content}>
          {activeTab === 'account' && (
            <AccountSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
              onRefresh={fetchMerchantData}
            />
          )}
          {activeTab === 'billing' && (
            <BillingSettings />
          )}
          {activeTab === 'payout-wallet' && (
            <PayoutWalletSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'plans' && (
            <PlansSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'reward-tiers' && (
            <RewardTiersSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'rewards' && (
            <RewardsSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'special-rewards' && (
            <SpecialRewardsSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'qr-codes' && (
            <QRCodesSettings
              merchantData={merchantData}
            />
          )}
          {activeTab === 'events' && (
            <EventsSettings
              merchantData={merchantData}
            />
          )}
          {activeTab === 'pos-integrations' && (
            <POSIntegrationSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'email-marketing' && (
            <EmailMarketingSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'branded-token' && (
            <BrandedTokenSettings
              merchantData={merchantData}
              onUpdate={handleDataUpdate}
            />
          )}
          {activeTab === 'support' && (
            <SupportSettings
              merchantData={merchantData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
