"use client";

import CookieConsent from "react-cookie-consent";

export function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="nervi-cookie-consent"
      style={{
        background: "#1F2937",
        padding: "16px 20px",
        alignItems: "center",
        fontSize: "14px",
      }}
      buttonStyle={{
        background: "#6366F1",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: "500",
        borderRadius: "6px",
        padding: "10px 20px",
        margin: "0 8px",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#9CA3AF",
        fontSize: "14px",
        fontWeight: "500",
        borderRadius: "6px",
        padding: "10px 20px",
        border: "1px solid #4B5563",
      }}
      expires={365}
      onAccept={() => {
        // Track consent acceptance
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("nervi-analytics-consent", "true");
        }
      }}
      onDecline={() => {
        // Track consent decline
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("nervi-analytics-consent", "false");
        }
      }}
    >
      <span style={{ flex: 1, maxWidth: "700px" }}>
        We use cookies to improve your experience and remember your preferences.{" "}
        <a
          href="/privacy"
          style={{
            color: "#6366F1",
            textDecoration: "underline",
            fontWeight: "500",
          }}
        >
          Learn more in our Privacy Policy
        </a>
      </span>
    </CookieConsent>
  );
}
