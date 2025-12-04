import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    // ⬇️ cookies() must be awaited in App Router
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const merchant = await prisma.merchant.findUnique({
        where: { id: session.value },
        select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
        },
    });

    if (!merchant) {
        return NextResponse.json(
            { error: "Merchant not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(merchant);
}
