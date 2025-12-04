// src/app/api/connect-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type ConnectWalletBody = {
  merchantSlug?: string;
  memberId?: string;
  address?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { merchantSlug, memberId, address } =
      (await req.json()) as ConnectWalletBody;

    if (!merchantSlug || !memberId || !address) {
      return NextResponse.json(
        { error: "Missing merchantSlug, memberId, or address" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const normalizedAddress = String(address).toLowerCase().trim();

    // Update the existing global Member with the wallet address
    const member = await prisma.member.update({
      where: { id: memberId },
      data: {
        walletAddress: normalizedAddress,
      },
    });

    // Log a CONNECT_WALLET event for this merchant + member
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId: member.id,
        type: "CONNECT_WALLET",
        source: "wallet",
        metadata: {
          address: normalizedAddress,
        },
      },
    });

    return NextResponse.json(
      {
        memberId: member.id,
        walletAddress: member.walletAddress,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[connect-wallet] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
