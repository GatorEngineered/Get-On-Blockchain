import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  savePOSTokens,
  POSProvider,
} from "@/app/lib/pos";

const VALID_PROVIDERS: POSProvider[] = ['square', 'toast', 'clover', 'shopify'];

/**
 * GET /api/merchant/integrations/[provider]/callback
 * OAuth callback handler for POS providers
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as POSProvider)) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=pos-integrations&error=invalid_provider', req.url)
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error(`[POS Callback] OAuth error for ${provider}:`, error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=oauth_denied&provider=${provider}`, req.url)
      );
    }

    // Validate required params
    if (!code || !state) {
      console.error(`[POS Callback] Missing code or state for ${provider}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=missing_params&provider=${provider}`, req.url)
      );
    }

    // Decode state to get merchant ID
    let stateData: { merchantId: string; provider: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      console.error(`[POS Callback] Invalid state for ${provider}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=invalid_state&provider=${provider}`, req.url)
      );
    }

    // Validate state timestamp (within 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (stateData.timestamp < oneHourAgo) {
      console.error(`[POS Callback] Expired state for ${provider}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=expired_state&provider=${provider}`, req.url)
      );
    }

    // Get shop domain for Shopify
    let shopDomain: string | undefined;
    if (provider === 'shopify') {
      shopDomain = searchParams.get('shop') || undefined;
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider as POSProvider, code, shopDomain);

    if (!tokens) {
      console.error(`[POS Callback] Token exchange failed for ${provider}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=token_exchange&provider=${provider}`, req.url)
      );
    }

    // Get additional data from callback (location ID, merchant ID, etc.)
    const additionalData: Record<string, string> = {};

    // Square returns merchant_id in the callback
    if (provider === 'square') {
      const merchantId = searchParams.get('merchant_id');
      if (merchantId) {
        additionalData.locationId = merchantId; // Square uses this as location
      }
    }

    // Clover returns merchant_id
    if (provider === 'clover') {
      const cloverId = searchParams.get('merchant_id');
      if (cloverId) {
        additionalData.merchantGuid = cloverId;
      }
    }

    // Toast returns restaurant_guid
    if (provider === 'toast') {
      const restaurantGuid = searchParams.get('restaurant_guid');
      if (restaurantGuid) {
        additionalData.merchantGuid = restaurantGuid;
      }
    }

    // Shopify shop domain
    if (provider === 'shopify' && shopDomain) {
      additionalData.shopDomain = shopDomain;
    }

    // Save tokens
    const saved = await savePOSTokens(
      stateData.merchantId,
      provider as POSProvider,
      tokens,
      additionalData
    );

    if (!saved) {
      console.error(`[POS Callback] Failed to save tokens for ${provider}`);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=pos-integrations&error=save_failed&provider=${provider}`, req.url)
      );
    }

    console.log(`[POS Callback] Successfully connected ${provider} for merchant ${stateData.merchantId}`);

    // Redirect to success
    return NextResponse.redirect(
      new URL(`/dashboard/settings?tab=pos-integrations&success=${provider}`, req.url)
    );
  } catch (error: any) {
    console.error(`[POS Callback] Error for ${provider}:`, error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?tab=pos-integrations&error=unknown&provider=${provider}`, req.url)
    );
  }
}
