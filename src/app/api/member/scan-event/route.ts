import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";
import { mintTokensOnCheckIn } from "@/app/lib/token/token-minting-service";

const QR_SECRET = process.env.QR_SECRET || "default-secret-change-in-production";

export async function POST(req: NextRequest) {
  try {
    const { qrCode } = await req.json();

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code is required" },
        { status: 400 }
      );
    }

    // Extract the encrypted code from the URL if qrCode is a full URL
    let encryptedCode = qrCode;
    if (qrCode.startsWith("http")) {
      try {
        const url = new URL(qrCode);
        encryptedCode = url.searchParams.get("code") || qrCode;
      } catch (e) {
        // If URL parsing fails, use qrCode as is
      }
    }

    // Decode QR code
    let codeData;
    try {
      const decodedString = Buffer.from(encryptedCode, "base64").toString("utf-8");
      codeData = JSON.parse(decodedString);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 }
      );
    }

    // Verify this is an event QR code
    if (codeData.type !== "event") {
      return NextResponse.json(
        { error: "This is not an event QR code. Please use the regular scan feature." },
        { status: 400 }
      );
    }

    // Verify signature
    const codeString = JSON.stringify(codeData);
    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(codeString)
      .digest("hex");

    // Look up event QR code in database
    const eventQRCode = await prisma.eventQRCode.findFirst({
      where: {
        merchantId: codeData.merchantId,
        signature: expectedSignature,
      },
      include: {
        merchant: true,
      },
    });

    if (!eventQRCode) {
      return NextResponse.json(
        { error: "Event QR code not found or invalid" },
        { status: 404 }
      );
    }

    // Verify signature matches
    if (eventQRCode.signature !== expectedSignature) {
      return NextResponse.json(
        { error: "Invalid QR code signature. This code may be fraudulent." },
        { status: 400 }
      );
    }

    // Check if event is active
    if (!eventQRCode.isActive) {
      return NextResponse.json(
        { error: "This event is no longer active." },
        { status: 400 }
      );
    }

    // Check scan window timing
    const now = new Date();
    const scanStart = new Date(eventQRCode.scanWindowStart);
    const scanEnd = new Date(eventQRCode.scanWindowEnd);

    if (now < scanStart) {
      return NextResponse.json(
        {
          error: `Scanning opens at ${scanStart.toLocaleString()}. Please try again later.`,
          scanWindowStart: eventQRCode.scanWindowStart,
          tooEarly: true,
        },
        { status: 400 }
      );
    }

    if (now > scanEnd) {
      return NextResponse.json(
        {
          error: "This event's scan window has ended.",
          scanWindowEnd: eventQRCode.scanWindowEnd,
          expired: true,
        },
        { status: 400 }
      );
    }

    // Get member session
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_member_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in to scan event QR codes." },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const memberId = sessionData.memberId;
    if (!memberId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Get member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Check if member already scanned this event (one scan per member per event)
    const existingEventScan = await prisma.eventScan.findUnique({
      where: {
        eventQRCodeId_memberId: {
          eventQRCodeId: eventQRCode.id,
          memberId,
        },
      },
    });

    if (existingEventScan) {
      return NextResponse.json(
        {
          error: "You've already scanned this event QR code!",
          alreadyScanned: true,
          scannedAt: existingEventScan.scannedAt,
        },
        { status: 400 }
      );
    }

    const merchant = eventQRCode.merchant;

    // Get or create MerchantMember (merchant-level points aggregation)
    let merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId: merchant.id,
          memberId,
        },
      },
    });

    const isNewMember = !merchantMember;

    if (!merchantMember) {
      // Create new merchant member with welcome points
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId: merchant.id,
          memberId,
          points: merchant.welcomePoints,
          tier: "BASE",
        },
      });

      // Log welcome points transaction - need to get a business ID for the transaction
      const business = await prisma.business.findFirst({
        where: { merchantId: merchant.id },
      });

      if (business) {
        await prisma.rewardTransaction.create({
          data: {
            merchantMemberId: merchantMember.id,
            businessId: business.id,
            memberId,
            type: "EARN",
            amount: merchant.welcomePoints,
            reason: "Welcome bonus",
            status: "SUCCESS",
          },
        });
      }
    }

    // Award event points
    const pointsToAward = eventQRCode.pointsAwarded;

    // Update merchant-level points
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: {
          increment: pointsToAward,
        },
      },
    });

    // Check tier upgrade
    let newTier = updatedMerchantMember.tier;
    if (
      updatedMerchantMember.points >= merchant.superThreshold &&
      updatedMerchantMember.tier !== "SUPER"
    ) {
      newTier = "SUPER";
    } else if (
      updatedMerchantMember.points >= merchant.vipThreshold &&
      updatedMerchantMember.tier === "BASE"
    ) {
      newTier = "VIP";
    }

    if (newTier !== updatedMerchantMember.tier) {
      await prisma.merchantMember.update({
        where: { id: merchantMember.id },
        data: { tier: newTier },
      });
    }

    // Create event scan record
    const eventScan = await prisma.eventScan.create({
      data: {
        eventQRCodeId: eventQRCode.id,
        memberId,
        pointsAwarded: pointsToAward,
        status: "pending",
      },
    });

    // Log reward transaction
    const business = await prisma.business.findFirst({
      where: { merchantId: merchant.id },
    });

    if (business) {
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: business.id,
          memberId,
          type: "EARN",
          amount: pointsToAward,
          reason: `Event scan: ${eventQRCode.name}`,
          status: "PENDING",
        },
      });
    }

    // Log event for analytics
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId,
        type: "EVENT_SCAN",
        metadata: {
          eventId: eventQRCode.id,
          eventName: eventQRCode.name,
          pointsAwarded: pointsToAward,
        },
      },
    });

    // Mint branded tokens if merchant has a deployed token (Growth/Pro plan)
    let tokensMinted = 0;
    let tokenTxHash: string | null = null;
    try {
      const mintResult = await mintTokensOnCheckIn({
        memberId,
        merchantId: merchant.id,
        pointsEarned: pointsToAward,
        scanId: eventScan.id,
      });
      if (mintResult.success && mintResult.amount) {
        tokensMinted = mintResult.amount;
        tokenTxHash = mintResult.txHash ?? null;

        // Update event scan with tx hash
        await prisma.eventScan.update({
          where: { id: eventScan.id },
          data: {
            txHash: tokenTxHash,
            status: "confirmed",
            confirmedAt: new Date(),
          },
        });
      }
    } catch (tokenError) {
      // Log but don't fail the scan - points are still awarded
      console.error("Token minting error (non-blocking):", tokenError);
    }

    return NextResponse.json({
      success: true,
      message: isNewMember
        ? `Welcome! You received ${merchant.welcomePoints} welcome points + ${pointsToAward} event points for "${eventQRCode.name}"!`
        : `Success! You earned ${pointsToAward} points for attending "${eventQRCode.name}"!`,
      eventScan: {
        id: eventScan.id,
        eventName: eventQRCode.name,
        pointsAwarded: pointsToAward,
        totalPoints: updatedMerchantMember.points,
        tier: newTier,
        tierUpgrade: newTier !== updatedMerchantMember.tier,
        tokensMinted,
        tokenTxHash,
      },
      merchant: {
        name: merchant.name,
      },
    });
  } catch (error: any) {
    console.error("Event scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process event scan" },
      { status: 500 }
    );
  }
}
