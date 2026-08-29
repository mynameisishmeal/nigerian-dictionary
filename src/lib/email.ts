/**
 * Free Email Verification Delivery Service
 * Supports:
 * 1. Resend API (Free Tier: 3,000 emails/month, 100 emails/day, no card required)
 * 2. Fallback / Local Development Logger with instant verification link
 */

interface SendVerificationEmailParams {
  email: string;
  token: string;
  name?: string | null;
}

export async function sendVerificationEmail({ email, token, name }: SendVerificationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const verificationLink = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.EMAIL_FROM || 'The Nigerian Dictionary <onboarding@resend.dev>';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Verify Your Nigerian Dictionary Account</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #181a1b; border: 1px solid #282a2d; border-radius: 24px; padding: 36px 28px; text-align: center; }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #008751; text-transform: uppercase; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 28px; }
        .btn { display: inline-block; background-color: #008751; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(0, 135, 81, 0.4); }
        .footer { font-size: 11px; color: #71717a; margin-top: 36px; border-top: 1px solid #282a2d; padding-top: 20px; }
        .warning { font-size: 12px; color: #eab308; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); padding: 10px 14px; border-radius: 12px; margin-top: 24px; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">🇳🇬 The Nigerian Dictionary</div>
        <h1>Verify Your Account</h1>
        <p>E ku abo, ${name ? `<strong>${name}</strong>` : 'Contributor'}! Click the button below to verify your email and complete your 3-step heritage onboarding.</p>
        
        <a href="${verificationLink}" class="btn" target="_blank">Verify Email & Continue</a>
        
        <div class="warning">
          <strong>⚠️ Single-Use Security Link:</strong> This link can only be used once and expires in 24 hours.
        </div>

        <div class="footer">
          <p>If you did not request this email, you can safely ignore it.</p>
          <p>© ${new Date().getFullYear()} The Nigerian Dictionary · Preserving Our Voices</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. If Resend API Key is configured, dispatch real email
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [email],
          subject: '🇳🇬 Verify your Nigerian Dictionary account',
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EMAIL ERROR] Resend failed:', errorData);
      } else {
        const result = await response.json();
        console.log('[EMAIL SUCCESS] Verification email sent via Resend:', result.id);
        return { success: true, method: 'resend', id: result.id, link: verificationLink };
      }
    } catch (err) {
      console.error('[EMAIL ERROR] Network error while sending via Resend:', err);
    }
  }

  // 2. Fallback logger (Always guarantees dev & testing availability)
  console.log('\n======================================================');
  console.log('📧 [EMAIL VERIFICATION LINK GENERATED]');
  console.log(`👤 User: ${email}`);
  console.log(`🔗 Link: ${verificationLink}`);
  console.log('======================================================\n');

  return { success: true, method: 'console', link: verificationLink };
}
