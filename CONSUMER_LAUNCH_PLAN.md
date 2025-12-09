# Nervi Consumer Launch - Security & Privacy Action Plan

**Goal:** Launch a consumer wellness app with strong security, privacy, and legal compliance (GDPR-ready, SOC 2 foundations)

**Timeline:** 3-4 weeks to consumer-ready
**Status:** 🔴 Not Ready → 🟢 Ready to Launch

---

## Phase 1: Critical Security Fixes (Week 1)
**Priority: IMMEDIATE - Protect user data NOW**

### ✅ Task 1.1: Secure Logging System
**Problem:** 13 API routes log sensitive user data (userIds, emails, errors with PHI)

**Action:**
1. Create secure logger utility (`/lib/logger.js`):
```javascript
// Only log to console in development
// In production, send to secure logging service (Sentry, LogRocket)
export function logInfo(message, metadata = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[INFO] ${message}`, sanitizeForLog(metadata));
  }
  // TODO: Send to production logging service
}

export function logError(message, error, metadata = {}) {
  const sanitized = {
    message: error?.message,
    code: error?.code,
    // NEVER log: userId, email, username, full error objects
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, sanitized);
  }
  // TODO: Send to Sentry/error tracking
}

function sanitizeForLog(data) {
  // Remove sensitive fields
  const { password, email, userId, ...safe } = data;
  return safe;
}
```

2. Replace all `console.log/error` in these files:
   - `/app/api/signup/route.js` - Remove user creation logs
   - `/app/api/apply-promo-code/route.js` - Remove userId from logs
   - `/app/api/auth/[...nextauth]/route.js` - Remove credential logs
   - `/app/api/reset-password/route.js` - Remove token/email logs
   - All other 9 API files

**Files to modify:** 13 API routes
**Estimated time:** 2-3 hours

---

### ✅ Task 1.2: Strengthen Password Requirements
**Current:** 8 characters minimum
**New Standard:** Industry best practices

**Action:**
Update `/app/api/signup/route.js`:
```javascript
function validatePassword(password) {
  if (password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters" };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      valid: false,
      error: "Password must include uppercase, lowercase, number, and special character"
    };
  }

  // Check against common passwords list
  const commonPasswords = ['Password123!', 'Welcome123!', /* add more */];
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    return { valid: false, error: "Password is too common" };
  }

  return { valid: true };
}
```

Update signup form to show requirements in real-time.

**Files to modify:**
- `/app/api/signup/route.js`
- `/app/signup/page.js` (show requirements)
- `/app/reset-password/page.js`

**Estimated time:** 1 hour

---

### ✅ Task 1.3: Add Rate Limiting
**Problem:** No protection against brute force, spam, or DDoS

**Action:**
1. Install: `npm install express-rate-limit`

2. Create middleware (`/lib/rateLimit.js`):
```javascript
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per IP per hour
  message: 'Too many accounts created. Please try again later.',
});
```

3. Apply to endpoints:
   - Login: 5 attempts per 15 min
   - Signup: 3 accounts per hour per IP
   - Password reset: 3 attempts per hour
   - All API routes: 60 requests per minute

**Files to modify:**
- `/app/api/auth/[...nextauth]/route.js`
- `/app/api/signup/route.js`
- `/app/api/request-password-reset/route.js`
- All sensitive endpoints

**Estimated time:** 2 hours

---

### ✅ Task 1.4: Secure Session Management
**Problem:** No session timeout, weak session configuration

**Action:**
Update `/app/api/auth/[...nextauth]/route.js`:
```javascript
export const authOptions = {
  // ... existing config
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (instead of 30)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // HTTPS only in production
        domain: process.env.NODE_ENV === 'production'
          ? '.nervi-app.com' // Your domain
          : undefined
      }
    }
  },
  // Add session validation
  callbacks: {
    async jwt({ token, user }) {
      // Add timestamp to track session age
      if (!token.createdAt) {
        token.createdAt = Date.now();
      }

      // Force re-authentication after 7 days
      if (Date.now() - token.createdAt > 7 * 24 * 60 * 60 * 1000) {
        throw new Error('Session expired. Please log in again.');
      }

      return token;
    }
  }
};
```

**Files to modify:** `/app/api/auth/[...nextauth]/route.js`
**Estimated time:** 1 hour

---

### ✅ Task 1.5: Environment Variable Security Audit
**Action:**
1. Review `.env.local` - ensure no secrets in git
2. Add to `.gitignore`:
```
.env.local
.env.development.local
.env.production.local
*.key
*.pem
```

3. Create `.env.example`:
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here

# Auth
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Stripe (Optional - for paid features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Optional)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# AI
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3010
NODE_ENV=development
```

