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

    // 3. Link Member to this specific Business (per-business relationship).
    let businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId: business.id,
        memberId: member.id,
      },
    });

    if (!businessMember) {
      businessMember = await prisma.businessMember.create({
        data: {
          businessId: business.id,
          memberId: member.id,
          // walletAddress / network / isCustodial stay null until they pick a wallet
        },
      });
    }

    return NextResponse.json({
      success: true,
      businessMemberId: businessMember.id,
      memberId: member.id,
      businessId: business.id,
    });
  } catch (error) {
    console.error("Error in register-for-business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
