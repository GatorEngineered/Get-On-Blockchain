// src/app/api/dashboard-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const [merchants, members, events] = await Promise.all([
      prisma.merchant.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.member.findMany(),
      prisma.event.findMany(),
    ]);

    // Infer TS types directly from the returned arrays
    type MerchantRow = (typeof merchants)[number];
    type MemberRow = (typeof members)[number];
    type EventRow = (typeof events)[number];

    const membersByMerchant: Record<string, number> = {};

    // FIX #1 (explicit type MemberRow)
    members.forEach((m: MemberRow) => {
      membersByMerchant[m.merchantId] =
        (membersByMerchant[m.merchantId] ?? 0) + 1;
    });

    const eventsByMerchant: Record<
      string,
      {
        total: number;
        SCAN: number;
        CONNECT_WALLET: number;
        CREATE_EMAIL: number;
        REWARD_EARNED: number;
        REWARD_REDEEMED: number;
      }
    > = {};

    // FIX #2 (explicit type EventRow)
    events.forEach((e: EventRow) => {
      if (!eventsByMerchant[e.merchantId]) {
        eventsByMerchant[e.merchantId] = {
          total: 0,
          SCAN: 0,
          CONNECT_WALLET: 0,
          CREATE_EMAIL: 0,
          REWARD_EARNED: 0,
          REWARD_REDEEMED: 0,
        };
      }

      const entry = eventsByMerchant[e.merchantId];

      entry.total += 1;

      const key = e.type as keyof typeof entry;
      if (key !== "total") {
        entry[key] = (entry[key] ?? 0) + 1;
      }
    });

    return NextResponse.json({
      merchants,
      membersByMerchant,
      eventsByMerchant,
    });
  } catch (error) {
    console.error("Dashboard-summary error:", error);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 500 }
    );
  }
}
