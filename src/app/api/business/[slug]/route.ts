import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            welcomePoints: true,
            earnPerVisit: true,
            vipThreshold: true,
            superThreshold: true,
            primaryColor: true,
            accentColor: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error("Get business error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get business" },
      { status: 500 }
    );
  }
}
