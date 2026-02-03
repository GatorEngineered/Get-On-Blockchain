import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllPOSConnectionStatuses, getAvailablePOSProviders } from "@/app/lib/pos";

/**
 * GET /api/merchant/integrations/status
 * Get connection status for all POS providers
 */
export async function GET() {
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

    // Get all connection statuses
    const statuses = await getAllPOSConnectionStatuses(merchantId);

    // Get available providers (those with configured API keys)
    const availableProviders = getAvailablePOSProviders();

    // Debug logging to help identify configuration issues
    console.log('[POS Status] Environment variable check:');
    console.log('  SQUARE_CLIENT_ID:', process.env.SQUARE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('  SQUARE_CLIENT_SECRET:', process.env.SQUARE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('  SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? 'SET' : 'NOT SET');
    console.log('  SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'SET' : 'NOT SET');
    console.log('  TOAST_CLIENT_ID:', process.env.TOAST_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('  TOAST_CLIENT_SECRET:', process.env.TOAST_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('  CLOVER_CLIENT_ID:', process.env.CLOVER_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('  CLOVER_CLIENT_SECRET:', process.env.CLOVER_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('[POS Status] Available providers:', availableProviders);

    return NextResponse.json({
      statuses,
      availableProviders,
    });
  } catch (error: any) {
    console.error("[POS Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get integration status" },
      { status: 500 }
    );
  }
}
