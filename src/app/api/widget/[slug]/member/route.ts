// src/app/api/widget/[slug]/member/route.ts
// Widget API - Get member points for widget display

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * GET /api/widget/[slug]/member?email=xxx
 * Get member points for the widget
 * Public endpoint with CORS (email-based lookup)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email parameter required' }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: {
        id: true,
        plan: true,
      }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Check if merchant has widget access (Premium+)
    if (!hasExternalApiAccess(merchant.plan)) {
      return NextResponse.json({
        error: 'Widget requires Premium plan or higher'
      }, {
        status: 403,
        headers: corsHeaders()
      });
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        merchantMembers: {
          where: { merchantId: merchant.id },
          select: {
            points: true,
            tier: true,
            referralCode: true,
          }
        }
      }
    });

    if (!member || member.merchantMembers.length === 0) {
      return NextResponse.json({
        found: false,
        enrolled: false
      }, {
        headers: corsHeaders()
      });
    }

    const membership = member.merchantMembers[0];

    return NextResponse.json({
      found: true,
      enrolled: true,
      firstName: member.firstName || null,
      points: membership.points,
      tier: membership.tier,
      referralCode: membership.referralCode,
    }, {
      headers: corsHeaders()
    });

  } catch (error: any) {
    console.error('[Widget API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
