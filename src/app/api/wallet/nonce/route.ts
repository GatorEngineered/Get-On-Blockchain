// src/app/api/wallet/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "@/lib/nonce";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid address" },
        { status: 400 }
      );
    }

    const nonce = generateNonce(address);

    return NextResponse.json({ nonce }, { status: 200 });
  } catch (err: unknown) {
    console.error("[wallet/nonce] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
