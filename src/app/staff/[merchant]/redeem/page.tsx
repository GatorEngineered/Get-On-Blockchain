"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

type MemberSummary = {
  id: string;
  email: string | null;
  walletAddress: string | null;
  points: number;
  tier: string;
  createdAt: string;
};

type LookupBody = {
  merchant: string;
  memberId?: string;
  email?: string;
};

export default function StaffRedeemPage() {
  // ✅ Get route params in a client component the Next 16 way
  const params = useParams<{ merchant: string }>();
  const merchantSlug = params.merchant;

  const [searchMode, setSearchMode] = useState<"memberId" | "email">("memberId");
  const [searchValue, setSearchValue] = useState("");
  const [member, setMember] = useState<MemberSummary | null>(null);

  const [redeemPoints, setRedeemPoints] = useState("10");
  const [status, setStatus] = useState<string | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingRedeem, setLoadingRedeem] = useState(false);

  const prettyMerchant = merchantSlug
    ? merchantSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Merchant";

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue || !merchantSlug) return;

    setLoadingLookup(true);
    setStatus(null);
    setMember(null);

    try {
      const body: LookupBody = { merchant: merchantSlug };
      if (searchMode === "memberId") body.memberId = searchValue.trim();
      if (searchMode === "email") body.email = searchValue.trim();

      const res = await fetch("/api/member-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Member not found.");
        return;
      }

      setMember(data.member);
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus("Error looking up member. Try again.");
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleRedeem = async () => {
    if (!member || !merchantSlug) return;
    const pts = Number(redeemPoints);
    if (!pts || pts <= 0) return;

    setLoadingRedeem(true);
    setStatus(null);

    try {
      const res = await fetch("/api/reward-redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: merchantSlug,
          memberId: member.id,
          points: pts,
          reason: "Staff redemption",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Could not redeem reward.");
        return;
      }

      setMember((prev) =>
        prev ? { ...prev, points: data.member.points } : prev
      );
      setStatus(
        `Redeemed ${pts} points. New balance: ${data.member.points} points.`
      );
    } catch (err) {
      console.error(err);
      setStatus("Error redeeming points. Try again.");
    } finally {
      setLoadingRedeem(false);
    }
  };

  const applyPresetPoints = (pts: number) => {
    setRedeemPoints(String(pts));
  };

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "720px" }}>
        <p className="eyebrow">Staff tool · {prettyMerchant}</p>
        <h1>Redeem a reward</h1>
        <p className="section-sub">
          Look up a customer, confirm their points, and redeem a reward. This is
          meant to sit on a tablet or POS screen at the counter.
        </p>

        {/* Lookup form */}
        <form onSubmit={handleLookup} className="staff-form">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <label className="staff-radio">
              <input
                type="radio"
                name="searchMode"
                value="memberId"
                checked={searchMode === "memberId"}
                onChange={() => setSearchMode("memberId")}
              />
              <span>Member ID</span>
            </label>
            <label className="staff-radio">
              <input
                type="radio"
                name="searchMode"
                value="email"
                checked={searchMode === "email"}
                onChange={() => setSearchMode("email")}
              />
              <span>Email</span>
            </label>
          </div>

          <label className="staff-label">
            {searchMode === "memberId" ? "Member ID" : "Email"}
            <input
              className="staff-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                searchMode === "memberId"
                  ? "Paste member ID or scan QR"
                  : "customer@email.com"
              }
              required
            />
          </label>

          <button className="btn btn-primary" disabled={loadingLookup}>
            {loadingLookup ? "Looking up..." : "Find member"}
          </button>
        </form>

        {/* Member summary */}
        {member && (
          <div className="claim-box" style={{ marginTop: "2rem" }}>
            <p className="claim-label">Member found</p>
            <h2 style={{ marginBottom: "0.4rem" }}>
              {member.email || "Wallet member"}
            </h2>
            <p style={{ marginBottom: "0.5rem" }}>
              Points balance:{" "}
              <strong style={{ fontSize: "1.1rem" }}>
                {member.points} pts
              </strong>
              {member.tier && (
                <>
                  {" "}
                  · Tier: <strong>{member.tier}</strong>
                </>
              )}
            </p>
            {member.walletAddress && (
              <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                Wallet: {member.walletAddress}
              </p>
            )}
          </div>
        )}

        {/* Redeem controls */}
        {member && (
          <div style={{ marginTop: "1.5rem" }}>
            <p className="claim-label">Redeem points</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              {[10, 25, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => applyPresetPoints(v)}
                  disabled={loadingRedeem}
                >
                  {v} pts
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="staff-input"
                type="number"
                min={1}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                style={{ maxWidth: "140px" }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={loadingRedeem}
                onClick={handleRedeem}
              >
                {loadingRedeem ? "Redeeming..." : "Confirm redemption"}
              </button>
            </div>
          </div>
        )}

        {status && <p className="wallet-status">{status}</p>}
      </div>
    </main>
  );
}
