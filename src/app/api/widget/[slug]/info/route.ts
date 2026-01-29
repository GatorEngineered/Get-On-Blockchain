// src/app/api/widget/[slug]/info/route.ts
// Widget API - Get merchant info for widget display

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * GET /api/widget/[slug]/info
 * Get basic merchant info for the widget
 * Public endpoint (no auth required) with CORS
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        tagline: true,
        plan: true,
        primaryColor: true,
        accentColor: true,
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

    return NextResponse.json({
      name: merchant.name,
      tagline: merchant.tagline,
      primaryColor: merchant.primaryColor || '#244b7a',
      accentColor: merchant.accentColor || '#8bbcff',
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