4. Verify Vercel environment variables are set
5. Rotate any secrets that may have been exposed

**Estimated time:** 30 minutes

---

## Phase 2: Privacy & Legal (Week 2)
**Priority: HIGH - Required before accepting users**

### ✅ Task 2.1: Privacy Policy
**Action:**
1. Create `/app/privacy/page.js`
2. Use generator (e.g., Termly, iubenda) or hire lawyer
3. Must include:
   - What data you collect (email, username, conversations, state, work hours, profile pic)
   - Why you collect it (provide service, personalization)
   - How you use it (AI processing, analytics)
   - How long you keep it (retention policy)
   - User rights (access, delete, export)
   - Third parties (Supabase, Stripe, Anthropic, Vercel)
   - Cookies used
   - Contact info for privacy questions
   - Last updated date

**Template Structure:**
```markdown
# Privacy Policy
Last Updated: [DATE]

## 1. Information We Collect
- Account information (email, username, password hash)
- Profile data (state, work hours, preferences)
- Conversation data (messages with AI)
- Usage data (pages visited, features used)

## 2. How We Use Your Information
- Provide AI-powered nervous system care
- Personalize your experience
- Send service updates (with your consent)
- Improve our services

## 3. Data Sharing
We do NOT sell your data. We share with:
- Supabase (database hosting)
- Anthropic (AI processing)
- Stripe (payment processing - if subscribed)
- Vercel (hosting)

## 4. Your Rights
- Access your data
- Download your data
- Delete your account
- Opt out of emails

## 5. Security
We use industry-standard encryption and security practices.

## 6. Contact
privacy@nervi-app.com
```

**Files to create:** `/app/privacy/page.js`
**Estimated time:** 3-4 hours (using template) or 1 week (with lawyer)

---

### ✅ Task 2.2: Terms of Service
**Action:**
1. Create `/app/terms/page.js`
2. Must include:
   - Acceptance of terms
   - User responsibilities
   - Prohibited uses
   - Disclaimers (not medical advice!)
   - Limitation of liability
   - Account termination conditions
   - Changes to terms
   - Governing law

**CRITICAL DISCLAIMER:**
```
## NOT MEDICAL ADVICE

Nervi is a wellness tool and is NOT a substitute for professional
medical advice, diagnosis, or treatment. Always seek the advice of
your physician or other qualified health provider with any questions
you may have regarding a medical condition.

If you are experiencing a mental health crisis, contact:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
```

**Files to create:** `/app/terms/page.js`
**Estimated time:** 3-4 hours (template) or 1 week (lawyer)

---

### ✅ Task 2.3: Cookie Consent Banner
**Action:**
1. Install: `npm install react-cookie-consent`

2. Add to layout (`/app/layout.js`):
```javascript
import CookieConsent from "react-cookie-consent";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        <CookieConsent
          location="bottom"
          buttonText="Accept"
          declineButtonText="Decline"
          enableDeclineButton
          cookieName="nervi-cookie-consent"
          style={{ background: "#2B373B" }}
          buttonStyle={{ background: "#4E9FFF", color: "#FFF", fontSize: "14px" }}
          expires={365}
        >
          We use cookies to improve your experience.
          <a href="/privacy" style={{ color: "#4E9FFF" }}> Learn more</a>
        </CookieConsent>
      </body>
    </html>
  );
}
```

**Files to modify:** `/app/layout.js`
**Estimated time:** 1 hour

