// src/app/api/dashboard-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // We only need merchants and events now
    const [merchants, events] = await Promise.all([
      prisma.merchant.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.event.findMany(),
    ]);

    type EventRow = (typeof events)[number];

    // 1) Build a map of unique memberIds per merchant using events
    const memberSetsByMerchant: Record<string, Set<string>> = {};

    events.forEach((e: EventRow) => {
      // If your Event model has nullable memberId, guard against it
      if (!e.merchantId || !e.memberId) return;

      if (!memberSetsByMerchant[e.merchantId]) {
        memberSetsByMerchant[e.merchantId] = new Set<string>();
      }

      memberSetsByMerchant[e.merchantId].add(e.memberId);
    });

    // 2) Convert the Set sizes into a simple { [merchantId]: count } object
    const membersByMerchant: Record<string, number> = {};
    Object.entries(memberSetsByMerchant).forEach(([merchantId, memberSet]) => {
      membersByMerchant[merchantId] = memberSet.size;
    });

    // 3) Build eventsByMerchant summary as before
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

    events.forEach((e: EventRow) => {
      if (!e.merchantId) return;

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
