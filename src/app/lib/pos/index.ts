// src/app/lib/pos/index.ts
// POS Integration Utilities

import { prisma } from '@/app/lib/prisma';
import { encrypt, decrypt } from '@/app/lib/crypto/encryption';
import { POSProvider, POSConnectionStatus, POSOAuthConfig, POSTokens } from './types';

// Environment variable getters for each provider
const getSquareConfig = (): POSOAuthConfig | null => {
  const clientId = process.env.SQUARE_CLIENT_ID;
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;
  const redirectUri = process.env.SQUARE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/merchant/integrations/square/callback`;

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: ['MERCHANT_PROFILE_READ', 'PAYMENTS_READ', 'CUSTOMERS_READ'],
    authUrl: 'https://connect.squareup.com/oauth2/authorize',
    tokenUrl: 'https://connect.squareup.com/oauth2/token',
  };
};

const getToastConfig = (): POSOAuthConfig | null => {
  const clientId = process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.TOAST_CLIENT_SECRET;
  const redirectUri = process.env.TOAST_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/merchant/integrations/toast/callback`;

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: ['restaurants:read', 'orders:read', 'guests:read'],
    authUrl: 'https://ws.toasttab.com/usermgmt/oauth/authorize',
    tokenUrl: 'https://ws.toasttab.com/usermgmt/oauth/token',
  };
};

const getCloverConfig = (): POSOAuthConfig | null => {
  const clientId = process.env.CLOVER_CLIENT_ID;
  const clientSecret = process.env.CLOVER_CLIENT_SECRET;
  const redirectUri = process.env.CLOVER_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/merchant/integrations/clover/callback`;

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: ['read_merchants', 'read_payments', 'read_customers'],
    authUrl: 'https://sandbox.dev.clover.com/oauth/authorize', // Use production URL in prod
    tokenUrl: 'https://sandbox.dev.clover.com/oauth/token',
  };
};

const getShopifyConfig = (): POSOAuthConfig | null => {
  const clientId = process.env.SHOPIFY_API_KEY;
  const clientSecret = process.env.SHOPIFY_API_SECRET;

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri: '', // Set dynamically based on shop domain
    scopes: ['read_customers', 'read_orders', 'read_products'],
    authUrl: '', // Set dynamically based on shop domain
    tokenUrl: '', // Set dynamically based on shop domain
  };
};

/**
 * Get OAuth configuration for a provider
 */
export function getPOSConfig(provider: POSProvider): POSOAuthConfig | null {
  switch (provider) {
    case 'square':
      return getSquareConfig();
    case 'toast':
      return getToastConfig();
    case 'clover':
      return getCloverConfig();
    case 'shopify':
      return getShopifyConfig();
    default:
      return null;
  }
}

/**
 * Check if a POS provider is configured (has API keys set)
 */
export function isPOSConfigured(provider: POSProvider): boolean {
  return getPOSConfig(provider) !== null;
}

/**
 * Get available (configured) POS providers
 */
export function getAvailablePOSProviders(): POSProvider[] {
  const providers: POSProvider[] = ['square', 'toast', 'clover', 'shopify'];
  return providers.filter(isPOSConfigured);
}

/**
 * Generate OAuth authorization URL for a provider
 */
export function generateAuthUrl(
  provider: POSProvider,
  merchantId: string,
  shopDomain?: string // Required for Shopify
): string | null {
  const config = getPOSConfig(provider);
  if (!config) return null;

  const state = Buffer.from(JSON.stringify({
    merchantId,
    provider,
    timestamp: Date.now()
  })).toString('base64');

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  // Provider-specific URL handling
  if (provider === 'shopify' && shopDomain) {
    return `https://${shopDomain}/admin/oauth/authorize?${params}&redirect_uri=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/merchant/integrations/shopify/callback`
    )}`;
  }

  params.append('redirect_uri', config.redirectUri);

  return `${config.authUrl}?${params}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  provider: POSProvider,
  code: string,
  shopDomain?: string
): Promise<POSTokens | null> {
  const config = getPOSConfig(provider);
  if (!config) return null;

  let tokenUrl = config.tokenUrl;
  let redirectUri = config.redirectUri;

  if (provider === 'shopify' && shopDomain) {
    tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
    redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/merchant/integrations/shopify/callback`;
  }

  const body: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
  };

  if (provider !== 'shopify') {
    body.redirect_uri = redirectUri;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[POS] Token exchange failed for ${provider}:`, await response.text());
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ? new Date(data.expires_at * 1000) : undefined,
      scope: data.scope,
    };
  } catch (error) {
    console.error(`[POS] Token exchange error for ${provider}:`, error);
    return null;
  }
}

/**
 * Save POS tokens to merchant record (encrypted)
 */
