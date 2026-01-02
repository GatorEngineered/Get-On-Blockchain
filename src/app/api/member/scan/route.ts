import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";
import { generateWallet } from "@/app/lib/blockchain/wallet";

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
    if (qrCode.startsWith('http')) {
      try {
        const url = new URL(qrCode);
        encryptedCode = url.searchParams.get('code') || qrCode;
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

    // Verify signature
    const codeString = JSON.stringify(codeData);
    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(codeString)
      .digest("hex");

    // Look up QR code in database - need to find by matching URL pattern
    const qrCodeRecord = await prisma.qRCode.findFirst({
      where: {
        businessId: codeData.businessId,
        isActive: true,
      },
      include: {
        business: {
          include: {
            merchant: true,
          },
        },
      },
    });

    if (!qrCodeRecord) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }

    // Verify signature matches
    if (qrCodeRecord.signature !== expectedSignature) {
      return NextResponse.json(
        { error: "Invalid QR code signature. This code may be fraudulent." },
        { status: 400 }
      );
    }

    // Check if QR code is still active
    if (!qrCodeRecord.isActive) {
      return NextResponse.json(
        { error: "This QR code is no longer valid. Please ask merchant for updated code." },
        { status: 400 }
      );
    }

    // Get member session
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_member_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in to scan QR codes." },
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

    // Auto-generate custodial wallet if member doesn't have one
    let memberWallet = await prisma.memberWallet.findUnique({
      where: { memberId },
    });

    if (!memberWallet) {
      try {
        const wallet = generateWallet();
        memberWallet = await prisma.memberWallet.create({
          data: {
            memberId,
            walletAddress: wallet.address,
            privateKeyEnc: wallet.encryptedPrivateKey,
            balance: 0,
            network: "polygon",
          },
        });
        console.log(`Generated wallet for member ${memberId}: ${wallet.address}`);
      } catch (error) {
        console.error("Wallet generation error:", error);
        // Don't block the scan if wallet generation fails
        // Member can still earn points, wallet can be generated later
      }
    }

    // CRITICAL: Check same-day scan restriction
    // Get start of today (calendar day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existingScanToday = await prisma.scan.findFirst({
      where: {
        memberId,
        businessId: codeData.businessId,
        scannedAt: {
          gte: startOfToday,
        },
      },
    });

    if (existingScanToday) {
      return NextResponse.json(
        {
          error: "You've already earned points today! Come back tomorrow.",
          alreadyScanned: true,
          nextScanAvailable: new Date(
            startOfToday.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        { status: 400 }
      );
    }

    const merchant = qrCodeRecord.business.merchant;
    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found for this business" },
        { status: 404 }
      );
    }

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
          walletAddress: memberWallet?.walletAddress,
          walletNetwork: memberWallet?.network,
          isCustodial: !!memberWallet,
        },
      });

      // Log welcome points transaction
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: codeData.businessId,
          memberId,
          type: "EARN",
          amount: merchant.welcomePoints,
          reason: "Welcome bonus",
          status: "SUCCESS",
        },
      });
    }

    // Get or create BusinessMember (location-level visit tracking)
    let businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId: codeData.businessId,
          memberId,
        },
      },
    });

    if (!businessMember) {
      // Create new business member for visit tracking
      businessMember = await prisma.businessMember.create({
        data: {
          businessId: codeData.businessId,
          memberId,
          visitCount: 0,
          firstVisitAt: new Date(),
        },
      });
    }

    // Award points for this scan
    const pointsToAward = merchant.earnPerVisit;

    // Update merchant-level points (aggregated across all locations)
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: {
          increment: pointsToAward,
        },
      },
    });

    // Update location-level visit tracking
    await prisma.businessMember.update({
      where: { id: businessMember.id },
      data: {
        visitCount: {
          increment: 1,
        },
        lastVisitAt: new Date(),
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

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        memberId,
        businessId: codeData.businessId,
        qrCodeId: qrCodeRecord.id,
        pointsAwarded: pointsToAward,
        status: "pending",
      },
    });

    // Create reward transaction (linked to MerchantMember)
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: codeData.businessId,
        memberId,
        type: "EARN",
        amount: pointsToAward,
        reason: "QR scan visit",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: isNewMember
        ? `Welcome! You received ${merchant.welcomePoints} welcome points + ${pointsToAward} visit points!`
        : `Success! You earned ${pointsToAward} points!`,
      scan: {
        id: scan.id,
        pointsAwarded: pointsToAward,
        totalPoints: updatedMerchantMember.points,
        tier: newTier,
        tierUpgrade: newTier !== updatedMerchantMember.tier,
      },
      business: {
        name: qrCodeRecord.business.name,
      },
    });
  } catch (error: any) {
    console.error("Scan QR code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process scan" },
      { status: 500 }
    );
  }
}
