'use client';

import { useEffect, useState } from 'react';
import CustomerDashboard from '../components/CustomerDashboard';

type CustomerData = {
  customer: {
    name: string;
    email?: string;
    pointsBalance: number;
    tierLevel: string;
  };
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    points: number;
    location: string;
    type: 'EARNED' | 'REDEEMED';
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    points: number;
    description: string;
  }>;
  qrCode?: string;
};

export default function CustomerDemoPage() {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        // TODO: Replace with actual business slug and member identifier
        // This could come from URL params, cookies, or session
        const businessSlug = "spokesman-coffee"; // Example
        const memberEmail = "customer@example.com"; // Example - get from auth

        const res = await fetch('/api/customer/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSlug,
            email: memberEmail,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch customer data');
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load customer data:', err);
        // Fallback to demo data if API fails (for testing)
        const demoData: CustomerData = {
          customer: {
            name: "Demo Customer",
            email: "demo@example.com",
            pointsBalance: 0,
            tierLevel: "Bronze"
          },
          transactions: [],
          availableRewards: [
            {
              id: '1',
              name: 'Free Coffee',
              points: 100,
              description: 'Any size, any blend'
            },
            {
              id: '2',
              name: 'Free Pastry',
              points: 150,
              description: 'Choose from daily selection'
            },
            {
              id: '3',
              name: '10% Off Purchase',
              points: 200,
              description: 'Valid on any purchase'
            },
            {
              id: '4',
              name: 'Free Bag of Beans',
              points: 500,
              description: '12oz of house blend'
            }
          ]
        };
        setData(demoData);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f9fbff 0%, #ffffff 100%)'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading your rewards...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f9fbff 0%, #ffffff 100%)'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#ef4444' }}>Failed to load customer data</p>
      </div>
    );
  }

  return (
    <main style={{
      background: 'linear-gradient(180deg, #f9fbff 0%, #ffffff 100%)',
      minHeight: '100vh',
      padding: 0
    }}>
      <CustomerDashboard
        customer={data.customer}
        transactions={data.transactions}
        availableRewards={data.availableRewards}
        qrCode={data.qrCode}
      />
    </main>
  );
}