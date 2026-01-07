import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthUrl, isPOSConfigured, POSProvider } from "@/app/lib/pos";

const VALID_PROVIDERS: POSProvider[] = ['square', 'toast', 'clover', 'shopify'];

/**
 * GET /api/merchant/integrations/[provider]/connect
 * Start OAuth flow for a POS provider
 */
export async function GET(
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

    // Check if provider is configured
    if (!isPOSConfigured(provider as POSProvider)) {
      return NextResponse.json(
        { error: `${provider} integration is not configured. Contact support.` },
        { status: 400 }
      );
    }

    // For Shopify, get shop domain from query params
    let shopDomain: string | undefined;
    if (provider === 'shopify') {
      shopDomain = req.nextUrl.searchParams.get('shop') || undefined;
      if (!shopDomain) {
        return NextResponse.json(
          { error: "Shopify store domain is required" },
          { status: 400 }
        );
      }
    }

    // Generate OAuth URL
    const authUrl = generateAuthUrl(provider as POSProvider, merchantId, shopDomain);

    if (!authUrl) {
      return NextResponse.json(
        { error: "Failed to generate authorization URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error(`[POS Connect] Error:`, error);
    return NextResponse.json(
      { error: "Failed to start connection" },
      { status: 500 }
    );
  }
}
