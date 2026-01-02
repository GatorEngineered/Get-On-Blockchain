import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Body =
    | {
        mode: "email";
        merchantMemberId: string;
    }
    | {
        mode: "wallet";
        merchantMemberId: string;
        walletAddress: string;
        walletNetwork: string; // "ethereum", "xrpl", etc.
    };

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!body.merchantMemberId || !body.mode) {
            return NextResponse.json(
                { error: "MerchantMemberId and mode are required" },
                { status: 400 }
            );
        }

        // Wallet settings are stored at merchant level via MerchantMember
        const existing = await prisma.merchantMember.findUnique({
            where: { id: body.merchantMemberId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "MerchantMember not found" },
                { status: 404 }
            );
        }

        if (body.mode === "email") {
            // Email-based / custodial mode: no external wallet required.
            const updated = await prisma.merchantMember.update({
                where: { id: body.merchantMemberId },
                data: {
                    isCustodial: true,
                    walletAddress: null,
                    walletNetwork: null,
                },
            });

            return NextResponse.json({
                success: true,
                mode: "email",
                merchantMemberId: updated.id,
            });
        }

        // Wallet mode: require address + network.
        if (!body.walletAddress || !body.walletNetwork) {
            return NextResponse.json(
                {
                    error:
                        "WalletAddress and walletNetwork are required when mode is 'wallet'",
                },
                { status: 400 }
            );
        }

        const updated = await prisma.merchantMember.update({
            where: { id: body.merchantMemberId },
            data: {
                isCustodial: false,
                walletAddress: body.walletAddress,
                walletNetwork: body.walletNetwork,
            },
        });

        return NextResponse.json({
            success: true,
            mode: "wallet",
            merchantMemberId: updated.id,
        });
    } catch (error) {
        console.error("Error in set-wallet-mode:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
