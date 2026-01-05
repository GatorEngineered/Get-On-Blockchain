// src/app/api/health/route.ts
// Simple health check to diagnose production Prisma issues

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
    prismaVersion: 'unknown',
    merchantCount: 0,
    memberCount: 0,
    merchantMemberFields: [] as string[],
    error: null as string | null,
  };

  try {
    // Test 1: Basic connection
    const merchantCount = await prisma.merchant.count();
    checks.merchantCount = merchantCount;
    checks.database = 'connected';

    // Test 2: Member count
    const memberCount = await prisma.member.count();
    checks.memberCount = memberCount;

    // Test 3: Check MerchantMember model - this is where the issue likely is
    const sampleMerchantMember = await prisma.merchantMember.findFirst({
      select: {
        id: true,
        merchantId: true,
        memberId: true,
        points: true,
        tier: true,
        createdAt: true,
      },
    });

    if (sampleMerchantMember) {
      checks.merchantMemberFields = Object.keys(sampleMerchantMember);
    } else {
      // Try to get schema info by creating a query
      checks.merchantMemberFields = ['No MerchantMember records found'];
    }

    return NextResponse.json({
      status: 'healthy',
      ...checks,
    });

  } catch (error: any) {
    checks.error = error.message;
    checks.database = 'error';

    return NextResponse.json({
      status: 'unhealthy',
      ...checks,
      errorName: error.name,
      errorCode: error.code,
      errorMeta: error.meta,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    }, { status: 500 });
  }
}
