'use client';

import React from 'react';

type Business = {
  id: string;
  name: string;
  locationNickname: string | null;
  address: string;
  slug: string;
};

interface LocationSelectorProps {
  businesses: Business[];
  selectedBusinessId: string;
  onSelectBusiness: (businessId: string) => void;
}

export default function LocationSelector({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: LocationSelectorProps) {
  // Don't render if only one location
  if (businesses.length <= 1) {
    return null;
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || businesses[0];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
        Viewing:
      </span>
      <select
        value={selectedBusinessId}
        onChange={(e) => onSelectBusiness(e.target.value)}
        style={{
          flex: 1,
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: 'white',
          fontSize: '0.95rem',
          fontWeight: '500',
          color: '#1f2937',
          cursor: 'pointer',
          maxWidth: '300px',
        }}
      >
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.locationNickname || business.name}
            {business.address && business.address !== 'Not set' ? ` - ${business.address}` : ''}
          </option>
        ))}
      </select>
      <span style={{
        fontSize: '0.75rem',
        color: '#9ca3af',
        padding: '0.25rem 0.5rem',
        background: '#e5e7eb',
        borderRadius: '9999px',
      }}>
        {businesses.length} locations
      </span>
    </div>
  );
}
