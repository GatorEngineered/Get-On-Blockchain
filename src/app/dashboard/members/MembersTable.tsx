"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MemberRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string;
  email?: string;
  walletAddress?: string | null;
  points: number;
  tier: string;
  visits?: number;
  totalVisits?: number;
  createdAt?: string | Date;
  joinedAt?: string;
};

type MembersTableProps = {
  initialMembers: MemberRow[];
  onRefresh?: () => void;
};

type SortKey = "recent" | "points-high" | "points-low" | "visits-high";

export default function MembersTable({ initialMembers, onRefresh }: MembersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    let rows = [...initialMembers];

    // Filter
    if (term) {
      rows = rows.filter((m) => {
        const firstName = m.firstName?.toLowerCase() ?? "";
        const lastName = m.lastName?.toLowerCase() ?? "";
        const fullName = m.fullName?.toLowerCase() ?? "";
        const email = m.email?.toLowerCase() ?? "";
        const wallet = m.walletAddress?.toLowerCase() ?? "";
        const id = m.id.toLowerCase();
        return (
          firstName.includes(term) ||
          lastName.includes(term) ||
          fullName.includes(term) ||
          email.includes(term) ||
          wallet.includes(term) ||
          id.includes(term)
        );
      });
    }

    // Sort
    rows.sort((a, b) => {
      if (sortBy === "recent") {
        const aDate = a.createdAt || a.joinedAt;
        const bDate = b.createdAt || b.joinedAt;
        if (!aDate || !bDate) return 0;
        return (
          new Date(bDate).getTime() -
          new Date(aDate).getTime()
        );
      }
      if (sortBy === "points-high") {
        return (b.points ?? 0) - (a.points ?? 0);
      }
      if (sortBy === "points-low") {
        return (a.points ?? 0) - (b.points ?? 0);
      }
      if (sortBy === "visits-high") {
        const aVisits = a.visits ?? a.totalVisits ?? 0;
        const bVisits = b.visits ?? b.totalVisits ?? 0;
        return bVisits - aVisits;
      }
      return 0;
    });

    return rows;
  }, [initialMembers, search, sortBy]);

  return (
    <>
      {/* Controls row (matches your dashboard.css classes) */}
      <div className="members-controls">
        <div className="members-controls-left">
          <label className="members-filter-label">
            Sort by
            <select
              className="members-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="recent">Most recent</option>
              <option value="visits-high">Most visits</option>
              <option value="points-high">Points: high → low</option>
              <option value="points-low">Points: low → high</option>
            </select>
          </label>
        </div>

        <div className="members-controls-right">
          <input
            className="members-search"
            placeholder="Search by name, wallet, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table / empty state */}
      {visibleMembers.length === 0 ? (
        <div className="members-empty">
          <p>No members match your search yet.</p>
          <p className="members-empty-sub">
            Try adjusting your filters or remove the search term.
          </p>
        </div>
      ) : (
        <div className="members-table-wrapper">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Visits</th>
                <th>Points</th>
                <th>Tier</th>
                <th>Wallet</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {visibleMembers.map((m) => {
                const displayName = m.fullName || (m.firstName || "Anonymous") + (m.lastName ? " " + m.lastName.charAt(0) + "." : "");
                const dateValue = m.createdAt || m.joinedAt;
                const visitsCount = m.visits ?? m.totalVisits ?? 0;

                return (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/dashboard/members/${m.id}`)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td>
                      <div className="members-email">
                        {displayName}
                      </div>
                      <div className="members-id">ID: {m.id.slice(0, 8)}...</div>
                    </td>

                    <td className="members-tier-cell">
                      {visitsCount}
                    </td>

                    <td className="members-points-cell">
                      {m.points ?? 0}
                    </td>

                    <td className="members-tier-cell">
                      {m.tier || "BASE"}
                    </td>

                    <td className="members-wallet-cell">
                      {m.walletAddress ? (
                        shortenAddress(m.walletAddress)
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="members-date-cell">
                      {dateValue ? formatDate(dateValue) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function shortenAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
