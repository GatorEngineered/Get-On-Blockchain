// src/app/lib/pos/types.ts
// POS Integration Types

export type POSProvider = 'square' | 'toast' | 'clover' | 'shopify';

export interface POSConfig {
  provider: POSProvider;
  name: string;
  description: string;
  logo: string;
  color: string;
  features: string[];
  docsUrl: string;
}

export interface POSConnectionStatus {
  provider: POSProvider;
  connected: boolean;
  locationId?: string;
  locationName?: string;
  shopDomain?: string;
  lastSyncAt?: Date;
  error?: string;
}

export interface POSOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface POSTransaction {
  id: string;
  provider: POSProvider;
  externalId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface POSTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

// Provider configurations
export const POS_PROVIDERS: Record<POSProvider, POSConfig> = {
  square: {
    provider: 'square',
    name: 'Square',
    description: 'Connect Square to automatically award points on purchases',
    logo: '/pos/square-logo.svg',
    color: '#006aff',
    features: [
      'Automatic points on every purchase',
      'Sync customer data',
      'Real-time transaction tracking',
    ],
    docsUrl: 'https://developer.squareup.com/docs',
  },
  toast: {
    provider: 'toast',
    name: 'Toast',
    description: 'Connect Toast POS for restaurant loyalty integration',
    logo: '/pos/toast-logo.svg',
    color: '#ff6900',
    features: [
      'Restaurant-focused loyalty',
      'Menu item tracking',
      'Server attribution',
    ],
    docsUrl: 'https://doc.toasttab.com/',
  },
  clover: {
    provider: 'clover',
    name: 'Clover',
    description: 'Connect Clover POS for seamless payment tracking',
    logo: '/pos/clover-logo.svg',
    color: '#2ecc71',
    features: [
      'Real-time payment sync',
      'Multi-location support',
      'Customer matching',
    ],
    docsUrl: 'https://docs.clover.com/',
  },
  shopify: {
    provider: 'shopify',
    name: 'Shopify',
    description: 'Connect Shopify for ecommerce loyalty points',
    logo: '/pos/shopify-logo.svg',
    color: '#96bf48',
    features: [
      'Online & in-store sync',
      'Order-based points',
      'Customer account linking',
    ],
    docsUrl: 'https://shopify.dev/docs',
  },
};