---

### ✅ Task 2.4: Consent Checkboxes on Signup
**Action:**
Update `/app/signup/page.js` to add required checkboxes:

```javascript
const [agreedToTerms, setAgreedToTerms] = useState(false);
const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
const [consentToEmails, setConsentToEmails] = useState(false); // Optional

// In form, before submit button:
<div style={{ marginTop: spacing.md }}>
  <label style={{ display: "flex", gap: spacing.sm, cursor: "pointer" }}>
    <input
      type="checkbox"
      checked={agreedToTerms}
      onChange={(e) => setAgreedToTerms(e.target.checked)}
      required
    />
    <span style={{ fontSize: typography.fontSizes.sm }}>
      I agree to the{" "}
      <a href="/terms" target="_blank" style={{ color: theme.accent }}>
        Terms of Service
      </a>
    </span>
  </label>

  <label style={{ display: "flex", gap: spacing.sm, cursor: "pointer", marginTop: spacing.sm }}>
    <input
      type="checkbox"
      checked={agreedToPrivacy}
      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
      required
    />
    <span style={{ fontSize: typography.fontSizes.sm }}>
      I agree to the{" "}
      <a href="/privacy" target="_blank" style={{ color: theme.accent }}>
        Privacy Policy
      </a>
    </span>
  </label>

  <label style={{ display: "flex", gap: spacing.sm, cursor: "pointer", marginTop: spacing.sm }}>
    <input
      type="checkbox"
      checked={consentToEmails}
      onChange={(e) => setConsentToEmails(e.target.checked)}
    />
    <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
      I want to receive helpful tips and updates (optional)
    </span>
  </label>
</div>

// Disable submit if not agreed
<button
  type="submit"
  disabled={loading || !agreedToTerms || !agreedToPrivacy}
  style={{
    ...components.button,
    ...components.buttonPrimary,
    opacity: (!agreedToTerms || !agreedToPrivacy) ? 0.5 : 1,
  }}
>
  Create Account
</button>
```

Store consent in database:
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS marketing_emails_consent BOOLEAN DEFAULT false;
```

**Files to modify:**
- `/app/signup/page.js`
- `/app/api/signup/route.js`
- Database migration

**Estimated time:** 2 hours

---

### ✅ Task 2.5: Data Export Feature
**Action:**
1. Create `/app/api/export-data/route.js`:
```javascript
export async function GET(request) {
  // Authenticate user
  // Fetch ALL user data from database
  // Return as downloadable JSON

  const userData = {
    profile: { /* ... */ },
    conversations: [ /* ... */ ],
    notes: [ /* ... */ ],
    patterns: [ /* ... */ ],
    exportedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(userData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nervi-data-${Date.now()}.json"`,
    },
  });
}
```

2. Add "Download My Data" button to `/app/profile/page.js`:
```javascript
<button onClick={handleExportData}>
  Download All My Data (JSON)
</button>
```

**Files to create:**
- `/app/api/export-data/route.js`

**Files to modify:**
- `/app/profile/page.js`

**Estimated time:** 2-3 hours

---

## Phase 3: Enhanced Security (Week 3)
**Priority: MEDIUM - Best practices for launch**

### ✅ Task 3.1: Add Security Headers
**Action:**
Update `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

**Files to modify:** `next.config.js`
**Estimated time:** 30 minutes

---

### ✅ Task 3.2: Input Validation & Sanitization
**Action:**
1. Install: `npm install validator dompurify`

2. Create `/lib/validation.js`:
```javascript
import validator from 'validator';

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  return validator.trim(input)
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 10000); // Limit length
}

export function isValidEmail(email) {
  return validator.isEmail(email);
}

export function isValidUsername(username) {
  // 3-30 chars, alphanumeric + underscore/dash
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}
```

3. Apply to all form inputs in API routes

**Files to create:** `/lib/validation.js`
**Files to modify:** All API routes that accept user input
**Estimated time:** 3 hours

---

