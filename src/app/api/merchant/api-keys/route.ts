// src/app/api/merchant/api-keys/route.ts
// API key management for merchants (PREMIUM+ plans)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { generateApiKey, API_PERMISSIONS } from '@/app/lib/api-keys';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * GET /api/merchant/api-keys
 * List all API keys for the authenticated merchant
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;

    // Get merchant with plan
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, plan: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check plan access
    if (!hasExternalApiAccess(merchant.plan)) {
      return NextResponse.json({
        error: 'API keys require Premium plan or higher',
        requiredPlan: 'PREMIUM'
      }, { status: 403 });
    }

    // Get all API keys (without the hash, of course)
    const apiKeys = await prisma.apiKey.findMany({
      where: { merchantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        lastUsedAt: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      apiKeys,
      availablePermissions: API_PERMISSIONS
    });
  } catch (error: any) {
    console.error('[API Keys] Error fetching keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/api-keys
 * Create a new API key
 *
 * Body: {
 *   name: string;
 *   permissions?: string[];
 *   expiresAt?: string; // ISO date
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;

    // Get merchant with plan
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, plan: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check plan access
    if (!hasExternalApiAccess(merchant.plan)) {
      return NextResponse.json({
        error: 'API keys require Premium plan or higher',
        requiredPlan: 'PREMIUM'
      }, { status: 403 });
    }

    const body = await req.json();
    const { name, permissions, expiresAt } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate permissions
    const validPermissions = Object.keys(API_PERMISSIONS);
    const selectedPermissions = permissions || ['read:members', 'write:points', 'read:rewards'];

    for (const perm of selectedPermissions) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json({
          error: `Invalid permission: ${perm}`,
          validPermissions
        }, { status: 400 });
      }
    }

    // Limit number of API keys per merchant
    const existingCount = await prisma.apiKey.count({
      where: { merchantId }
    });

    if (existingCount >= 10) {
      return NextResponse.json({
        error: 'Maximum 10 API keys allowed per merchant'
      }, { status: 400 });
    }

    // Generate the API key
    const { fullKey, keyPrefix, keyHash } = generateApiKey();

    // Create the API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        merchantId,
        name: name.trim(),
        keyPrefix,
        keyHash,
        permissions: selectedPermissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      }
    });

    // Return the full key ONCE - it won't be shown again
    return NextResponse.json({
      message: 'API key created successfully. Save this key - it will only be shown once!',
      apiKey: {
        ...apiKey,
        fullKey // Only returned on creation
      }
    });
  } catch (error: any) {
    console.error('[API Keys] Error creating key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchant/api-keys
 * Delete an API key
 *
 * Body: { keyId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;
    const body = await req.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    // Verify the key belongs to this merchant
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, merchantId }
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Delete the key and its usage logs
    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error: any) {
    console.error('[API Keys] Error deleting key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/merchant/api-keys
 * Update an API key (name, permissions, active status)
 *
 * Body: { keyId: string; name?: string; permissions?: string[]; isActive?: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;
    const body = await req.json();
    const { keyId, name, permissions, isActive } = body;

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    // Verify the key belongs to this merchant
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, merchantId }
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (permissions !== undefined) {
      const validPermissions = Object.keys(API_PERMISSIONS);
      for (const perm of permissions) {
        if (!validPermissions.includes(perm)) {
          return NextResponse.json({
            error: `Invalid permission: ${perm}`,
            validPermissions
          }, { status: 400 });
        }
      }
      updateData.permissions = permissions;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Update the key
    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      }
    });

    return NextResponse.json({ apiKey: updated });
  } catch (error: any) {
    console.error('[API Keys] Error updating key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}
