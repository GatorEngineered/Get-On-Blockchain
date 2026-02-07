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
    <>
      <div className="location-selector">
        <div className="location-selector-row">
          <span className="viewing-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Viewing:
          </span>
          <select
            value={selectedBusinessId}
            onChange={(e) => onSelectBusiness(e.target.value)}
            className="location-select"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.locationNickname || business.name}
                {business.address && business.address !== 'Not set' ? ` - ${business.address}` : ''}
              </option>
            ))}
          </select>
          <span className="locations-badge">
            {businesses.length} locations
          </span>
        </div>
      </div>
      <style jsx>{`
        .location-selector {
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
        }
        .location-selector-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .viewing-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          white-space: nowrap;
        }
        .location-select {
          flex: 1;
          min-width: 150px;
          max-width: 300px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1f2937;
          cursor: pointer;
        }
        .locations-badge {
          font-size: 0.75rem;
          color: #9ca3af;
          padding: 0.25rem 0.5rem;
          background: #e5e7eb;
          border-radius: 9999px;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .location-selector-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
          .viewing-label {
            justify-content: center;
          }
          .location-select {
            max-width: 100%;
            width: 100%;
          }
          .locations-badge {
            align-self: center;
          }
        }
      `}</style>
    </>
  );
}
