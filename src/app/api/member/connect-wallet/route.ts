// src/app/api/member/connect-wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

 

const prisma = new PrismaClient();

 

/**

 * POST /api/member/connect-wallet

 *

 * Connect a wallet address to the member account

 *

 * Headers:

 * - Authorization: Bearer <token>

 *

 * Body:

 * - walletAddress: string

 */

export async function POST(req: NextRequest) {

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

 

    const { walletAddress } = await req.json();

 

    if (!walletAddress) {

      return NextResponse.json(

        { error: 'Wallet address is required' },

        { status: 400 }

      );

    }

 

    // Validate token

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

 

    // Check if wallet is already connected to another member

    const existingMember = await prisma.member.findFirst({

      where: {

        walletAddress: walletAddress.toLowerCase(),

        id: { not: loginToken.memberId },

      },

    });

 

    if (existingMember) {

      return NextResponse.json(

        { error: 'This wallet is already connected to another account' },

        { status: 400 }

      );

    }

 

    // Update member with wallet address

    const updatedMember = await prisma.member.update({

      where: { id: loginToken.memberId },

      data: {

        walletAddress: walletAddress.toLowerCase(),
      },

    });

 

    console.log(

      `[Connect Wallet] Member ${updatedMember.id} connected wallet ${walletAddress}`

    );

 

    return NextResponse.json({

      success: true,

      message: 'Wallet connected successfully',

      walletAddress: updatedMember.walletAddress,

    });

  } catch (error: any) {

    console.error('[Connect Wallet] Error:', error);

    return NextResponse.json(

      {

        error: 'Internal server error',

        details: error.message,

      },

      { status: 500 }

    );

  }

}