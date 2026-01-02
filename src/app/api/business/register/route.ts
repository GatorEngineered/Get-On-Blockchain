// src/app/api/business/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, validatePasswordStrength } from '@/app/lib/passwordUtils';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/business/register
 *
 * Register a new business (merchant) with optional locations and staff
 *
 * Body:
 * - businessName: string (required)
 * - ownerName: string (required)
 * - email: string (required) - becomes merchant login email
 * - phone: string (optional)
 * - address: string (required)
 * - password: string (required)
 * - plan: string (optional, defaults to STARTER for 7-day trial)
 * - locations: Array<{name: string, nickname?: string, address: string}> (optional)
 * - staff: Array<{name: string, email: string}> (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      password,
      plan,
      locations,
      staff,
    } = await req.json();

    // Validate required fields
    if (!businessName || !ownerName || !email || !address || !password) {
      return NextResponse.json(
        {
          error: 'Business name, owner name, email, address, and password are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if merchant already exists with this email
    const existingMerchant = await prisma.merchant.findUnique({
      where: { loginEmail: normalizedEmail },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'A business account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check for slug uniqueness and add number if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.merchant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log(`[Business Registration] Creating merchant: ${businessName} (${slug})`);

    // Create merchant with first business location
    const merchant = await prisma.merchant.create({
      data: {
        slug,
        name: businessName,
        loginEmail: normalizedEmail,
        passwordHash,
        plan: (plan as any) || 'STARTER', // Default to STARTER (7-day trial)
        welcomePoints: 10,
        earnPerVisit: 10,
        vipThreshold: 100,
        // Create the primary business location
        businesses: {
          create: {
            slug: `${slug}-main`,
            name: businessName,
            locationNickname: 'Main Location',
            address,
            contactEmail: normalizedEmail,
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    console.log(`[Business Registration] Merchant created: ${merchant.id}`);

    // Create additional locations if provided
    if (locations && Array.isArray(locations) && locations.length > 0) {
      for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        if (loc.name && loc.address) {
          const locationSlug = `${slug}-${loc.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}-${i + 1}`;

          await prisma.business.create({
            data: {
              slug: locationSlug,
              name: businessName,
              locationNickname: loc.nickname || loc.name,
              address: loc.address,
              contactEmail: normalizedEmail,
              merchantId: merchant.id,
            },
          });

          console.log(`[Business Registration] Additional location created: ${locationSlug}`);
        }
      }
    }

    // Create staff members if provided
    if (staff && Array.isArray(staff) && staff.length > 0) {
      for (const staffMember of staff) {
        if (staffMember.name && staffMember.email) {
          const staffEmail = staffMember.email.toLowerCase().trim();

          // Check if staff email matches owner email
          const canManageSettings = staffEmail === normalizedEmail;

          // Generate a temporary password for staff
          const tempPassword = crypto.randomBytes(16).toString('hex');
          const staffPasswordHash = await hashPassword(tempPassword);

          try {
            await prisma.staff.create({
              data: {
                email: staffEmail,
                fullName: staffMember.name,
                passwordHash: staffPasswordHash,
                merchantId: merchant.id,
                canManageMembers: true,
                canViewReports: true,
                canManageSettings, // Only owner can manage settings
                isActive: true,
              },
            });

            console.log(
              `[Business Registration] Staff member created: ${staffMember.name} (${staffEmail})`
            );

            // TODO: Send email to staff member with temporary password
            // This would integrate with the email service
          } catch (err: any) {
            // If staff email already exists, skip (don't fail entire registration)
            console.log(
              `[Business Registration] Skipping staff ${staffEmail}: already exists`
            );
          }
        }
      }
    }

    // Log registration event
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        type: 'CREATE_EMAIL',
        source: 'business-registration',
        metadata: {
          businessName,
          ownerName,
          plan: plan || 'STARTER',
          locationCount: (locations?.length || 0) + 1, // +1 for main location
          staffCount: staff?.length || 0,
        },
      },
    });

    console.log(`[Business Registration] Registration complete for ${merchant.slug}`);

    return NextResponse.json({
      success: true,
      message: 'Business registered successfully! You can now log in to your dashboard.',
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        email: merchant.loginEmail,
        plan: merchant.plan,
      },
    });
  } catch (error: any) {
    console.error('[Business Registration] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
