// Shared utility functions

/**
 * Safely extract points from event metadata
 * Supports both 'points' and 'amount' fields for backwards compatibility
 */
export function getPointsFromMetadata(metadata: unknown): number | undefined {
  if (metadata && typeof metadata === "object" && "points" in metadata) {
    const maybePoints = (metadata as { points?: unknown }).points;
    if (typeof maybePoints === "number") {
      return maybePoints;
    }
  }

  if (metadata && typeof metadata === "object" && "amount" in metadata) {
    const maybeAmount = (metadata as { amount?: unknown }).amount;
    if (typeof maybeAmount === "number") {
      return maybeAmount;
    }
  }

  return undefined;
}

/**
 * Calculate current points from events
 * Events with REWARD_REDEEMED type subtract points, all others add
 */
export function calculatePointsFromEvents(
  events: Array<{
    type: string;
    metadata: unknown;
  }>
): number {
  let points = 0;
  for (const event of events) {
    const pts = getPointsFromMetadata(event.metadata);
    if (typeof pts !== "number") continue;

    if (event.type === "REWARD_REDEEMED") {
      points -= pts;
    } else {
      points += pts;
    }
  }
  return points;
}

/**
 * Validate and normalize wallet address
 * Basic validation for Ethereum-style addresses
 */
export function normalizeWalletAddress(address: string): string {
  const normalized = address.toLowerCase().trim();

  // Basic Ethereum address validation (0x + 40 hex chars)
  if (!/^0x[a-f0-9]{40}$/.test(normalized)) {
    throw new Error("Invalid wallet address format");
  }

  return normalized;
}

/**
 * Validate and normalize email
 */
export function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase().trim();

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email format");
  }

  return normalized;
}

/**
 * Constants for configuration
 */
export const CONFIG = {
  DEFAULT_POINTS_PER_VISIT: 10,
  SESSION_COOKIE_NAME: "gob_merchant_session",
  SESSION_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 60, // 60 requests per minute
} as const;