### ✅ Task 3.3: Database Connection Pooling
**Action:**
Review Supabase connection settings:
```javascript
// In all API routes using Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-application-name': 'nervi-app' },
  },
});

// Add connection pool limits in Supabase dashboard
// Max connections: 15 (for free tier) or 50 (paid)
```

**Files to modify:** All API routes with database calls
**Estimated time:** 1 hour

---

### ✅ Task 3.4: Implement Audit Logging
**Action:**
Create audit log for critical actions:
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  action TEXT NOT NULL, -- 'login', 'password_change', 'data_export', 'account_delete'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

Log these events:
- Login attempts (success/fail)
- Password changes
- Data exports
- Account deletions
- Promo code applications
- Profile changes

**Files to create:**
- `audit-logs.sql`
- `/lib/audit.js`

**Estimated time:** 2-3 hours

---

### ✅ Task 3.5: Add MFA (Optional but Recommended)
**Action:**
1. Install: `npm install @auth/core speakeasy qrcode`

2. Add MFA setup page
3. Store MFA secret in database
4. Require MFA code at login

**Priority:** Medium (can be post-launch)
**Estimated time:** 4-6 hours

---

## Phase 4: Infrastructure & Monitoring (Week 4)
**Priority: MEDIUM - Production readiness**

### ✅ Task 4.1: Error Monitoring
**Action:**
1. Sign up for Sentry (free tier)
2. Install: `npm install @sentry/nextjs`
3. Configure:
```bash
npx @sentry/wizard -i nextjs
```

4. Add to all API routes:
```javascript
import * as Sentry from '@sentry/nextjs';

try {
  // ... code
} catch (error) {
  Sentry.captureException(error);
  // Return error to user
}
```

**Estimated time:** 2 hours
**Cost:** Free tier (5k errors/month)

---

### ✅ Task 4.2: Uptime Monitoring
**Options:**
- BetterUptime (free)
- UptimeRobot (free)
- Pingdom

