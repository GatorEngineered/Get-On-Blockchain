import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept BOTH `merchantSlug` and `merchant` from the client
    const merchantSlug =
      (body.merchantSlug as string | undefined) ||
      (body.merchant as string | undefined);

    const rawEmail = body.email as string | undefined;
    const email = rawEmail?.trim().toLowerCase();

    if (!merchantSlug || !email) {
      return NextResponse.json(
        { error: "Missing merchant or email" },
        { status: 400 },
      );
    }

    // 1) Look up merchant and grab welcomePoints
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      select: {
        id: true,
        welcomePoints: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    // 2) See if this member already exists for this merchant + email
    const existingMember = await prisma.member.findFirst({
      where: {
        merchantId: merchant.id,
        email,
      },
      select: {
        id: true,
        points: true,
      },
    });

    if (existingMember) {
      // Don't double-grant welcome points
      return NextResponse.json(
        {
          memberId: existingMember.id,
          isNew: false,
          points: existingMember.points ?? 0,
        },
        { status: 200 },
      );
    }

    // 3) Create a new member with welcome points
    const startingPoints = merchant.welcomePoints ?? 0;

    const created = await prisma.member.create({
      data: {
        merchantId: merchant.id,
        email,
        points: startingPoints,
      },
      select: {
        id: true,
        points: true,
      },
    });

    // 4) Log a welcome event so it shows in history
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId: created.id,
        type: "REWARD_EARNED", // use the same enum/string you use elsewhere
        source: "email",
        metadata: {
          reason: "welcome",
          amount: startingPoints,
        },
      },
    });

    return NextResponse.json(
      {
        memberId: created.id,
        isNew: true,
        points: created.points ?? startingPoints,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("create-email-member error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
