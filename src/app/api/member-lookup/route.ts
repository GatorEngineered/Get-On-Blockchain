// src/app/api/member-lookup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RequestBody = {
  merchant: string;   // merchant slug, e.g. "demo-coffee-shop"
  memberId?: string;
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const { merchant, memberId, email } = body;

    if (!merchant) {
      return NextResponse.json({ error: "Missing merchant" }, { status: 400 });
    }
    if (!memberId && !email) {
      return NextResponse.json(
        { error: "Provide memberId or email" },
        { status: 400 }
      );
    }

    const merchantRecord = await prisma.merchant.findUnique({
      where: { slug: merchant },
    });

    if (!merchantRecord) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const whereClause: { id?: string; email?: string; merchantId: string } = {
      merchantId: merchantRecord.id,
    };
    if (memberId) whereClause.id = memberId;
    if (email) whereClause.email = email;

    const member = await prisma.member.findFirst({ where: whereClause });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        walletAddress: member.walletAddress,
        points: member.points,
        tier: member.tier,
        createdAt: member.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Member lookup error:", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? error?.message || "Server error"
            : "Server error",
      },
      { status: 500 }
    );
  }
}
