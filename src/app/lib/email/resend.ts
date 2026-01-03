// src/lib/email/resend.ts

import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Lazy initialization - only create client when needed
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
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

// Export getter function instead of direct client
export const resend = {
  get client() {
    return getResendClient();
  },
};

 