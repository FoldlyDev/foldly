'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_b5FCiMF4_EWVHn9qcDZev6cdMXsCoSMDF');

export async function dropEmail(email: string) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'that email ain\'t it, fam' };
    }

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'dev@foldly.com',
      subject: 'Someone\'s Vibing 🔥',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Vibe Check ✨</h2>
          <p style="color: #666; font-size: 16px;">Someone dropped their email:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Dropped at: ${new Date().toLocaleString()}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">They vibed with Foldly - might be worth reaching out.</p>
        </div>
      `,
      text: `New Vibe Check\n\nEmail: ${email}\nDropped at: ${new Date().toLocaleString()}`,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: 'something broke, try again?' };
    }

    return { success: true };
  } catch (error) {
    console.error('Vibe check error:', error);
    return { success: false, error: 'that didn\'t work, give it another shot' };
  }
}