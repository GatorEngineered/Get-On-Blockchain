import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // MerchantMember.id

    const body = await request.json();
    const { pointsDelta, reason, businessId, memberId } = body as {
      pointsDelta: number;
      reason?: string;
      businessId?: string;
      memberId?: string;
    };

    if (typeof pointsDelta !== "number") {
      return NextResponse.json(
        { error: "pointsDelta must be a number" },
        { status: 400 }
      );
    }

    const updated = await prisma.merchantMember.update({
      where: { id },
      data: {
        points: { increment: pointsDelta },
      },
    });

    // Optional but strongly recommended: log adjustment
    if (businessId && memberId) {
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: id,
          businessId,
          memberId,
          type: "ADJUST",
          amount: pointsDelta,
          reason: reason ?? "Manual adjustment",
          status: "SUCCESS",
        },
      });
    }

    return NextResponse.json({ success: true, merchantMember: updated });
  } catch (error: any) {
    console.error("Adjust points error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to adjust points" },
      { status: 500 }
    );
  }
}
