import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // adjust if your prisma helper is in a different path

type Body =
    | {
        mode: "email";
        businessMemberId: string;
    }
    | {
        mode: "wallet";
        businessMemberId: string;
        walletAddress: string;
        walletNetwork: string; // "ethereum", "xrpl", etc.
    };

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!body.businessMemberId || !body.mode) {
            return NextResponse.json(
                { error: "businessMemberId and mode are required" },
                { status: 400 }
            );
        }

        const existing = await prisma.businessMember.findUnique({
            where: { id: body.businessMemberId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "BusinessMember not found" },
                { status: 404 }
            );
        }

        if (body.mode === "email") {
            // Email-based / custodial mode: no external wallet required.
            const updated = await prisma.businessMember.update({
                where: { id: body.businessMemberId },
                data: {
                    isCustodial: true,
                    walletAddress: null,
                    walletNetwork: null,
                },
            });

            return NextResponse.json({
                success: true,
                mode: "email",
                businessMemberId: updated.id,
            });
        }

        // Wallet mode: require address + network.
        if (!body.walletAddress || !body.walletNetwork) {
            return NextResponse.json(
                {
                    error:
                        "walletAddress and walletNetwork are required when mode is 'wallet'",
                },
                { status: 400 }
            );
        }

        const updated = await prisma.businessMember.update({
            where: { id: body.businessMemberId },
            data: {
                isCustodial: false,
                walletAddress: body.walletAddress,
                walletNetwork: body.walletNetwork,
            },
        });

        return NextResponse.json({
            success: true,
            mode: "wallet",
            businessMemberId: updated.id,
        });
    } catch (error) {
        console.error("Error in set-wallet-mode:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
