// src/lib/email/resend.ts

import { Resend } from 'resend';

 

const resend = new Resend(process.env.RESEND_API_KEY);

 

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

 

export { resend };

 
