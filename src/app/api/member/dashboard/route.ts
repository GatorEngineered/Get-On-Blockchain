// src/app/api/member/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isHappyHourActive } from '@/app/lib/happy-hour';

 

const prisma = new PrismaClient();

 

/**

 * GET /api/member/dashboard

 *

 * Get member dashboard data including businesses and transactions

 *

 * Headers:

 * - Authorization: Bearer <token>

 */

export async function GET(req: NextRequest) {

  try {

    // Get token from Authorization header

    const authHeader = req.headers.get('authorization');

    const token = authHeader?.replace('Bearer ', '');

 

    if (!token) {

      return NextResponse.json(

        { error: 'Please log in to continue.' },

        { status: 401 }

      );

    }

 

    // For now, we'll use a simple token lookup

    // In production, you'd validate JWT or use proper session management

    const loginToken = await prisma.memberLoginToken.findUnique({

      where: { token },

      include: { member: true },

    });

 

    if (!loginToken || loginToken.expiresAt < new Date()) {

      return NextResponse.json(

        { error: 'Session expired. Please log in again.' },

        { status: 401 }

      );

    }

 

    const member = loginToken.member;

 

    // Get all merchants this member belongs to (with aggregated points)
    const merchantMembers = await prisma.merchantMember.findMany({
      where: { memberId: member.id },
      include: {
        merchant: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            payoutEnabled: true,
            payoutMilestonePoints: true,
            payoutAmountUSD: true,
            // Happy Hour settings
            happyHourEnabled: true,
            happyHourMultiplier: true,
            happyHourStartTime: true,
            happyHourEndTime: true,
            happyHourDaysOfWeek: true,
            happyHourTimezone: true,
            earnPerVisit: true,
            // Social Links
            instagramUrl: true,
            facebookUrl: true,
            twitterUrl: true,
            tiktokUrl: true,
            businesses: {
              select: {
                id: true,
                slug: true,
                name: true,
                locationNickname: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get location-level visit tracking for analytics
    const businessMembers = await prisma.businessMember.findMany({
      where: { memberId: member.id },
      select: {
        businessId: true,
        visitCount: true,
        lastVisitAt: true,
        firstVisitAt: true,
      },
    });

    // Create a map for quick visit lookup
    const visitMap = new Map(
      businessMembers.map((bm) => [bm.businessId, bm])
    );

    // Get recent reward transactions
    const transactions = await prisma.rewardTransaction.findMany({
      where: { memberId: member.id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
        merchantMember: {
          select: {
            merchant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get branded token balances (for Growth/Pro merchants)
    const tokenBalances = await prisma.tokenBalance.findMany({
      where: {
        memberId: member.id,
        balance: { gt: 0 }, // Only show non-zero balances
      },
      include: {
        merchantToken: {
          select: {
            id: true,
            merchantId: true,
            tokenName: true,
            tokenSymbol: true,
            contractAddress: true,
            network: true,
            deployedAt: true,
            circulatingSupply: true,
            isActive: true,
            merchant: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        walletAddress: member.walletAddress,
        tier: member.tier,
        // Return merchant-level memberships with aggregated points
        merchants: merchantMembers.map((mm) => {
          // Check happy hour status for this merchant
          const happyHourStatus = isHappyHourActive({
            happyHourEnabled: mm.merchant.happyHourEnabled,
            happyHourMultiplier: mm.merchant.happyHourMultiplier,
            happyHourStartTime: mm.merchant.happyHourStartTime,
            happyHourEndTime: mm.merchant.happyHourEndTime,
            happyHourDaysOfWeek: mm.merchant.happyHourDaysOfWeek as number[] | null,
            happyHourTimezone: mm.merchant.happyHourTimezone,
          });

          return {
            id: mm.id,
            merchantId: mm.merchantId,
            merchant: {
              ...mm.merchant,
              happyHour: {
                isActive: happyHourStatus.isActive,
                multiplier: happyHourStatus.multiplier,
                startTime: happyHourStatus.startTime,
                endTime: happyHourStatus.endTime,
                earnPerVisitWithMultiplier: happyHourStatus.isActive
                  ? Math.floor(mm.merchant.earnPerVisit * happyHourStatus.multiplier)
                  : mm.merchant.earnPerVisit,
              },
            },
            walletAddress: mm.walletAddress,
            walletNetwork: mm.walletNetwork,
            isCustodial: mm.isCustodial,
            points: mm.points, // Aggregated across all locations
            tier: mm.tier,
            // Include location breakdown for analytics
            locations: mm.merchant.businesses.map((business) => {
              const visitData = visitMap.get(business.id);
              return {
                id: business.id,
                slug: business.slug,
                name: business.name,
                locationNickname: business.locationNickname,
                address: business.address,
                city: business.city,
                state: business.state,
                visitCount: visitData?.visitCount || 0,
                lastVisitAt: visitData?.lastVisitAt?.toISOString() || null,
                firstVisitAt: visitData?.firstVisitAt?.toISOString() || null,
              };
            }),
          };
        }),
      },
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        pointsDeducted: tx.pointsDeducted,
        usdcAmount: tx.usdcAmount,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt.toISOString(),
        business: tx.business,
        merchant: tx.merchantMember?.merchant,
      })),
      // Branded token balances (for Growth/Pro merchants)
      tokenBalances: tokenBalances
        .filter((tb) => tb.merchantToken.contractAddress) // Only deployed tokens
        .map((tb) => ({
          id: tb.id,
          balance: tb.balance,
          lastSyncedAt: tb.lastSyncedAt?.toISOString() || null,
          token: {
            id: tb.merchantToken.id,
            merchantId: tb.merchantToken.merchantId,
            name: tb.merchantToken.tokenName,
            symbol: tb.merchantToken.tokenSymbol,
            contractAddress: tb.merchantToken.contractAddress,
            network: tb.merchantToken.network,
            deployedAt: tb.merchantToken.deployedAt?.toISOString() || null,
            circulatingSupply: tb.merchantToken.circulatingSupply,
            isActive: tb.merchantToken.isActive,
            merchantName: tb.merchantToken.merchant.name,
            merchantSlug: tb.merchantToken.merchant.slug,
          },
        })),
    });

  } catch (error: any) {

    console.error('[Dashboard] Error loading member dashboard:', error);

    return NextResponse.json(

      { error: 'Something went wrong. Please try again or contact support.' },

      { status: 500 }

    );

  }

}