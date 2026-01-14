import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    // ⬇️ cookies() must be awaited in App Router
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
        return NextResponse.json(
            { error: "Please log in to continue." },
            { status: 401 }
        );
    }

    // Parse session data from JSON
    let sessionData;
    try {
        sessionData = JSON.parse(session.value);
    } catch (e) {
        return NextResponse.json(
            { error: "Session expired. Please log in again." },
            { status: 401 }
        );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
        return NextResponse.json(
            { error: "Session expired. Please log in again." },
            { status: 401 }
        );
    }

    let merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            loginEmail: true,
            // Payout settings
            payoutEnabled: true,
            payoutWalletAddress: true,
            payoutMilestonePoints: true,
            payoutAmountUSD: true,
            payoutNetwork: true,
            usdcBalance: true,
            lastBalanceCheck: true,
            lowBalanceThreshold: true,
            // Loyalty program settings
            welcomePoints: true,
            earnPerVisit: true,
            vipThreshold: true,
            primaryColor: true,
            accentColor: true,
            // Include ALL businesses for location selector
            businesses: {
                select: {
                    id: true,
                    name: true,
                    locationNickname: true,
                    address: true,
                    slug: true,
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!merchant) {
        return NextResponse.json(
            { error: "Session expired. Please log in again." },
            { status: 401 }
        );
    }

    // Auto-create business if it doesn't exist
    if (!merchant.businesses || merchant.businesses.length === 0) {
        await prisma.business.create({
            data: {
                slug: `${merchant.slug}-main`,
                name: merchant.name,
                locationNickname: 'Main Location',
                address: 'Not set',
                contactEmail: merchant.loginEmail,
                merchantId: merchant.id,
            },
        });

        // Refetch merchant with new business
        merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                loginEmail: true,
                payoutEnabled: true,
                payoutWalletAddress: true,
                payoutMilestonePoints: true,
                payoutAmountUSD: true,
                payoutNetwork: true,
                usdcBalance: true,
                lastBalanceCheck: true,
                lowBalanceThreshold: true,
                welcomePoints: true,
                earnPerVisit: true,
                vipThreshold: true,
                primaryColor: true,
                accentColor: true,
                businesses: {
                    select: {
                        id: true,
                        name: true,
                        locationNickname: true,
                        address: true,
                        slug: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }

    return NextResponse.json(merchant);
}
