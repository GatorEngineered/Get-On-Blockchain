// src/app/api/member/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

 

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

    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        walletAddress: member.walletAddress,
        tier: member.tier,
        // Return merchant-level memberships with aggregated points
        merchants: merchantMembers.map((mm) => ({
          id: mm.id,
          merchantId: mm.merchantId,
          merchant: mm.merchant,
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
        })),
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
    });

  } catch (error: any) {

    console.error('[Dashboard] Error loading member dashboard:', error);

    return NextResponse.json(

      { error: 'Something went wrong. Please try again or contact support.' },

      { status: 500 }

    );

  }

}