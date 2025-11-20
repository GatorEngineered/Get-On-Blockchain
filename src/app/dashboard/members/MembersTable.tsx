"use client";

import { useMemo, useState } from "react";

type MemberRow = {
  id: string;
  email: string | null;
  walletAddress: string | null;
  points: number;
  tier: string;
  createdAt: string | Date;
};

type MembersTableProps = {
  initialMembers: MemberRow[];
};

type SortKey = "recent" | "points-high" | "points-low";

export default function MembersTable({ initialMembers }: MembersTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    let rows = [...initialMembers];

    // Filter
    if (term) {
      rows = rows.filter((m) => {
        const email = m.email?.toLowerCase() ?? "";
        const wallet = m.walletAddress?.toLowerCase() ?? "";
        const id = m.id.toLowerCase();
        return (
          email.includes(term) ||
          wallet.includes(term) ||
          id.includes(term)
        );
      });
    }

    // Sort
    rows.sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "points-high") {
        return (b.points ?? 0) - (a.points ?? 0);
      }
      if (sortBy === "points-low") {
        return (a.points ?? 0) - (b.points ?? 0);
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
              <option value="points-high">Points: high → low</option>
              <option value="points-low">Points: low → high</option>
            </select>
          </label>
        </div>

        <div className="members-controls-right">
          <input
            className="members-search"
            placeholder="Search by email, wallet, or ID…"
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
                <th>Wallet</th>
                <th>Tier</th>
                <th>Points</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {visibleMembers.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="members-email">
                      {m.email ?? "Unknown email"}
                    </div>
                    <div className="members-id">ID: {m.id}</div>
                  </td>

                  <td className="members-wallet-cell">
                    {m.walletAddress ? (
                      shortenAddress(m.walletAddress)
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="members-tier-cell">
                    {m.tier || "BASE"}
                  </td>

                  <td className="members-points-cell">
                    {m.points ?? 0}
                  </td>

                  <td className="members-date-cell">
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              ))}
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
