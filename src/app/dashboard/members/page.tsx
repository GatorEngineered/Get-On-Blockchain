import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  const cookieStore = await cookies();
  const session = cookieStore.get("gob_merchant_session");
  const merchantId = session?.value;

  if (!merchantId) redirect("/login");

  // ✅ Step 1 — get the Business for this merchant
  const business = await prisma.business.findFirst({
    where: { contactEmail: /* OR however your Merchant links to Business */ undefined },
  });

  if (!business) {
    return redirect("/dashboard"); // fallback
  }

  // ✅ Step 2 — get BusinessMember rows for THIS BUSINESS only
  const businessMembers = await prisma.businessMember.findMany({
    where: { businessId: business.id },
    include: {
      member: true, // to access Member.email, Member.walletAddress, etc
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ Step 3 — map to your table shape
  const members: MemberRow[] = businessMembers.map((bm) => ({
    id: bm.member.id,
    email: bm.member.email,
    walletAddress: bm.walletAddress ?? bm.member.walletAddress,
    createdAt: bm.createdAt,
    points: bm.points,
    tier: bm.tier,
  }));

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + (m.points ?? 0), 0);
  
  return (
    <div className="members-page">
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

      <div className="members-table-card">
        <div className="members-table-header-row">
          <div>
            <h2 className="members-table-title">Members</h2>
            <p className="members-table-sub">
              These are members connected to your business.
            </p>
          </div>
        </div>

        <MembersTable initialMembers={members} />
      </div>
    </div>
  );
}