Monitor:
- Main app (https://nervi-app.com)
- API endpoints (/api/health)
- Database connectivity

**Estimated time:** 1 hour
**Cost:** Free

---

### ✅ Task 4.3: Database Backups
**Action:**
1. Enable Supabase daily backups (free tier: 7 days retention)
2. Set up point-in-time recovery (paid tier)
3. Test restore process

**In Supabase Dashboard:**
- Settings → Database → Backups
- Enable automatic backups

**Estimated time:** 30 minutes
**Cost:** Free (7-day retention)

---

### ✅ Task 4.4: Incident Response Plan
**Action:**
Create `/INCIDENT_RESPONSE.md`:
```markdown
# Security Incident Response Plan

## Severity Levels
- P0: Data breach, complete outage
- P1: Partial outage, security vulnerability
- P2: Degraded performance
- P3: Minor issue

## P0 Response (Data Breach)
1. Immediately rotate all secrets (30 min)
2. Identify affected users (1 hour)
3. Notify affected users within 72 hours (GDPR requirement)
4. Document breach details
5. Contact authorities if needed

## Contact Chain
- Technical Lead: [Your email]
- Legal: [Lawyer email]
- Support: support@nervi-app.com

## Communication Templates
[Include email templates for breach notification]
```

**Files to create:** `/INCIDENT_RESPONSE.md`
**Estimated time:** 2 hours

---

### ✅ Task 4.5: Create Health Check Endpoint
**Action:**
Create `/app/api/health/route.js`:
```javascript
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok', // Test DB connection
      ai: 'ok', // Test AI API
    }
  };

  try {
    // Test database
    await supabase.from('users').select('count').limit(1);

    // Return health status
    return NextResponse.json(health);
  } catch (error) {
    health.status = 'error';
    health.checks.database = 'error';
    return NextResponse.json(health, { status: 503 });
  }
}
```

**Files to create:** `/app/api/health/route.js`
**Estimated time:** 30 minutes

---

## Phase 5: Pre-Launch Checklist

### Security Audit
- [ ] All console.logs sanitized
- [ ] Rate limiting on auth endpoints
- [ ] Strong password requirements
- [ ] Secure session management
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Input validation on all forms
- [ ] Environment variables secured
- [ ] Database connections secure
- [ ] Audit logging implemented

### Privacy & Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner
- [ ] Signup consent checkboxes
- [ ] Data export feature
- [ ] Account deletion works
- [ ] Email opt-in/out
- [ ] "Not medical advice" disclaimer prominent

### Infrastructure
- [ ] Sentry error tracking
- [ ] Uptime monitoring
- [ ] Database backups enabled
- [ ] Health check endpoint
- [ ] Incident response plan
- [ ] All environment variables in Vercel
- [ ] Production database (not dev)

### User Experience
- [ ] Password requirements shown
- [ ] Error messages user-friendly (no stack traces)
- [ ] Success messages for all actions
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Accessibility tested

### Testing
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset
- [ ] Test data export
- [ ] Test account deletion
- [ ] Test promo codes
- [ ] Test on mobile devices
- [ ] Test in production environment

---

## Timeline Summary

**Week 1: Critical Security** (20-25 hours)
- Secure logging
- Password requirements
- Rate limiting
- Session management
- Environment audit

**Week 2: Privacy & Legal** (15-20 hours)
- Privacy policy
- Terms of service
- Cookie consent
- Signup consent
- Data export

**Week 3: Enhanced Security** (12-15 hours)
- Security headers
- Input validation
- Audit logging
- Connection pooling

**Week 4: Infrastructure** (8-10 hours)
- Error monitoring
- Uptime monitoring
- Backups
- Incident plan
- Health checks

**Total: 55-70 hours** (about 3-4 weeks of focused work)

---

## Quick Wins (If Short on Time)

**Minimum Viable Security (1 week):**
1. ✅ Remove all sensitive console.logs (3 hours)
2. ✅ Add rate limiting to login/signup (2 hours)
3. ✅ Privacy policy + Terms (using templates) (4 hours)
4. ✅ Cookie consent banner (1 hour)
5. ✅ Signup consent checkboxes (2 hours)
6. ✅ Security headers (30 min)
7. ✅ Sentry setup (2 hours)
8. ✅ Database backups enabled (30 min)

**Total: ~15 hours for basic compliance**

---

## Costs Estimate

**Free Tier:**
- Sentry: Free (5k errors/month)
- Uptime monitoring: Free
- Supabase: Free tier (500MB database)
- Vercel: Free tier
**Total: $0/month**

**Recommended Paid:**
- Supabase Pro: $25/month (better performance, backups)
- Terms/Privacy legal review: $500-2000 one-time
**Total: ~$25/month + one-time legal**

---

## Post-Launch Ongoing

**Monthly:**
- [ ] Review error logs (Sentry)
- [ ] Check uptime reports
- [ ] Verify backups working
- [ ] Review audit logs for suspicious activity
- [ ] Update dependencies (`npm audit`)

**Quarterly:**
- [ ] Security audit
- [ ] Review and update privacy policy
- [ ] Test incident response plan
- [ ] Review user feedback on privacy/security

**Annually:**
- [ ] Legal review of terms/privacy
- [ ] Penetration testing (optional)
- [ ] Compliance audit

---

## Resources & Tools

**Free Security Tools:**
- Mozilla Observatory (scan your site)
- SSL Labs (test HTTPS)
- OWASP ZAP (security testing)
- npm audit (dependency vulnerabilities)

**Legal Templates:**
- Termly (privacy policy generator)
- iubenda (privacy + terms generator)
- Rocket Lawyer (attorney review)

**Monitoring:**
- Sentry (errors)
- BetterUptime (uptime)
- Vercel Analytics (performance)

---

## Questions or Blockers?

**Common Issues:**
1. "How do I write a privacy policy?" → Use Termly template + have lawyer review
2. "Rate limiting not working?" → Make sure it's in middleware, not just API routes
3. "Sentry too noisy?" → Configure sample rate, filter non-critical errors
4. "Users complaining about password requirements?" → Add password strength indicator

---

Ready to start? Let me know which phase you want to tackle first, and I can provide more detailed implementation help for specific tasks!
