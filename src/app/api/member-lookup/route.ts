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

    // Basic validation
    if (!merchant) {
      return NextResponse.json(
        { error: "Missing merchant" },
        { status: 400 }
      );
    }

    if (!memberId && !email) {
      return NextResponse.json(
        { error: "Provide memberId or email" },
        { status: 400 }
      );
    }

    // Make sure the merchant exists (by slug)
    const merchantRecord = await prisma.merchant.findUnique({
      where: { slug: merchant },
    });

    if (!merchantRecord) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Member is global in your schema (email is unique),
    // so we look them up by id OR email.
    const whereClause: { id?: string; email?: string } = {};
    if (memberId) whereClause.id = memberId;
    if (email) whereClause.email = email;

    const member = await prisma.member.findFirst({
      where: whereClause,
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Only return fields that actually exist on Member
    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        walletAddress: member.walletAddress,
        phone: member.phone,
        address: member.address,
        createdAt: member.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Member lookup error:", error);

    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Server error",
      },
      { status: 500 }
    );
  }
}
