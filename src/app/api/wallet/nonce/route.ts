// src/app/api/wallet/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid address" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase().trim();

    // Generate a random nonce
    const nonce = randomBytes(32).toString("hex");

    // Store nonce with timestamp
    nonceStore.set(normalizedAddress, {
      nonce,
      timestamp: Date.now(),
    });

    return NextResponse.json({ nonce }, { status: 200 });
  } catch (err: unknown) {
    console.error("[wallet/nonce] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export nonce store for verification in connect-wallet route
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
