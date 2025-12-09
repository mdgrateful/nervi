"use client";

import { spacing, borderRadius, typography, getComponents } from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

export default function TermsPage() {
  const { theme } = useTheme();
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

  const warningBoxStyle = {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    border: "2px solid #F59E0B",
  };

  return (
    <div style={containerStyle}>
      <NerviHeader />
      <SharedNav />

      <div style={contentStyle}>
        <h1 style={headingStyle}>Terms of Service</h1>
        <p style={lastUpdatedStyle}>Last Updated: December 9, 2025</p>

        <div style={highlightBoxStyle}>
          <p style={{ ...paragraphStyle, marginBottom: 0, fontWeight: typography.fontWeights.medium }}>
            By creating an account and using Nervi, you agree to these Terms of Service. Please read them carefully.
          </p>
        </div>

        <h2 style={sectionHeadingStyle}>1. Acceptance of Terms</h2>
        <p style={paragraphStyle}>
          By accessing or using Nervi ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
        </p>
        <p style={paragraphStyle}>
          We may update these Terms from time to time. We will notify you of significant changes by email or through a prominent notice in the app. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>

        <h2 style={sectionHeadingStyle}>2. NOT MEDICAL ADVICE</h2>
        <div style={warningBoxStyle}>
          <p style={{ ...paragraphStyle, marginBottom: spacing.sm, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.lg }}>
            IMPORTANT: Nervi is NOT a Medical Service
          </p>
          <p style={{ ...paragraphStyle, marginBottom: spacing.sm }}>
            Nervi is a <strong>wellness tool</strong> designed to support nervous system awareness and self-regulation. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.
          </p>
          <ul style={{ ...listStyle, marginLeft: spacing.md, marginBottom: spacing.sm }}>
            <li style={listItemStyle}>Our AI is not a licensed therapist, counselor, or healthcare provider</li>
            <li style={listItemStyle}>Conversations with Nervi do not constitute a doctor-patient relationship</li>
            <li style={listItemStyle}>Nervi should not be used in emergency situations or mental health crises</li>
            <li style={listItemStyle}>Always consult a qualified healthcare professional for medical concerns</li>
          </ul>
          <p style={{ ...paragraphStyle, marginBottom: 0, fontWeight: typography.fontWeights.semibold }}>
            IF YOU ARE EXPERIENCING A MENTAL HEALTH CRISIS:<br />
            • Call 988 (National Suicide Prevention Lifeline)<br />
            • Text HOME to 741741 (Crisis Text Line)<br />
            • Call 911 or go to your nearest emergency room
          </p>
        </div>

        <h2 style={sectionHeadingStyle}>3. Eligibility & Account Requirements</h2>
        <p style={paragraphStyle}>To use Nervi, you must:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Be at least 13 years old (users under 18 must have parental consent)</li>
          <li style={listItemStyle}>Provide accurate, current, and complete account information</li>
          <li style={listItemStyle}>Maintain the security of your account password</li>
          <li style={listItemStyle}>Notify us immediately of any unauthorized access</li>
          <li style={listItemStyle}>Agree to our <a href="/privacy" style={linkStyle}>Privacy Policy</a></li>
        </ul>
        <p style={paragraphStyle}>
          You are responsible for all activity that occurs under your account. Do not share your account credentials with others.
        </p>

        <h2 style={sectionHeadingStyle}>4. Acceptable Use Policy</h2>
        <h3 style={subsectionHeadingStyle}>4.1 You May Use Nervi To:</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Track your nervous system patterns and check-ins</li>
          <li style={listItemStyle}>Engage with our AI for wellness support and self-reflection</li>
          <li style={listItemStyle}>Manage personal notes and insights</li>
          <li style={listItemStyle}>Explore somatic practices and nervous system regulation techniques</li>
        </ul>

        <h3 style={subsectionHeadingStyle}>4.2 You May NOT:</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Use Nervi for any illegal, harmful, or fraudulent purpose</li>
          <li style={listItemStyle}>Attempt to hack, reverse engineer, or compromise the Service</li>
          <li style={listItemStyle}>Share explicit, violent, or harmful content</li>
          <li style={listItemStyle}>Abuse, harass, or threaten others (including our AI)</li>
          <li style={listItemStyle}>Create multiple accounts to circumvent restrictions</li>
          <li style={listItemStyle}>Use automated tools (bots, scrapers) without permission</li>
          <li style={listItemStyle}>Violate any laws or third-party rights</li>
          <li style={listItemStyle}>Use Nervi to diagnose, treat, or cure medical conditions</li>
        </ul>

        <p style={paragraphStyle}>
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>

        <h2 style={sectionHeadingStyle}>5. Subscription & Payment Terms</h2>
        <h3 style={subsectionHeadingStyle}>5.1 Free Tier</h3>
        <p style={paragraphStyle}>
          Nervi offers a free tier with access to basic features. We may modify free tier features at any time.
        </p>

        <h3 style={subsectionHeadingStyle}>5.2 Paid Subscriptions</h3>
        <p style={paragraphStyle}>
          Paid subscriptions ("Basic" and "Premium") provide additional features:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>7-Day Free Trial:</strong> New subscribers receive a 7-day trial. Cancel anytime during the trial to avoid charges.</li>
          <li style={listItemStyle}><strong>Recurring Billing:</strong> Subscriptions automatically renew monthly until canceled</li>
          <li style={listItemStyle}><strong>Payment Processing:</strong> Handled securely by Stripe</li>
          <li style={listItemStyle}><strong>Price Changes:</strong> We will notify you 30 days before any price increase</li>
        </ul>

        <h3 style={subsectionHeadingStyle}>5.3 Cancellation & Refunds</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Cancel anytime from your <a href="/profile" style={linkStyle}>Profile Settings</a></li>
          <li style={listItemStyle}>Cancellations take effect at the end of the current billing period</li>
          <li style={listItemStyle}>No refunds for partial months (except as required by law)</li>
          <li style={listItemStyle}>If we terminate your account for Terms violations, no refund will be issued</li>
        </ul>

        <h3 style={subsectionHeadingStyle}>5.4 Promo Codes</h3>
        <p style={paragraphStyle}>
          Promo codes may grant free access to paid features. Codes are non-transferable, have expiration dates, and may be limited to one use per user. We reserve the right to revoke promo code benefits if misused.
        </p>

        <h2 style={sectionHeadingStyle}>6. Intellectual Property</h2>
        <h3 style={subsectionHeadingStyle}>6.1 Your Content</h3>
        <p style={paragraphStyle}>
          You retain ownership of all content you create in Nervi (messages, notes, reflections). By using the Service, you grant us a license to:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Store and process your content to provide the Service</li>
          <li style={listItemStyle}>Use anonymized, aggregated data to improve our AI and features</li>
        </ul>
        <p style={paragraphStyle}>
          We will NOT share your personal conversations or identifiable data with third parties for marketing or advertising purposes.
        </p>

        <h3 style={subsectionHeadingStyle}>6.2 Our Content</h3>
        <p style={paragraphStyle}>
          The Service, including its design, code, AI responses, and educational content, is owned by Nervi and protected by copyright, trademark, and other laws. You may not copy, modify, or distribute our content without permission.
        </p>

        <h2 style={sectionHeadingStyle}>7. AI-Generated Content</h2>
        <p style={paragraphStyle}>
          Nervi uses AI (Anthropic's Claude) to generate responses. Please understand:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>AI responses may occasionally be inaccurate, incomplete, or inappropriate</li>
          <li style={listItemStyle}>We do not guarantee the accuracy or suitability of AI-generated content</li>
          <li style={listItemStyle}>AI responses are for informational purposes only, not professional advice</li>
          <li style={listItemStyle}>You use AI-generated content at your own risk</li>
        </ul>

        <h2 style={sectionHeadingStyle}>8. Disclaimers & Limitation of Liability</h2>
        <h3 style={subsectionHeadingStyle}>8.1 "As Is" Service</h3>
        <p style={paragraphStyle}>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee that Nervi will be uninterrupted, error-free, or completely secure.
        </p>

        <h3 style={subsectionHeadingStyle}>8.2 Limitation of Liability</h3>
        <p style={paragraphStyle}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NERVI SHALL NOT BE LIABLE FOR:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Indirect, incidental, special, or consequential damages</li>
          <li style={listItemStyle}>Loss of data, profits, or business opportunities</li>
          <li style={listItemStyle}>Damages arising from reliance on AI-generated content</li>
          <li style={listItemStyle}>Third-party service failures (Supabase, Anthropic, Stripe, etc.)</li>
        </ul>
        <p style={paragraphStyle}>
          Our total liability to you shall not exceed the amount you paid for the Service in the 12 months prior to the claim (or $100 if you used only the free tier).
        </p>

        <h3 style={subsectionHeadingStyle}>8.3 Health Disclaimer</h3>
        <p style={paragraphStyle}>
          NERVI IS NOT RESPONSIBLE FOR ANY HEALTH OUTCOMES, MEDICAL DECISIONS, OR CONSEQUENCES ARISING FROM YOUR USE OF THE SERVICE. Always consult healthcare professionals for medical advice.
        </p>

        <h2 style={sectionHeadingStyle}>9. Data & Privacy</h2>
        <p style={paragraphStyle}>
          Your use of Nervi is also governed by our <a href="/privacy" style={linkStyle}>Privacy Policy</a>, which explains how we collect, use, and protect your data.
        </p>
        <p style={paragraphStyle}>Key points:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>We do NOT sell your data</li>
          <li style={listItemStyle}>You can delete your account and data at any time</li>
          <li style={listItemStyle}>We use encryption and security best practices</li>
          <li style={listItemStyle}>Your messages are sent to Anthropic's Claude AI for processing</li>
        </ul>

        <h2 style={sectionHeadingStyle}>10. Account Termination</h2>
        <h3 style={subsectionHeadingStyle}>10.1 Your Right to Terminate</h3>
        <p style={paragraphStyle}>
          You may delete your account at any time from your <a href="/profile" style={linkStyle}>Profile Settings</a>. All your data will be permanently deleted within 30 days.
        </p>

        <h3 style={subsectionHeadingStyle}>10.2 Our Right to Terminate</h3>
        <p style={paragraphStyle}>
          We may suspend or terminate your account if you:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Violate these Terms of Service</li>
          <li style={listItemStyle}>Engage in fraudulent or illegal activity</li>
          <li style={listItemStyle}>Abuse the Service or harm other users</li>
          <li style={listItemStyle}>Fail to pay subscription fees</li>
        </ul>
        <p style={paragraphStyle}>
          We will provide notice when possible, but reserve the right to terminate immediately for serious violations.
        </p>

        <h2 style={sectionHeadingStyle}>11. Indemnification</h2>
        <p style={paragraphStyle}>
          You agree to indemnify and hold harmless Nervi, its employees, and service providers from any claims, damages, or expenses arising from:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Your use of the Service</li>
          <li style={listItemStyle}>Your violation of these Terms</li>
          <li style={listItemStyle}>Your violation of any third-party rights</li>
          <li style={listItemStyle}>Your content or actions on the platform</li>
        </ul>

        <h2 style={sectionHeadingStyle}>12. Dispute Resolution</h2>
        <h3 style={subsectionHeadingStyle}>12.1 Governing Law</h3>
        <p style={paragraphStyle}>
          These Terms are governed by the laws of the United States and the State of [Your State], without regard to conflict of law principles.
        </p>

        <h3 style={subsectionHeadingStyle}>12.2 Arbitration</h3>
        <p style={paragraphStyle}>
          Any disputes arising from these Terms or your use of Nervi shall be resolved through binding arbitration, except for:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Small claims court disputes (under $10,000)</li>
          <li style={listItemStyle}>Intellectual property disputes</li>
          <li style={listItemStyle}>Injunctive relief claims</li>
        </ul>
        <p style={paragraphStyle}>
          You waive your right to a jury trial and class action lawsuits.
        </p>

        <h2 style={sectionHeadingStyle}>13. Severability</h2>
        <p style={paragraphStyle}>
          If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full effect.
        </p>

        <h2 style={sectionHeadingStyle}>14. Entire Agreement</h2>
        <p style={paragraphStyle}>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and Nervi regarding the Service.
        </p>

        <h2 style={sectionHeadingStyle}>15. Contact Us</h2>
        <p style={paragraphStyle}>
          If you have questions about these Terms, contact us:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Email:</strong> <a href="mailto:legal@nervi-app.com" style={linkStyle}>legal@nervi-app.com</a></li>
          <li style={listItemStyle}><strong>Support:</strong> <a href="mailto:support@nervi-app.com" style={linkStyle}>support@nervi-app.com</a></li>
        </ul>

        <div style={{ ...highlightBoxStyle, marginTop: spacing.xl }}>
          <p style={{ ...paragraphStyle, marginBottom: 0, textAlign: "center", fontWeight: typography.fontWeights.medium }}>
            By using Nervi, you acknowledge that you have read, understood, and agree to these Terms of Service.
          </p>
        </div>

        <p style={{ ...paragraphStyle, textAlign: "center", marginTop: spacing.xl, color: theme.textSecondary, fontSize: typography.fontSizes.sm }}>
          Thank you for being part of the Nervi community.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
