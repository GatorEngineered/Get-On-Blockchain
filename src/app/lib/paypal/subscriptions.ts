// src/app/lib/paypal/subscriptions.ts
/**
 * PayPal Subscriptions API Library
 *
 * Modern PayPal Subscriptions API for SaaS billing
 * Uses: Products → Plans → Subscriptions
 *
 * Docs: https://developer.paypal.com/docs/subscriptions/
 */

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn('⚠️  PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
}

// Types
export type PayPalPlanInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: 'SERVICE' | 'PHYSICAL' | 'DIGITAL';
  category: string;
  image_url?: string;
  home_url?: string;
}

export interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: 'CREATED' | 'INACTIVE' | 'ACTIVE';
  billing_cycles: PayPalBillingCycle[];
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee?: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action: 'CONTINUE' | 'CANCEL';
    payment_failure_threshold: number;
  };
}

export interface PayPalBillingCycle {
  tenure_type: 'REGULAR' | 'TRIAL';
  sequence: number;
  total_cycles: number;
  pricing_scheme: {
    fixed_price: {
      value: string;
      currency_code: string;
    };
  };
  frequency: {
    interval_unit: PayPalPlanInterval;
    interval_count: number;
  };
}

export interface PayPalSubscription {
  id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  subscriber: {
    email_address: string;
    name?: {
      given_name: string;
      surname: string;
    };
  };
  billing_info?: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: 'REGULAR' | 'TRIAL';
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment?: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time?: string;
    final_payment_time?: string;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

/**
 * Get PayPal OAuth access token
 */
async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal Product
 * Products are the service you're selling (e.g., "GetOnBlockchain Loyalty Platform")
 */
export async function createProduct(params: {
  name: string;
  description: string;
  type?: 'SERVICE' | 'PHYSICAL' | 'DIGITAL';
  category?: string;
  image_url?: string;
  home_url?: string;
}): Promise<PayPalProduct> {
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      type: params.type || 'SERVICE',
      category: params.category || 'SOFTWARE',
      image_url: params.image_url,
      home_url: params.home_url,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create product: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Create a PayPal Billing Plan
 * Plans define the pricing structure (monthly, annual, etc.)
 */
export async function createPlan(params: {
  product_id: string;
  name: string;
  description: string;
  billing_cycles: PayPalBillingCycle[];
  payment_preferences?: {
    auto_bill_outstanding?: boolean;
    setup_fee?: { value: string; currency_code: string };
    payment_failure_threshold?: number;
  };
}): Promise<PayPalPlan> {
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      product_id: params.product_id,
      name: params.name,
      description: params.description,
      status: 'ACTIVE',
      billing_cycles: params.billing_cycles,
      payment_preferences: {
        auto_bill_outstanding: params.payment_preferences?.auto_bill_outstanding ?? true,
        setup_fee: params.payment_preferences?.setup_fee,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: params.payment_preferences?.payment_failure_threshold ?? 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create plan: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Create a PayPal Subscription
 * This creates the subscription and returns approval URL for customer
 */
export async function createSubscription(params: {
  plan_id: string;
  subscriber: {
    email_address: string;
    name?: {
      given_name: string;
      surname: string;
    };
  };
  return_url: string;
  cancel_url: string;
  custom_id?: string; // Your internal merchant ID
}): Promise<{
  subscription: PayPalSubscription;
  approvalUrl: string;
}> {
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      plan_id: params.plan_id,
      subscriber: params.subscriber,
      application_context: {
        brand_name: 'GetOnBlockchain',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: params.return_url,
        cancel_url: params.cancel_url,
      },
      custom_id: params.custom_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create subscription: ${JSON.stringify(error)}`);
  }

  const subscription: PayPalSubscription = await response.json();

  // Extract approval URL
  const approvalLink = subscription.links.find((link) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('No approval URL returned from PayPal');
  }

  return {
    subscription,
    approvalUrl: approvalLink.href,
  };
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get subscription: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(`Failed to cancel subscription: ${JSON.stringify(error)}`);
  }
}

/**
 * Suspend a subscription (temporary pause)
 */
export async function suspendSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/suspend`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(`Failed to suspend subscription: ${JSON.stringify(error)}`);
  }
}

/**
 * Activate a suspended subscription
 */
export async function activateSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/activate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(`Failed to activate subscription: ${JSON.stringify(error)}`);
  }
}

/**
 * Verify PayPal webhook signature
 * This ensures webhook events are genuinely from PayPal
 */
export async function verifyWebhookSignature(params: {
  webhookId: string;
  headers: {
    'paypal-transmission-id': string;
    'paypal-transmission-time': string;
    'paypal-transmission-sig': string;
    'paypal-cert-url': string;
    'paypal-auth-algo': string;
  };
  body: any;
}): Promise<{ verification_status: 'SUCCESS' | 'FAILURE' }> {
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: params.headers['paypal-transmission-id'],
      transmission_time: params.headers['paypal-transmission-time'],
      cert_url: params.headers['paypal-cert-url'],
      auth_algo: params.headers['paypal-auth-algo'],
      transmission_sig: params.headers['paypal-transmission-sig'],
      webhook_id: params.webhookId,
      webhook_event: params.body,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify webhook: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Helper: Create 7-day trial + monthly billing cycle
 */
export function createTrialBillingCycles(monthlyPrice: string): PayPalBillingCycle[] {
  return [
    // 7-day free trial
    {
      tenure_type: 'TRIAL',
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: {
          value: '0',
          currency_code: 'USD',
        },
      },
      frequency: {
        interval_unit: 'DAY',
        interval_count: 7,
      },
    },
    // Regular monthly billing
    {
      tenure_type: 'REGULAR',
      sequence: 2,
      total_cycles: 0, // 0 = infinite
      pricing_scheme: {
        fixed_price: {
          value: monthlyPrice,
          currency_code: 'USD',
        },
      },
      frequency: {
        interval_unit: 'MONTH',
        interval_count: 1,
      },
    },
  ];
}

/**
 * Helper: Create annual billing cycle (no trial)
 */
export function createAnnualBillingCycle(annualPrice: string): PayPalBillingCycle[] {
  return [
    {
      tenure_type: 'REGULAR',
      sequence: 1,
      total_cycles: 0, // 0 = infinite
      pricing_scheme: {
        fixed_price: {
          value: annualPrice,
          currency_code: 'USD',
        },
      },
      frequency: {
        interval_unit: 'YEAR',
        interval_count: 1,
      },
    },
  ];
}
