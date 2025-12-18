// src/app/api/member/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

import { cookies } from 'next/headers';

 

const prisma = new PrismaClient();

 

/**

 * GET /api/member/auth/verify?token=xxx

 *

 * Verify magic link token and create member session

 */

export async function GET(req: NextRequest) {

  try {

    const { searchParams } = new URL(req.url);

    const token = searchParams.get('token');

 

    if (!token) {

      return NextResponse.json(

        { error: 'Token is required' },

        { status: 400 }

      );

    }

 

    // Find token in database

    const loginToken = await prisma.memberLoginToken.findUnique({

      where: { token },

      include: { member: true },

    });

 

    if (!loginToken) {

      return new NextResponse(

        `

        <!DOCTYPE html>

        <html>

          <head>

            <title>Invalid Link</title>

            <style>

              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

              .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }

              h1 { color: #dc2626; margin: 0 0 20px 0; }

              p { color: #6b7280; line-height: 1.6; }

              a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #244b7a; color: white; text-decoration: none; border-radius: 8px; }

            </style>

          </head>

          <body>

            <div class="card">

              <h1>❌ Invalid Link</h1>

              <p>This magic link is invalid or has already been used.</p>

              <a href="/">Return Home</a>

            </div>

          </body>

        </html>

        `,

        { status: 400, headers: { 'Content-Type': 'text/html' } }

      );

    }

 

    // Check if token is expired

    if (loginToken.expiresAt < new Date()) {

      return new NextResponse(

        `

        <!DOCTYPE html>

        <html>

          <head>

            <title>Link Expired</title>

            <style>

              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

              .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }

              h1 { color: #f59e0b; margin: 0 0 20px 0; }

              p { color: #6b7280; line-height: 1.6; }

              a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #244b7a; color: white; text-decoration: none; border-radius: 8px; }

            </style>

          </head>

          <body>

            <div class="card">

              <h1>⏰ Link Expired</h1>

              <p>This magic link has expired. Magic links are only valid for 15 minutes.</p>

              <p>Please request a new login link.</p>

              <a href="/">Return Home</a>

            </div>

          </body>

        </html>

        `,

        { status: 400, headers: { 'Content-Type': 'text/html' } }

      );

    }

 

    // Check if already used

    if (loginToken.usedAt) {

      return new NextResponse(

        `

        <!DOCTYPE html>

        <html>

          <head>

            <title>Link Already Used</title>

            <style>

              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

              .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }

              h1 { color: #f59e0b; margin: 0 0 20px 0; }

              p { color: #6b7280; line-height: 1.6; }

              a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #244b7a; color: white; text-decoration: none; border-radius: 8px; }

            </style>

          </head>

          <body>

            <div class="card">

              <h1>🔒 Link Already Used</h1>

              <p>This magic link has already been used. For security, each link can only be used once.</p>

              <p>Please request a new login link if needed.</p>

              <a href="/">Return Home</a>

            </div>

          </body>

        </html>

        `,

        { status: 400, headers: { 'Content-Type': 'text/html' } }

      );

    }

 

    // Mark token as used

    await prisma.memberLoginToken.update({

      where: { id: loginToken.id },

      data: { usedAt: new Date() },

    });

 

    // Create session cookie (HTTP-only, secure, 7-day expiry)

    const cookieStore = await cookies();

    const sessionData = JSON.stringify({

      memberId: loginToken.member.id,

      email: loginToken.member.email,

      loginAt: new Date().toISOString(),

    });

 

    cookieStore.set('gob_member_session', sessionData, {

      httpOnly: true,

      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      maxAge: 7 * 24 * 60 * 60, // 7 days

      path: '/',

    });

 

    console.log('[Auth] Member logged in:', loginToken.member.email);

 

    // Log login event

    await prisma.event.create({

      data: {

        memberId: loginToken.member.id,

        merchantId: loginToken.member.id, // TODO: Get actual merchant from context

        type: 'CONNECT_WALLET',

        source: 'magic-link',

        metadata: {

          email: loginToken.member.email,

          loginMethod: 'magic-link',

        },

      },

    });

 

    // Redirect to returnTo URL or default dashboard

    const redirectUrl = loginToken.returnTo || '/member/dashboard';

 

    return new NextResponse(

      `

      <!DOCTYPE html>

      <html>

        <head>

          <title>Login Successful</title>

          <meta http-equiv="refresh" content="2;url=${redirectUrl}">

          <style>

            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }

            h1 { color: #16a34a; margin: 0 0 20px 0; }

            p { color: #6b7280; line-height: 1.6; }

            .loader { margin: 20px auto; border: 4px solid #f3f4f6; border-top: 4px solid #244b7a; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }

            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

          </style>

        </head>

        <body>

          <div class="card">

            <h1>✅ Login Successful!</h1>

            <p>Welcome back! Redirecting you now...</p>

            <div class="loader"></div>

            <p><small>If you're not redirected, <a href="${redirectUrl}">click here</a></small></p>

          </div>

        </body>

      </html>

      `,

      {

        status: 200,

        headers: { 'Content-Type': 'text/html' },

      }

    );

 

  } catch (error: any) {

    console.error('[Auth] Error verifying magic link:', error);

    return new NextResponse(

      `

      <!DOCTYPE html>

      <html>

        <head>

          <title>Error</title>

          <style>

            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }

            h1 { color: #dc2626; margin: 0 0 20px 0; }

            p { color: #6b7280; line-height: 1.6; }

            a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #244b7a; color: white; text-decoration: none; border-radius: 8px; }

          </style>

        </head>

        <body>

          <div class="card">

            <h1>❌ Error</h1>

            <p>An error occurred while verifying your login link.</p>

            <p><small>${error.message}</small></p>

            <a href="/">Return Home</a>

          </div>

        </body>

      </html>

      `,

      { status: 500, headers: { 'Content-Type': 'text/html' } }

    );

  }

}

 