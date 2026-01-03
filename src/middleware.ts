// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Get subdomain from hostname
  // Format: subdomain.getonblockchain.com or subdomain.localhost:3000
  const hostParts = hostname.split('.');

  // For localhost:3000 or development environments without subdomain
  const isLocalhost = hostname.includes('localhost');

  // Detect Vercel deployment (*.vercel.app) - disable subdomain routing
  const isVercelDeployment = hostname.includes('.vercel.app');

  const subdomain = isLocalhost
    ? (hostParts.length > 1 ? hostParts[0] : null)
    : (hostParts.length >= 3 ? hostParts[0] : null);

  console.log(`[Middleware] hostname: ${hostname}, subdomain: ${subdomain}, pathname: ${pathname}, isVercel: ${isVercelDeployment}`);

  // Handle rewards subdomain (Member Portal)
  if (subdomain === 'rewards') {
    // Already on rewards subdomain, allow through
    // Member routes like /login, /register, /dashboard should work
    console.log(`[Middleware] Rewards subdomain detected, allowing ${pathname}`);
    return NextResponse.next();
  }

  // Handle dashboard subdomain (Business Portal)
  if (subdomain === 'dashboard') {
    // Already on dashboard subdomain, allow through
    // Dashboard routes like /login, /register should work
    console.log(`[Middleware] Dashboard subdomain detected, allowing ${pathname}`);
    return NextResponse.next();
  }

  // On Vercel deployment, allow all routes without subdomain redirects
  if (isVercelDeployment) {
    console.log(`[Middleware] Vercel deployment detected, allowing ${pathname} without subdomain redirect`);
    return NextResponse.next();
  }

  // Root domain (no subdomain) - Marketing site
  // Block member and dashboard routes on root domain
  if (!subdomain || subdomain === 'www') {
    // If trying to access member routes on root domain, redirect to rewards subdomain
    if (pathname.startsWith('/member')) {
      const rewardsUrl = new URL(pathname, request.url);

      if (isLocalhost) {
        // For localhost, just change the hostname
        rewardsUrl.host = `rewards.${hostname}`;
      } else {
        // For production, add subdomain to existing hostname
        // If hostname is 'www.getonblockchain.com', replace 'www' with 'rewards'
        // If hostname is 'getonblockchain.com', prepend 'rewards.'
        if (subdomain === 'www') {
          const domain = hostParts.slice(1).join('.');
          rewardsUrl.host = `rewards.${domain}`;
        } else {
          rewardsUrl.host = `rewards.${hostname}`;
        }
      }

      console.log(`[Middleware] Redirecting member route to: ${rewardsUrl.href}`);
      return NextResponse.redirect(rewardsUrl);
    }

    // If trying to access dashboard routes on root domain, redirect to dashboard subdomain
    if (pathname.startsWith('/dashboard') && pathname !== '/') {
      const dashboardUrl = new URL(pathname, request.url);

      if (isLocalhost) {
        dashboardUrl.host = `dashboard.${hostname}`;
      } else {
        // For production, add subdomain to existing hostname
        if (subdomain === 'www') {
          const domain = hostParts.slice(1).join('.');
          dashboardUrl.host = `dashboard.${domain}`;
        } else {
          dashboardUrl.host = `dashboard.${hostname}`;
        }
      }

      console.log(`[Middleware] Redirecting dashboard route to: ${dashboardUrl.href}`);
      return NextResponse.redirect(dashboardUrl);
    }

    // Allow marketing site routes on root domain
    console.log(`[Middleware] Root domain, allowing marketing site ${pathname}`);
    return NextResponse.next();
  }

  // Allow all other requests
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
