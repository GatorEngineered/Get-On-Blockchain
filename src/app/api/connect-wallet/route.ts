// src/app/api/connect-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyMessage } from "viem";

type ConnectWalletBody = {
  merchantSlug?: string;
  memberId?: string;
  address?: string;
  signature?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { merchantSlug, memberId, address, signature, message } =
      (await req.json()) as ConnectWalletBody;

    if (!merchantSlug) {
      return NextResponse.json(
        { error: "Merchant slug is required" },
        { status: 400 }
      );
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const normalizedAddress = String(address).toLowerCase().trim();

    // If signature and message are provided, verify ownership
    if (signature && message) {
      try {
        const isValid = await verifyMessage({
          address: normalizedAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        });

        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid signature - wallet ownership verification failed" },
            { status: 401 }
          );
        }

        console.log(`[connect-wallet] Signature verified for ${normalizedAddress}`);
      } catch (verifyError) {
        console.error("[connect-wallet] Signature verification error:", verifyError);
        return NextResponse.json(
          { error: "Signature verification failed" },
          { status: 401 }
        );
      }
    } else {
      console.warn(
        "[connect-wallet] No signature provided - wallet ownership not verified! " +
        "This is a security risk."
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
          verified: !!(signature && message),
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
