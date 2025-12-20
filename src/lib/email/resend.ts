// src/lib/email/resend.ts

import { Resend } from 'resend';

// Lazy initialization to avoid errors during build time
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL || 'noreply@getonblockchain.com',
}: SendEmailOptions) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend] Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`[Resend] Email sent successfully to ${to}:`, data?.id);
    return data;
  } catch (error: any) {
    console.error('[Resend] Unexpected error:', error);
    throw error;
  }
}

// Export getter for backward compatibility
export const resend = new Proxy({} as Resend, {
  get: (target, prop) => {
    const client = getResendClient();
    return (client as any)[prop];
  }
});
