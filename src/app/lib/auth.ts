// Authentication middleware and helpers
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { CONFIG } from "./utils";

export type AuthenticatedMerchant = {
  id: string;
  slug: string;
  name: string;
  plan: string;
};

/**
 * Get the currently authenticated merchant from session cookie
 * Returns null if not authenticated
 */
export async function getCurrentMerchant(): Promise<AuthenticatedMerchant | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(CONFIG.SESSION_COOKIE_NAME);

    if (!session?.value) {
      return null;
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: session.value },
      select: {
        id: true,
        slug: true,
        name: true,
        plan: true,
      },
    });

    return merchant;
  } catch (error) {
    console.error("Error getting current merchant:", error);
    return null;
  }
}

/**
 * Middleware to require merchant authentication
 * Returns authenticated merchant or error response
 */
export async function requireMerchantAuth(): Promise<
  { merchant: AuthenticatedMerchant } | { error: NextResponse }
> {
  const merchant = await getCurrentMerchant();

  if (!merchant) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { merchant };
}

/**
 * Middleware to require staff authentication for a specific merchant
 * Validates that the authenticated merchant matches the requested merchant
 */
export async function requireStaffAuth(
  merchantSlug: string
): Promise<
  { merchant: AuthenticatedMerchant } | { error: NextResponse }
> {
  const result = await requireMerchantAuth();

  if ("error" in result) {
    return result;
  }

  if (result.merchant.slug !== merchantSlug) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized access to this merchant" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Helper to validate request body against a Zod schema
 */
export function validateRequest<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown
): { data: T } | { error: NextResponse } {
  try {
    const validated = schema.parse(data);
    return { data: validated };
  } catch (error) {
    if (error && typeof error === "object" && "errors" in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      const messages = zodError.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        error: NextResponse.json(
          { error: "Validation failed", details: messages },
          { status: 400 }
        ),
      };
    }

    return {
      error: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Helper to handle API errors consistently
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[${context}] Error:`, error);

  const message = error instanceof Error ? error.message : "Internal server error";

  // Only expose detailed errors in development
  const errorMessage =
    process.env.NODE_ENV === "development" ? message : "Internal server error";

  return NextResponse.json({ error: errorMessage }, { status: 500 });
}