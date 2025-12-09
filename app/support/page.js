"use client";

import { useState, useEffect } from "react";
import { lightTheme, darkTheme, spacing, borderRadius, typography } from "../design-system";

export default function SupportPage() {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("nervi_theme");
      if (savedTheme === "dark") {
        setTheme(darkTheme);
      }
    }
  }, []);

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: theme.background,
    color: theme.textPrimary,
    padding: spacing.xl,
  };

  const contentStyle = {
    maxWidth: "800px",
    margin: "0 auto",
  };

  const headingStyle = {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: typography.fontWeights.bold,
    color: theme.textPrimary,
    marginBottom: spacing.lg,
  };

  const sectionHeadingStyle = {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: theme.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  };

  const paragraphStyle = {
    fontSize: typography.fontSizes.base,
    color: theme.textSecondary,
    lineHeight: "1.6",
    marginBottom: spacing.md,
  };

  const boxStyle = {
    background: theme.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    border: `1px solid ${theme.border}`,
    marginBottom: spacing.xl,
  };

  const linkStyle = {
    color: theme.accent,
    textDecoration: "none",
    fontWeight: typography.fontWeights.medium,
  };

  const listStyle = {
    marginLeft: spacing.lg,
    marginBottom: spacing.md,
  };

  const listItemStyle = {
    marginBottom: spacing.sm,
    lineHeight: "1.6",
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={headingStyle}>Support & Contact</h1>

        <div style={boxStyle}>
          <h2 style={sectionHeadingStyle}>Get Help</h2>
          <p style={paragraphStyle}>
            Need assistance with Nervi? We're here to help. Choose the best way to reach us based on your needs:
          </p>

          <ul style={listStyle}>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>General Support:</strong>{" "}
              <a href="mailto:support@nervi-app.com" style={linkStyle}>support@nervi-app.com</a>
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Privacy Questions:</strong>{" "}
              <a href="mailto:privacy@nervi-app.com" style={linkStyle}>privacy@nervi-app.com</a>
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Legal Inquiries:</strong>{" "}
              <a href="mailto:legal@nervi-app.com" style={linkStyle}>legal@nervi-app.com</a>
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Security Issues:</strong>{" "}
              <a href="mailto:security@nervi-app.com" style={linkStyle}>security@nervi-app.com</a>
            </li>
          </ul>
        </div>

        <div style={boxStyle}>
          <h2 style={sectionHeadingStyle}>Common Questions</h2>

          <h3 style={{ ...sectionHeadingStyle, fontSize: typography.fontSizes.lg, marginTop: spacing.lg }}>
            How do I manage my subscription?
          </h3>
          <p style={paragraphStyle}>
            Visit your <a href="/profile" style={linkStyle}>Profile Settings</a> to manage your subscription,
            cancel, or update payment information.
          </p>

          <h3 style={{ ...sectionHeadingStyle, fontSize: typography.fontSizes.lg, marginTop: spacing.lg }}>
            How do I delete my account?
          </h3>
          <p style={paragraphStyle}>
            Go to <a href="/profile" style={linkStyle}>Profile Settings</a> and scroll to the bottom.
            Click "Delete Account" to permanently remove all your data. This action cannot be undone.
          </p>

          <h3 style={{ ...sectionHeadingStyle, fontSize: typography.fontSizes.lg, marginTop: spacing.lg }}>
            Is my data private and secure?
          </h3>
          <p style={paragraphStyle}>
            Yes. We use industry-standard encryption, do not sell your data, and comply with GDPR and CCPA.
            Read our <a href="/privacy" style={linkStyle}>Privacy Policy</a> for full details.
          </p>

          <h3 style={{ ...sectionHeadingStyle, fontSize: typography.fontSizes.lg, marginTop: spacing.lg }}>
            Can I export my data?
          </h3>
          <p style={paragraphStyle}>
            Data export functionality is coming soon. In the meantime, contact{" "}
            <a href="mailto:support@nervi-app.com" style={linkStyle}>support@nervi-app.com</a> to request your data.
          </p>
        </div>

        <div
          style={{
            ...boxStyle,
            border: `2px solid ${theme.warning || "#f59e0b"}`,
            background: theme.background,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
            <div style={{ fontSize: "24px" }}>⚠️</div>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>In Case of Emergency</h2>
          </div>

          <p style={{ ...paragraphStyle, color: theme.textPrimary, fontWeight: typography.fontWeights.semibold }}>
            Nervi is NOT a crisis service and cannot provide emergency support.
          </p>

          <p style={paragraphStyle}>
            If you are in immediate danger, thinking about harming yourself or others, or experiencing a mental health crisis:
          </p>

          <ul style={listStyle}>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Call 988</strong> - National Suicide Prevention Lifeline (U.S.)
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Text HOME to 741741</strong> - Crisis Text Line
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Call 1-800-662-4357</strong> - SAMHSA National Helpline
            </li>
            <li style={listItemStyle}>
              <strong style={{ color: theme.textPrimary }}>Call 911</strong> or go to your nearest emergency room
            </li>
          </ul>
        </div>

        <div style={boxStyle}>
          <h2 style={sectionHeadingStyle}>About Nervi</h2>
          <p style={paragraphStyle}>
            Nervi is a trauma-aware, nervous-system-focused AI companion designed to help you feel less overwhelmed
            and more grounded in daily life. We are <strong style={{ color: theme.textPrimary }}>not</strong> a
            substitute for professional medical care, therapy, or diagnosis.
          </p>
          <p style={paragraphStyle}>
            Read more in our <a href="/terms" style={linkStyle}>Terms of Service</a> and{" "}
            <a href="/privacy" style={linkStyle}>Privacy Policy</a>.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: spacing.xl, color: theme.textMuted, fontSize: typography.fontSizes.sm }}>
          <p>Version 1.0.0</p>
          <p>
            <a href="/" style={linkStyle}>← Back to Nervi</a>
          </p>
        </div>
      </div>
    </div>
  );
}
