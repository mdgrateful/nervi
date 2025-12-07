# Email Setup Guide for Nervi

Nervi uses [Resend](https://resend.com) to send automatic emails to users. This guide will help you set up email functionality.

## Features

- **Welcome Emails**: Automatically sent when new users sign up
- **Password Reset Emails**: Sent when users request password resets
- **Beautiful HTML Templates**: Branded, responsive email designs
- **Graceful Degradation**: Works in development without email configured

## Quick Setup

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day, 3,000/month free)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Name it "Nervi Production" or "Nervi Development"
5. Copy the API key (it starts with `re_`)

### 3. Set Up Your Domain (Production Only)

For production, you'll want to send emails from your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `nervi.app`)
4. Follow the DNS setup instructions to add the required records
5. Wait for verification (usually takes 5-15 minutes)

**For development/testing**, you can skip this step and use Resend's default sending domain.

### 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here

# Email "From" address (optional, defaults to onboarding@nervi.app)
EMAIL_FROM=Nervi <hello@yourdomain.com>

# App URL for links in emails (optional, defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 5. Test Email Sending

1. Start your development server: `npm run dev`
2. Go to the signup page: `http://localhost:3000/signup`
3. Create a test account with your real email address
4. Check your inbox for the welcome email

## Email Types

### Welcome Email
**Sent:** When a new user signs up
**Contains:**
- Welcome message
- Feature overview
- Getting started guide
- Nervous system education points

### Password Reset Email
**Sent:** When a user requests a password reset
**Contains:**
- Reset link (expires in 1 hour)
- Security reminder

## Development Mode

If `RESEND_API_KEY` is not set, the app will:
- Log a message to the console instead of sending email
- Continue functioning normally
- Not block user signup/login

This allows development without email configuration.

## Production Checklist

Before launching to production:

- [ ] Resend account created and verified
- [ ] Domain added and DNS configured in Resend
- [ ] `RESEND_API_KEY` environment variable set
- [ ] `EMAIL_FROM` uses your verified domain
- [ ] `NEXT_PUBLIC_APP_URL` set to your production URL
- [ ] Test email sent successfully
- [ ] Check spam folder and adjust SPF/DKIM if needed

## Monitoring

### Resend Dashboard

View email analytics in your Resend dashboard:
- **Sent**: Total emails sent
- **Delivered**: Successfully delivered
- **Bounced**: Failed deliveries
- **Complained**: Marked as spam

### Application Logs

Email sending is logged in your application:
```
[EMAIL] Welcome email sent successfully to: user@example.com
[EMAIL] Password reset email sent successfully to: user@example.com
[EMAIL] Skipping email send - RESEND_API_KEY not configured (dev mode)
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check Domain**: For production, verify domain is verified in Resend
3. **Check Logs**: Look for error messages in console
4. **Test API Key**: Try sending a test email from Resend dashboard

### Emails Going to Spam

1. **Verify Domain**: Ensure your domain is verified with proper DNS records
2. **SPF/DKIM**: Check that SPF and DKIM records are correctly configured
3. **Content**: Avoid spam trigger words in email content
4. **Warm Up**: Start with small volume and gradually increase

### Rate Limits

Free tier limits:
- 100 emails/day
- 3,000 emails/month

If you exceed these, emails will be queued or rejected. Consider upgrading to a paid plan.

## Customization

### Modifying Email Templates

Email templates are in `/lib/email.js`:

```javascript
// Welcome email template
function getWelcomeEmailHTML(username) {
  // Edit HTML here
}

// Password reset email template
function getPasswordResetEmailHTML(resetUrl) {
  // Edit HTML here
}
```

### Adding New Email Types

1. Create a new function in `/lib/email.js`:
```javascript
export async function sendNewEmailType(email, data) {
  // Implementation here
}
```

2. Call it from your API route:
```javascript
import { sendNewEmailType } from '../../../lib/email';

// In your handler
await sendNewEmailType(user.email, userData);
```

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Issue Tracker**: Check application logs for detailed error messages

## Cost

### Free Tier
- 100 emails/day
- 3,000 emails/month
- Perfect for development and small apps

### Paid Plans
- **Pro**: $20/month for 50,000 emails
- **Business**: Custom pricing for high volume

Most small applications will stay within the free tier.
