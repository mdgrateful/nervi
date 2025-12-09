"use client";

import { spacing, borderRadius, typography, getComponents } from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

export default function PrivacyPage() {
  const { theme } = useTheme();

  // Safety check for SSR/build time
  if (!theme) return null;

  const components = getComponents(theme);

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: theme.background,
    color: theme.text,
    paddingBottom: "80px",
  };

  const contentStyle = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: spacing.lg,
  };

  const headingStyle = {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.lg,
    color: theme.accent,
  };

  const sectionHeadingStyle = {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    color: theme.text,
  };

  const subsectionHeadingStyle = {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: theme.textSecondary,
  };

  const paragraphStyle = {
    fontSize: typography.fontSizes.base,
    lineHeight: "1.6",
    marginBottom: spacing.md,
    color: theme.text,
  };

  const listStyle = {
    marginLeft: spacing.lg,
    marginBottom: spacing.md,
    color: theme.text,
  };

  const listItemStyle = {
    marginBottom: spacing.sm,
    lineHeight: "1.6",
  };

  const linkStyle = {
    color: theme.accent,
    textDecoration: "underline",
  };

  const lastUpdatedStyle = {
    fontSize: typography.fontSizes.sm,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
    fontStyle: "italic",
  };

  const highlightBoxStyle = {
    backgroundColor: theme.surfaceHover,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    border: `1px solid ${theme.border}`,
  };

  return (
    <div style={containerStyle}>
      <NerviHeader />
      <SharedNav />

      <div style={contentStyle}>
        <h1 style={headingStyle}>Privacy Policy</h1>
        <p style={lastUpdatedStyle}>Last Updated: December 9, 2025</p>

        <div style={highlightBoxStyle}>
          <p style={{ ...paragraphStyle, marginBottom: 0, fontWeight: typography.fontWeights.medium }}>
            Your privacy is important to us. Nervi is committed to protecting your personal information and being transparent about how we collect, use, and share your data.
          </p>
        </div>

        <h2 style={sectionHeadingStyle}>1. Information We Collect</h2>

        <h3 style={subsectionHeadingStyle}>1.1 Information You Provide</h3>
        <p style={paragraphStyle}>When you create an account and use Nervi, we collect:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Account Information:</strong> Username, email address, and encrypted password</li>
          <li style={listItemStyle}><strong>Profile Data:</strong> State/location, work hours, notification preferences, profile picture (optional)</li>
          <li style={listItemStyle}><strong>Conversation Data:</strong> Messages you exchange with our AI, including questions, responses, and check-in data</li>
          <li style={listItemStyle}><strong>Notes & Insights:</strong> Personal notes, reflections, and patterns you track in the app</li>
          <li style={listItemStyle}><strong>Payment Information:</strong> If you subscribe to a paid plan, payment details are processed by Stripe (we do not store credit card numbers)</li>
        </ul>

        <h3 style={subsectionHeadingStyle}>1.2 Information Collected Automatically</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Usage Data:</strong> Pages visited, features used, time spent in app</li>
          <li style={listItemStyle}><strong>Device Information:</strong> Browser type, operating system, IP address</li>
          <li style={listItemStyle}><strong>Cookies:</strong> Session cookies for authentication and preferences (see Cookie Policy below)</li>
        </ul>

        <h2 style={sectionHeadingStyle}>2. How We Use Your Information</h2>
        <p style={paragraphStyle}>We use your information to:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Provide Our Services:</strong> Process your conversations with AI, track patterns, send notifications</li>
          <li style={listItemStyle}><strong>Personalize Your Experience:</strong> Tailor responses based on your state, preferences, and nervous system patterns</li>
          <li style={listItemStyle}><strong>Improve Our Services:</strong> Analyze usage patterns (anonymized) to enhance features and user experience</li>
          <li style={listItemStyle}><strong>Communicate With You:</strong> Send service updates, security alerts, and (with your consent) helpful tips</li>
          <li style={listItemStyle}><strong>Ensure Security:</strong> Detect fraud, prevent abuse, and protect user accounts</li>
          <li style={listItemStyle}><strong>Comply With Legal Obligations:</strong> Respond to legal requests and enforce our terms</li>
        </ul>

        <h2 style={sectionHeadingStyle}>3. How We Share Your Information</h2>
        <p style={paragraphStyle}><strong>We do NOT sell your data. Ever.</strong></p>
        <p style={paragraphStyle}>We share your information only with trusted service providers necessary to operate Nervi:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Supabase:</strong> Secure database hosting for your account and conversation data</li>
          <li style={listItemStyle}><strong>Anthropic (Claude AI):</strong> AI processing for conversations (your messages are sent to Claude to generate responses)</li>
          <li style={listItemStyle}><strong>Stripe:</strong> Payment processing for subscriptions (if you upgrade to a paid plan)</li>
          <li style={listItemStyle}><strong>Vercel:</strong> Application hosting and content delivery</li>
          <li style={listItemStyle}><strong>Email Service (Resend):</strong> Transactional emails (password resets, welcome emails) if configured</li>
        </ul>
        <p style={paragraphStyle}>All third-party services are contractually required to protect your data and use it only for providing services to Nervi.</p>

        <h2 style={sectionHeadingStyle}>4. Data Retention</h2>
        <p style={paragraphStyle}>We retain your information for as long as your account is active or as needed to provide services:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Account Data:</strong> Retained until you delete your account</li>
          <li style={listItemStyle}><strong>Conversations:</strong> Retained until you delete them or your account</li>
          <li style={listItemStyle}><strong>Deleted Accounts:</strong> All data is permanently deleted within 30 days of account deletion</li>
          <li style={listItemStyle}><strong>Backups:</strong> May be retained for up to 90 days for disaster recovery purposes</li>
        </ul>

        <h2 style={sectionHeadingStyle}>5. Your Privacy Rights</h2>
        <p style={paragraphStyle}>You have the following rights regarding your data:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Access:</strong> View all data we have about you</li>
          <li style={listItemStyle}><strong>Correction:</strong> Update inaccurate or incomplete information in your profile</li>
          <li style={listItemStyle}><strong>Deletion:</strong> Delete your account and all associated data permanently</li>
          <li style={listItemStyle}><strong>Export:</strong> Download all your data in JSON format (coming soon)</li>
          <li style={listItemStyle}><strong>Opt-Out:</strong> Unsubscribe from marketing emails at any time</li>
          <li style={listItemStyle}><strong>Withdraw Consent:</strong> Change notification preferences in your profile</li>
        </ul>
        <p style={paragraphStyle}>
          To exercise these rights, visit your <a href="/profile" style={linkStyle}>Profile Settings</a> or contact us at{" "}
          <a href="mailto:privacy@nervi-app.com" style={linkStyle}>privacy@nervi-app.com</a>.
        </p>

        <h2 style={sectionHeadingStyle}>6. Data Security</h2>
        <p style={paragraphStyle}>We take security seriously and implement industry-standard measures:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest</li>
          <li style={listItemStyle}><strong>Password Security:</strong> Passwords are hashed using bcrypt with strong salt</li>
          <li style={listItemStyle}><strong>Secure Sessions:</strong> 7-day session expiration with httpOnly, secure cookies</li>
          <li style={listItemStyle}><strong>Rate Limiting:</strong> Protection against brute force attacks</li>
          <li style={listItemStyle}><strong>Regular Audits:</strong> Ongoing security reviews and vulnerability assessments</li>
          <li style={listItemStyle}><strong>Secure Logging:</strong> Sensitive data (passwords, emails) automatically sanitized from logs</li>
        </ul>
        <p style={paragraphStyle}>
          While we implement strong security measures, no system is 100% secure. If you discover a security vulnerability, please report it to{" "}
          <a href="mailto:security@nervi-app.com" style={linkStyle}>security@nervi-app.com</a>.
        </p>

        <h2 style={sectionHeadingStyle}>7. Cookies & Tracking</h2>
        <p style={paragraphStyle}>We use cookies for:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Authentication:</strong> Keep you logged in securely (essential cookies)</li>
          <li style={listItemStyle}><strong>Preferences:</strong> Remember your theme and settings</li>
          <li style={listItemStyle}><strong>Analytics:</strong> Understand how you use Nervi (anonymized)</li>
        </ul>
        <p style={paragraphStyle}>
          You can control cookies through your browser settings. Disabling essential cookies may prevent you from using certain features.
        </p>

        <h2 style={sectionHeadingStyle}>8. Children's Privacy</h2>
        <p style={paragraphStyle}>
          Nervi is not intended for children under 13. We do not knowingly collect information from children. If you believe a child has provided us with personal information, please contact us at{" "}
          <a href="mailto:privacy@nervi-app.com" style={linkStyle}>privacy@nervi-app.com</a>.
        </p>

        <h2 style={sectionHeadingStyle}>9. International Data Transfers</h2>
        <p style={paragraphStyle}>
          Your information may be transferred to and processed in the United States or other countries where our service providers operate. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
        </p>

        <h2 style={sectionHeadingStyle}>10. Changes to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice in the app. The "Last Updated" date at the top indicates when changes were made.
        </p>

        <h2 style={sectionHeadingStyle}>11. GDPR Compliance (EU Users)</h2>
        <p style={paragraphStyle}>If you are in the European Union, you have additional rights under GDPR:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Right to be Forgotten:</strong> Request complete deletion of your data</li>
          <li style={listItemStyle}><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
          <li style={listItemStyle}><strong>Object to Processing:</strong> Object to certain uses of your data</li>
          <li style={listItemStyle}><strong>Restrict Processing:</strong> Limit how we use your data</li>
          <li style={listItemStyle}><strong>Lodge a Complaint:</strong> Contact your local data protection authority</li>
        </ul>
        <p style={paragraphStyle}>
          Our legal basis for processing your data is your consent (when you sign up) and our legitimate interest in providing and improving our services.
        </p>

        <h2 style={sectionHeadingStyle}>12. California Privacy Rights (CCPA)</h2>
        <p style={paragraphStyle}>If you are a California resident, you have the right to:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Know what personal information we collect, use, and share</li>
          <li style={listItemStyle}>Delete your personal information</li>
          <li style={listItemStyle}>Opt-out of the sale of your information (we do not sell your data)</li>
          <li style={listItemStyle}>Non-discrimination for exercising your privacy rights</li>
        </ul>

        <h2 style={sectionHeadingStyle}>13. Contact Us</h2>
        <p style={paragraphStyle}>If you have questions about this Privacy Policy or your data, contact us:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Email:</strong> <a href="mailto:privacy@nervi-app.com" style={linkStyle}>privacy@nervi-app.com</a></li>
          <li style={listItemStyle}><strong>Support:</strong> <a href="mailto:support@nervi-app.com" style={linkStyle}>support@nervi-app.com</a></li>
        </ul>

        <div style={{ ...highlightBoxStyle, marginTop: spacing.xl }}>
          <p style={{ ...paragraphStyle, marginBottom: spacing.sm, fontWeight: typography.fontWeights.semibold }}>
            Important Disclaimer
          </p>
          <p style={{ ...paragraphStyle, marginBottom: 0, fontSize: typography.fontSizes.sm }}>
            Nervi is a wellness tool and is NOT a substitute for professional medical advice, diagnosis, or treatment. Your conversations with our AI are not reviewed by healthcare professionals. If you are experiencing a mental health crisis, please contact the National Suicide Prevention Lifeline at 988 or the Crisis Text Line (text HOME to 741741).
          </p>
        </div>

        <p style={{ ...paragraphStyle, textAlign: "center", marginTop: spacing.xl, color: theme.textSecondary }}>
          Thank you for trusting Nervi with your wellness journey.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
