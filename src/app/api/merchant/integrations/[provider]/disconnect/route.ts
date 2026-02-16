import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { disconnectPOS, POSProvider } from "@/app/lib/pos";

const VALID_PROVIDERS: POSProvider[] = ['square', 'toast', 'clover', 'shopify', 'booksy'];

/**
 * POST /api/merchant/integrations/[provider]/disconnect
 * Disconnect a POS provider
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { provider } = await params;

    // Validate provider
    if (!VALID_PROVIDERS.includes(provider as POSProvider)) {
      return NextResponse.json(
        { error: "Invalid POS provider" },
        { status: 400 }
      );
    }

    // Disconnect the provider
    const success = await disconnectPOS(merchantId, provider as POSProvider);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to disconnect integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error: any) {
    console.error(`[POS Disconnect] Error:`, error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