export async function savePOSTokens(
  merchantId: string,
  provider: POSProvider,
  tokens: POSTokens,
  additionalData?: {
    locationId?: string;
    merchantGuid?: string;
    shopDomain?: string;
  }
): Promise<boolean> {
  try {
    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

    const updateData: Record<string, any> = {};

    switch (provider) {
      case 'square':
        updateData.squareAccessToken = encryptedAccess;
        updateData.squareRefreshToken = encryptedRefresh;
        if (additionalData?.locationId) {
          updateData.squareLocationId = additionalData.locationId;
        }
        break;
      case 'toast':
        updateData.toastAccessToken = encryptedAccess;
        updateData.toastRefreshToken = encryptedRefresh;
        if (additionalData?.merchantGuid) {
          updateData.toastRestaurantGuid = additionalData.merchantGuid;
        }
        break;
      case 'clover':
        updateData.cloverAccessToken = encryptedAccess;
        if (additionalData?.merchantGuid) {
          updateData.cloverMerchantId = additionalData.merchantGuid;
        }
        break;
      case 'shopify':
        updateData.shopifyAccessToken = encryptedAccess;
        if (additionalData?.shopDomain) {
          updateData.shopifyShopDomain = additionalData.shopDomain;
        }
        break;
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
    });

    console.log(`[POS] Tokens saved for ${provider} - merchant ${merchantId}`);
    return true;
  } catch (error) {
    console.error(`[POS] Failed to save tokens for ${provider}:`, error);
    return false;
  }
}

/**
 * Get POS connection status for a merchant
 */
export async function getPOSConnectionStatus(
  merchantId: string,
  provider: POSProvider
): Promise<POSConnectionStatus> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      squareAccessToken: true,
      squareLocationId: true,
      toastAccessToken: true,
      toastRestaurantGuid: true,
      cloverAccessToken: true,
      cloverMerchantId: true,
      shopifyAccessToken: true,
      shopifyShopDomain: true,
    },
  });

  if (!merchant) {
    return { provider, connected: false, error: 'Merchant not found' };
  }

  switch (provider) {
    case 'square':
      return {
        provider,
        connected: !!merchant.squareAccessToken,
        locationId: merchant.squareLocationId || undefined,
      };
    case 'toast':
      return {
        provider,
        connected: !!merchant.toastAccessToken,
        locationId: merchant.toastRestaurantGuid || undefined,
      };
    case 'clover':
      return {
        provider,
        connected: !!merchant.cloverAccessToken,
        locationId: merchant.cloverMerchantId || undefined,
      };
    case 'shopify':
      return {
        provider,
        connected: !!merchant.shopifyAccessToken,
        shopDomain: merchant.shopifyShopDomain || undefined,
      };
    default:
      return { provider, connected: false };
  }
}

/**
 * Get all POS connection statuses for a merchant
 */
export async function getAllPOSConnectionStatuses(
  merchantId: string
): Promise<POSConnectionStatus[]> {
  const providers: POSProvider[] = ['square', 'toast', 'clover', 'shopify'];
  return Promise.all(providers.map(p => getPOSConnectionStatus(merchantId, p)));
}

/**
 * Disconnect a POS provider
 */
export async function disconnectPOS(
  merchantId: string,
  provider: POSProvider
): Promise<boolean> {
  try {
    const updateData: Record<string, null> = {};

    switch (provider) {
      case 'square':
        updateData.squareAccessToken = null;
        updateData.squareRefreshToken = null;
        updateData.squareLocationId = null;
        break;
      case 'toast':
        updateData.toastAccessToken = null;
        updateData.toastRefreshToken = null;
        updateData.toastRestaurantGuid = null;
        break;
      case 'clover':
        updateData.cloverAccessToken = null;
        updateData.cloverMerchantId = null;
        break;
      case 'shopify':
        updateData.shopifyAccessToken = null;
        updateData.shopifyShopDomain = null;
        break;
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
    });

    console.log(`[POS] Disconnected ${provider} for merchant ${merchantId}`);
    return true;
  } catch (error) {
    console.error(`[POS] Failed to disconnect ${provider}:`, error);
    return false;
  }
}

/**
 * Get decrypted access token for a provider
 */
export async function getPOSAccessToken(
  merchantId: string,
  provider: POSProvider
): Promise<string | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      squareAccessToken: true,
      toastAccessToken: true,
      cloverAccessToken: true,
      shopifyAccessToken: true,
    },
  });

  if (!merchant) return null;

  let encryptedToken: string | null = null;

  switch (provider) {
    case 'square':
      encryptedToken = merchant.squareAccessToken;
      break;
    case 'toast':
      encryptedToken = merchant.toastAccessToken;
      break;
    case 'clover':
      encryptedToken = merchant.cloverAccessToken;
      break;
    case 'shopify':
      encryptedToken = merchant.shopifyAccessToken;
      break;
  }

  if (!encryptedToken) return null;

  try {
    return decrypt(encryptedToken);
  } catch (error) {
    console.error(`[POS] Failed to decrypt token for ${provider}:`, error);
    return null;
  }
}

export * from './types';
