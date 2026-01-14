/**
 * Generic error responses for API endpoints
 * These messages are intentionally vague to prevent information disclosure to attackers
 */

// Generic user-facing error messages
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_FAILED: 'Authentication failed. Please try again or contact support.',
  SESSION_INVALID: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',

  // Resource errors (don't reveal if resource exists or not)
  NOT_FOUND: 'The requested resource could not be found.',
  REQUEST_FAILED: 'Your request could not be processed. Please try again or contact support.',

  // Validation errors
  INVALID_REQUEST: 'Invalid request. Please check your input and try again.',
  MISSING_FIELDS: 'Required information is missing. Please try again.',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',

  // Server errors
  SERVER_ERROR: 'Something went wrong. Please try again or contact support.',

  // Payment errors
  PAYMENT_FAILED: 'Payment could not be processed. Please try again or contact support.',

  // Email errors
  EMAIL_FAILED: 'Unable to send email. Please try again or contact support.',

  // Wallet errors
  WALLET_ERROR: 'Wallet operation failed. Please try again or contact support.',
} as const;

// Support contact info to include in error responses
export const SUPPORT_CONTACT = 'support@getonblockchain.com';

/**
 * Creates a generic error response object
 * Use this instead of exposing detailed error messages
 */
export function createErrorResponse(
  genericMessage: string,
  internalError?: unknown
): { error: string; support?: string } {
  // Log the actual error server-side for debugging
  if (internalError) {
    console.error('[API Error]', internalError);
  }

  return {
    error: genericMessage,
  };
}

/**
 * Logs detailed error information server-side while returning generic message to client
 */
export function logAndCreateError(
  context: string,
  internalError: unknown,
  genericMessage: string = ERROR_MESSAGES.SERVER_ERROR
): { error: string } {
  console.error(`[${context}]`, internalError);
  return { error: genericMessage };
}
