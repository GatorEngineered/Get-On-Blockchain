'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MembersTable from './MembersTable';
import SendAnnouncementModal from './SendAnnouncementModal';
import styles from './members.module.css';

type Member = {
  id: string;
  businessMemberId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  points: number;
  tier: string;
  joinedAt: string;
  memberSince: string;
  lastVisit: string | null;
  totalVisits: number;
};

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/members');

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/dashboard/login');
          return;
        }
        throw new Error('Failed to load members');
      }

      const data = await res.json();
      setMembers(data.members);
      setBusinessName(data.business.name);
    } catch (err: any) {
      console.error('Load members error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    try {
      if (members.length === 0) {
        alert('No members to export');
        return;
      }

      // Note: Email is intentionally excluded to protect member privacy
      const csvContent = [
        ['Name', 'Phone', 'Points', 'Tier', 'Total Visits', 'Last Visit', 'Joined Date'].join(','),
        ...members.map(m => [
          `"${m.fullName || ''}"`,
          m.phone || '',
          m.points || 0,
          m.tier || '',
          m.totalVisits || 0,
          m.lastVisit ? new Date(m.lastVisit).toLocaleDateString() : 'Never',
          m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${businessName || 'members'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export members');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadMembers}
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
          Retry
        </button>
      </div>
    );
  }

  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  const activeMembers = members.filter(m => m.lastVisit).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => router.push('/dashboard')}
          className={styles.backButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h1>Members</h1>
            <p>Manage your loyalty program members</p>
          </div>
          <button
            onClick={() => setShowAnnouncementModal(true)}
            disabled={members.length === 0}
            className={styles.announcementButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Announcement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Members</p>
            <p className={styles.statDescription}>Connected to {businessName}</p>
          </div>
          <p className={styles.statValue}>{members.length}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Members</p>
            <p className={styles.statDescription}>Have visited at least once</p>
          </div>
          <p className={styles.statValueGreen}>{activeMembers}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Points Issued</p>
            <p className={styles.statDescription}>Sum of all member balances</p>
          </div>
          <p className={styles.statValueOrange}>{totalPoints.toLocaleString()}</p>
        </div>
      </div>

      {/* Members Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2>Member List</h2>
            <p>View and manage all {members.length} members</p>
          </div>
          <button
            onClick={handleExportCSV}
            className={styles.exportButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        <MembersTable initialMembers={members} onRefresh={loadMembers} />
      </div>

      {/* Send Announcement Modal */}
      <SendAnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSuccess={() => {
          // Optionally refresh or show success message
        }}
      />
    </div>
  );
}
