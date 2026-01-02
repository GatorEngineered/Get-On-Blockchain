"use client";

import { useEffect, useState } from "react";

type PayoutTransaction = {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  amount: number;
  currency: string;
  pointsDeducted: number;
  status: string;
  txHash: string | null;
  walletAddress: string | null;
  errorMessage: string | null;
  createdAt: string;
  reason: string | null;
};

type PayoutHistoryData = {
  transactions: PayoutTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalPayouts: number;
    totalAmount: number;
    failedPayouts: number;
    pendingPayouts: number;
  };
};

export default function PayoutHistory() {
  const [data, setData] = useState<PayoutHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  async function loadHistory() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "10",
        offset: "0",
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/merchant/payout-history?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load payout history");
      }

      const data = await res.json();
      setData(data);
      setError(null);
    } catch (err: any) {
      console.error("Payout history error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "SUCCESS":
        return {
          bg: "#d1fae5",
          color: "#065f46",
          text: "Success",
        };
      case "FAILED":
        return {
          bg: "#fee2e2",
          color: "#991b1b",
          text: "Failed",
        };
      case "PENDING":
        return {
          bg: "#fef3c7",
          color: "#92400e",
          text: "Pending",
        };
      default:
        return {
          bg: "#f3f4f6",
          color: "#1f2937",
          text: status,
        };
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading payout history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#dc2626'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p>{error}</p>
        <button
          onClick={loadHistory}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.5rem',
            background: '#244b7a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header with Summary */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
              Payout History
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Track all USDC payouts to your members
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 2.5rem 0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#1f2937',
              cursor: 'pointer',
              background: 'white',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              appearance: 'none'
            }}
          >
            <option value="all">All Status</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{
            padding: '0.875rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Payouts
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#14532d' }}>
              {data.summary.totalPayouts}
            </p>
          </div>

          <div style={{
            padding: '0.875rem',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Amount
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a8a' }}>
              ${data.summary.totalAmount.toFixed(2)}
            </p>
          </div>

          <div style={{
            padding: '0.875rem',
            background: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fcd34d'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
              Pending
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#78350f' }}>
              {data.summary.pendingPayouts}
            </p>
          </div>

          <div style={{
            padding: '0.875rem',
            background: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
              Failed
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7f1d1d' }}>
              {data.summary.failedPayouts}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {data.transactions.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
          <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            No payout transactions yet
          </p>
          <p style={{ fontSize: '0.9rem' }}>
            {statusFilter === "all"
              ? "Payouts will appear here when members claim their rewards"
              : `No ${statusFilter.toLowerCase()} payouts found`}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Date
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Member
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Amount
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Points
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => {
                const statusBadge = getStatusBadge(tx.status);
                const date = new Date(tx.createdAt);

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>
                      <div style={{ fontWeight: '500' }}>
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>
                      <div style={{ fontWeight: '500' }}>{tx.memberName}</div>
                      {tx.memberEmail && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{tx.memberEmail}</div>
                      )}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937', fontWeight: '600' }}>
                      ${tx.amount.toFixed(2)} {tx.currency}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      -{tx.pointsDeducted}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: statusBadge.bg,
                        color: statusBadge.color
                      }}>
                        {statusBadge.text}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {tx.txHash ? (
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : tx.errorMessage ? (
                        <span style={{ color: '#dc2626', fontSize: '0.75rem' }} title={tx.errorMessage}>
                          Error
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data.pagination.total > data.pagination.limit && (
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {data.pagination.offset + 1}-{Math.min(data.pagination.offset + data.pagination.limit, data.pagination.total)} of {data.pagination.total}
          </p>
          {data.pagination.hasMore && (
            <button
              onClick={() => {
                // TODO: Implement load more
                console.log("Load more not yet implemented");
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#244b7a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
