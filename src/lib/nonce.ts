// src/lib/nonce.ts
import { randomBytes } from "crypto";

// In-memory nonce store (for production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Clean up old nonces every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [address, data] of nonceStore.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      nonceStore.delete(address);
    }
  }
}, 5 * 60 * 1000);

export function generateNonce(address: string): string {
  const normalizedAddress = address.toLowerCase().trim();

  // Generate a random nonce
  const nonce = randomBytes(32).toString("hex");

  // Store nonce with timestamp
  nonceStore.set(normalizedAddress, {
    nonce,
    timestamp: Date.now(),
  });

  return nonce;
}

export function verifyNonce(address: string, nonce: string): boolean {
  const normalizedAddress = address.toLowerCase().trim();
  const stored = nonceStore.get(normalizedAddress);

  if (!stored) {
    return false;
  }

  // Check if nonce is still valid (within 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (stored.timestamp < fiveMinutesAgo) {
    nonceStore.delete(normalizedAddress);
    return false;
  }

  // Verify nonce matches
  if (stored.nonce !== nonce) {
    return false;
  }

  // Delete nonce after use (one-time use)
  nonceStore.delete(normalizedAddress);
  return true;
}
