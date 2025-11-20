// src/app/dashboard/members/page.tsx
import { prisma } from "@/app/lib/prisma";
import MembersTable from "./MembersTable";

type MemberRow = {
  id: string;
  email: string | null;
  walletAddress: string | null;
  points: number;
  tier: string;
  createdAt: Date;
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const MERCHANT_SLUG = "demo-coffee-shop";

  const members: MemberRow[] = await prisma.member.findMany({
    where: {
      merchant: {
        slug: MERCHANT_SLUG,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      points: true,
      tier: true,
      createdAt: true,
    },
  });

  const totalMembers = members.length;
  const totalPoints = members.reduce(
    (sum, m) => sum + (m.points ?? 0),
    0
  );

  return (
    <div className="members-page">
      {/* Summary row */}
      <div className="members-summary-row">
        <div className="members-summary-card">
          <div className="members-summary-label">Total members</div>
          <div className="members-summary-value">{totalMembers}</div>
          <div className="members-summary-sub">
            Connected to this location
          </div>
        </div>

        <div className="members-summary-card">
          <div className="members-summary-label">Total points issued</div>
          <div className="members-summary-value">{totalPoints}</div>
          <div className="members-summary-sub">
            Sum of all member balances
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="members-table-card">
        <div className="members-table-header-row">
          <div>
            <h2 className="members-table-title">Members</h2>
            <p className="members-table-sub">
              These are real members from your demo QR and staff redemptions.
            </p>
          </div>
        </div>

        {/* Client-side table with search / filter / sort */}
        <MembersTable initialMembers={members} />
      </div>
    </div>
  );
}
