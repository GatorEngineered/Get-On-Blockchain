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

        { error: 'No authorization token provided' },

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

        { error: 'Invalid or expired token' },

        { status: 401 }

      );

    }

 

    const member = loginToken.member;

 

    // Get all businesses this member belongs to

    const businessMembers = await prisma.businessMember.findMany({

      where: { memberId: member.id },

      include: {

        business: {

          select: {

            id: true,

            slug: true,

            name: true,

            contactEmail: true,

          },

        },

      },

      orderBy: { createdAt: 'desc' },

    });

 

    // Get recent reward transactions

    const transactions = await prisma.rewardTransaction.findMany({

      where: { memberId: member.id },

      include: {

        business: {

          select: {

            name: true,

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

        businesses: businessMembers.map((bm) => ({

          id: bm.id,

          businessId: bm.businessId,

          business: bm.business,

          walletAddress: bm.walletAddress,

          walletNetwork: bm.walletNetwork,

          points: bm.points,

          tier: bm.tier,

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

      })),

    });

  } catch (error: any) {

    console.error('[Dashboard] Error loading member dashboard:', error);

    return NextResponse.json(

      {

        error: 'Internal server error',

        details: error.message,

      },

      { status: 500 }

    );

  }

}