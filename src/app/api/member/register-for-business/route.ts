import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // or "../../lib/prisma" depending on your setup

type RegisterBody = {
  merchantSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  phone?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const { merchantSlug, firstName, lastName, email, address, phone } = body;

    if (!merchantSlug || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Find or create the Business by slug.
    let business = await prisma.business.findUnique({
      where: { slug: merchantSlug },
    });

    if (!business) {
      business = await prisma.business.create({
        data: {
          slug: merchantSlug,
          name: merchantSlug,
          contactEmail: "placeholder@getonblockchain.com",
          address: "N/A", // Placeholder address - business should exist before member registration
          merchant: {
            connect: { slug: merchantSlug },
          },
        },
      });
    }

    // 2. Find or create the Member by email (global person).
    let member = await prisma.member.findFirst({
      where: { email },
    });

    if (!member) {
      member = await prisma.member.create({
        data: {
          firstName,
          lastName,
          email,
          address: address || null,
          phone: phone || null,
        },
      });
    } else {
      // Optional: keep their info fresh if they changed phone/address/name.
      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          firstName,
          lastName,
          address: address ?? member.address,
          phone: phone ?? member.phone,
        },
      });
    }

    // 3. Get merchant from business
    const businessWithMerchant = await prisma.business.findUnique({
      where: { id: business.id },
      include: { merchant: true },
    });

    if (!businessWithMerchant?.merchant) {
      return NextResponse.json(
        { error: "Merchant not found for this business" },
        { status: 404 }
      );
    }

    const merchantId = businessWithMerchant.merchant.id;

    // 4. Create MerchantMember for merchant-level points aggregation
    let merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId: member.id,
        },
      },
    });

    if (!merchantMember) {
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId,
          memberId: member.id,
          points: 0,
          tier: "BASE",
          // walletAddress / network / isCustodial stay null until they pick a wallet
        },
      });
    }

    // 5. Create BusinessMember for visit tracking (per-location analytics)
    let businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId: business.id,
          memberId: member.id,
        },
      },
    });

    if (!businessMember) {
      businessMember = await prisma.businessMember.create({
        data: {
          businessId: business.id,
          memberId: member.id,
          visitCount: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      merchantMemberId: merchantMember.id,
      businessMemberId: businessMember.id,
      memberId: member.id,
      businessId: business.id,
      merchantId,
    });
  } catch (error) {
    console.error("Error in register-for-business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
