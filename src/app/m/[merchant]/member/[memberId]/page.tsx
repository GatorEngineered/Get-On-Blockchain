// src/app/m/[merchant]/member/[memberId]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";

type MemberPageProps = {
  params: Promise<{ merchant: string; memberId: string }>;
};

export const dynamic = "force-dynamic";

// Helper: safely extract `points` from event.metadata
function getPointsFromMetadata(metadata: unknown): number | undefined {
  if (
    metadata &&
    typeof metadata === "object" &&
    "points" in metadata
  ) {
    const maybePoints = (metadata as { points?: unknown }).points;
    if (typeof maybePoints === "number") {
      return maybePoints;
    }
  }
  return undefined;
}

export default async function MemberPage(props: MemberPageProps) {
  // In Next.js 16, params is always a Promise
  const { merchant, memberId } = await props.params;

  // If anything is missing, bail early instead of letting Prisma explode
  if (!merchant || !memberId) {
    return notFound();
  }

  // 1) Find merchant by slug
  const merchantRecord = await prisma.merchant.findUnique({
    where: { slug: merchant },
  });

  if (!merchantRecord) {
    return (
      <main className="section">
        <div className="container">
          <h1>Merchant not found</h1>
          <p className="section-sub">
            The link you followed is not valid anymore.
          </p>
        </div>
      </main>
    );
  }

  // 2) Find member by ID (global member, no merchantId/points fields)
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    return (
      <main className="section">
        <div className="container">
          <h1>Member not found</h1>
          <p className="section-sub">
            We couldn&apos;t find a member for this link. Ask the staff to
            re-send or re-scan your QR.
          </p>
        </div>
      </main>
    );
  }

  // 3) Load recent events for this member for THIS merchant
  const events = await prisma.event.findMany({
    where: {
      memberId: member.id,
      merchantId: merchantRecord.id,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Compute total points from events (earn vs redeem)
  let totalPoints = 0;

  for (const ev of events) {
    const pts = getPointsFromMetadata(ev.metadata);
    if (typeof pts !== "number") continue;

    if (ev.type === "REWARD_REDEEMED") {
      totalPoints -= pts;
    } else {
      totalPoints += pts;
    }
  }

  const vipThreshold = merchantRecord.vipThreshold ?? 100;

  const currentCyclePoints =
    vipThreshold > 0 ? totalPoints % vipThreshold : totalPoints;

  const progress =
    vipThreshold === 0 ? 1 : currentCyclePoints / vipThreshold;

  const pointsToNext =
    vipThreshold === 0
      ? 0
      : vipThreshold - (currentCyclePoints || vipThreshold);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "720px" }}>
        <p className="eyebrow">{merchantRecord.name}</p>
        <h1>Your rewards</h1>
        <p className="section-sub">
          This page shows your current balance and recent activity. Staff can
          scan your QR to jump here quickly.
        </p>

        {/* Points summary */}
        <div className="claim-box" style={{ marginTop: "1.5rem" }}>
          <p className="claim-label">Points balance</p>
          <h2 style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>
            {totalPoints} pts
          </h2>
          {vipThreshold > 0 && (
            <p style={{ marginBottom: "0.6rem" }}>
              You&apos;re{" "}
              <strong>{pointsToNext} points</strong> away from your next perk at{" "}
              {vipThreshold} points.
            </p>
          )}

          <div
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "999px",
              background: "#e5e7eb",
              overflow: "hidden",
              marginTop: "0.4rem",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "#244b7a",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ marginTop: "2rem" }}>
          <p className="claim-label">Recent activity</p>
          {events.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              No activity yet. Scan at checkout to start earning rewards.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem" }}>
              {events.map((ev: any) => {
                const pts = getPointsFromMetadata(ev.metadata);
                const created = new Date(ev.createdAt).toLocaleString();

                let label = ev.type.replace(/_/g, " ").toLowerCase();
                label = label.charAt(0).toUpperCase() + label.slice(1);

                const sign =
                  ev.type === "REWARD_REDEEMED" ? "-" : pts ? "+" : "";

                return (
                  <li
                    key={ev.id}
                    style={{
                      padding: "0.6rem 0",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <span>
                        {label}
                        {typeof pts === "number" && (
                          <>
                            {" "}
                            ·{" "}
                            <strong>
                              {sign}
                              {pts} pts
                            </strong>
                          </>
                        )}
                      </span>
                      <span
                        style={{ color: "#9ca3af", fontSize: "0.8rem" }}
                      >
                        {created}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
