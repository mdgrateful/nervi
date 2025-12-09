import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send welcome email to new users
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendWelcomeEmail(email, username) {
  try {
    // Skip sending if no API key configured (dev environment)
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Skipping email send - RESEND_API_KEY not configured');
      return { success: true, skipped: true };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Nervi <onboarding@nervi.app>',
      to: [email],
      subject: 'Welcome to Nervi - Your Nervous System Companion',
      html: getWelcomeEmailHTML(username),
    });

    if (error) {
      console.error('[EMAIL] Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('[EMAIL] Welcome email sent successfully to:', email);
    return { success: true, data };
  } catch (err) {
    console.error('[EMAIL] Unexpected error sending welcome email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate HTML for welcome email
 * @param {string} username - User's username
 * @returns {string} HTML email content
 */
function getWelcomeEmailHTML(username) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nervi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">

          <!-- Header with gradient -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                Welcome to Nervi
              </h1>
              <p style="margin: 10px 0 0; color: #f1f5f9; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Your Nervous System Companion
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #f1f5f9;">
                Hi <strong>${username}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                Thank you for joining Nervi! We're excited to support you on your journey to understanding and regulating your nervous system.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                Nervi uses trauma-informed, nervous system-focused care rooted in <strong>polyvagal theory</strong> and <strong>somatic experiencing</strong> to help you:
              </p>

              <!-- Features list -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; align-items: start;">
                      <span style="color: #10b981; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Track your nervous system states and patterns</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; align-items: start;">
                      <span style="color: #10b981; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Get personalized daily practices for regulation</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; align-items: start;">
                      <span style="color: #10b981; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Map your life story to understand where patterns began</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; align-items: start;">
                      <span style="color: #10b981; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Chat with Nervi anytime for nervous system support</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Getting started section -->
              <div style="background-color: #0f172a; border-left: 4px solid #8b5cf6; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h3 style="margin: 0 0 12px; color: #f1f5f9; font-size: 18px;">Getting Started</h3>
                <ol style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;"><strong>Chat with Nervi</strong> to share how you're feeling today</li>
                  <li style="margin-bottom: 8px;"><strong>Check your Dashboard</strong> for personalized daily practices</li>
                  <li style="margin-bottom: 8px;"><strong>Track Notes</strong> about your nervous system states</li>
                  <li style="margin-bottom: 0;"><strong>Explore Life Story Map</strong> to understand your patterns</li>
                </ol>
              </div>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                Remember: Your nervous system learned these patterns to keep you safe. With awareness and practice, you can create new, healthier patterns.
              </p>

              <p style="margin: 0 0 10px; font-size: 16px; color: #cbd5e1;">
                Welcome to your healing journey,
              </p>
              <p style="margin: 0; font-size: 16px; color: #8b5cf6; font-weight: 600;">
                The Nervi Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                You're receiving this email because you signed up for Nervi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendPasswordResetEmail(email, resetToken) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Skipping email send - RESEND_API_KEY not configured');
      return { success: true, skipped: true };
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Nervi <noreply@nervi.app>',
      to: [email],
      subject: 'Reset Your Nervi Password',
      html: getPasswordResetEmailHTML(resetUrl),
    });

    if (error) {
      console.error('[EMAIL] Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('[EMAIL] Password reset email sent successfully to:', email);
    return { success: true, data };
  } catch (err) {
    console.error('[EMAIL] Unexpected error sending password reset email:', err);
    return { success: false, error: err.message };
  }
}

function getPasswordResetEmailHTML(resetUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">

          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                We received a request to reset your Nervi password. Click the button below to create a new password:
              </p>

              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Or copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
              </p>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #64748b; padding-top: 20px; border-top: 1px solid #334155;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
