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
