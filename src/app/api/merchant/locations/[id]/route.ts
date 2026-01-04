// src/app/api/merchant/locations/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const params = await context.params;
    const locationId = params.id;

    const { name, nickname, address } = await req.json();

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Location name and address are required' },
        { status: 400 }
      );
    }

    // Verify location belongs to this merchant
    const location = await prisma.business.findUnique({
      where: { id: locationId },
    });

    if (!location || location.merchantId !== merchantId) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Update location
    const updatedLocation = await prisma.business.update({
      where: { id: locationId },
      data: {
        locationNickname: nickname || name,
        address,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: updatedLocation.id,
        name: updatedLocation.name,
        locationNickname: updatedLocation.locationNickname,
        address: updatedLocation.address,
      },
    });
  } catch (error: any) {
    console.error('[Update Location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update location', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const params = await context.params;
    const locationId = params.id;

    // Verify location belongs to this merchant
    const location = await prisma.business.findUnique({
      where: { id: locationId },
    });

    if (!location || location.merchantId !== merchantId) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the main business location
    const businesses = await prisma.business.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'asc' },
    });

    if (businesses[0].id === locationId) {
      return NextResponse.json(
        { error: 'Cannot delete main business location' },
        { status: 400 }
      );
    }

    // Delete location
    await prisma.business.delete({
      where: { id: locationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Delete Location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete location', details: error.message },
      { status: 500 }
    );
  }
}
