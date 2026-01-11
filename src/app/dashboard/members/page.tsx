'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MembersTable from './MembersTable';

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

      const csvContent = [
        ['Name', 'Email', 'Phone', 'Points', 'Tier', 'Total Visits', 'Last Visit', 'Joined Date'].join(','),
        ...members.map(m => [
          `"${m.fullName || ''}"`,
          m.email || '',
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
          Members
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Manage your loyalty program members
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Members</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937' }}>{members.length}</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Connected to {businessName}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Active Members</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#059669' }}>{activeMembers}</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Have visited at least once
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Points Issued</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>{totalPoints.toLocaleString()}</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Sum of all member balances
          </p>
        </div>
      </div>

      {/* Members Table Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
              Member List
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              View and manage all {members.length} members
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        <MembersTable initialMembers={members} onRefresh={loadMembers} />
      </div>
    </div>
  );
}
