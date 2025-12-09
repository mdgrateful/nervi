/**
 * Audit Logging System
 *
 * Provides comprehensive audit trails for security-sensitive operations.
 * Ready for compliance requirements (GDPR, SOC 2, HIPAA).
 *
 * Usage:
 *   import { auditLog } from '../lib/auditLog';
 *   auditLog.loginSuccess(userId, request);
 *   auditLog.accountDeleted(userId, request);
 */

import { createClient } from "@supabase/supabase-js";
import { sanitizeForLog } from "./logger";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

/**
 * Extract client IP address from request
 */
function getClientIP(request) {
  if (!request) return "unknown";

  // Try multiple headers (behind proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

/**
 * Extract user agent from request
 */
function getUserAgent(request) {
  if (!request) return "unknown";
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Core audit log function
 * Logs to database (production) or console (development)
 */
async function logAuditEvent(eventType, userId, details, request) {
  const timestamp = new Date().toISOString();
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  const auditEntry = {
    timestamp,
    event_type: eventType,
    user_id: userId || null,
    ip_address: ipAddress,
    user_agent: userAgent,
    details: sanitizeForLog(details),
    environment: process.env.NODE_ENV || "development",
  };

  // In development, log to console
  if (process.env.NODE_ENV !== "production") {
    console.log("[AUDIT]", JSON.stringify(auditEntry, null, 2));
    return;
  }

  // In production, store in database
  if (supabase) {
    try {
      await supabase.from("audit_logs").insert([auditEntry]);
    } catch (error) {
      // Fallback to console if database write fails
      console.error("[AUDIT-ERROR] Failed to write audit log:", error);
      console.log("[AUDIT-FALLBACK]", JSON.stringify(auditEntry, null, 2));
    }
  } else {
    // Fallback if Supabase not configured
    console.log("[AUDIT]", JSON.stringify(auditEntry, null, 2));
  }
}

/**
 * Authentication Events
 */
export const auditLog = {
  // Login events
  loginSuccess: (userId, request) => {
    logAuditEvent("auth.login.success", userId, { action: "User logged in successfully" }, request);
  },

  loginFailed: (identifier, reason, request) => {
    logAuditEvent(
      "auth.login.failed",
      null,
      { action: "Login attempt failed", identifier: sanitizeForLog(identifier), reason },
      request
    );
  },

  logout: (userId, request) => {
    logAuditEvent("auth.logout", userId, { action: "User logged out" }, request);
  },

  sessionExpired: (userId, request) => {
    logAuditEvent("auth.session.expired", userId, { action: "Session expired" }, request);
  },

  // Account management
  accountCreated: (userId, username, request) => {
    logAuditEvent(
      "account.created",
      userId,
      { action: "New account created", username: sanitizeForLog(username) },
      request
    );
  },

  accountDeleted: (userId, username, request) => {
    logAuditEvent(
      "account.deleted",
      userId,
      { action: "Account permanently deleted", username: sanitizeForLog(username) },
      request
    );
  },

  accountUpdated: (userId, fields, request) => {
    logAuditEvent(
      "account.updated",
      userId,
      { action: "Account information updated", fields: Object.keys(fields) },
      request
    );
  },

  // Password events
  passwordChanged: (userId, request) => {
    logAuditEvent("password.changed", userId, { action: "Password changed successfully" }, request);
  },

  passwordResetRequested: (userId, request) => {
    logAuditEvent("password.reset.requested", userId, { action: "Password reset requested" }, request);
  },

  passwordResetCompleted: (userId, request) => {
    logAuditEvent("password.reset.completed", userId, { action: "Password reset completed" }, request);
  },

  passwordResetFailed: (reason, request) => {
    logAuditEvent(
      "password.reset.failed",
      null,
      { action: "Password reset failed", reason },
      request
    );
  },

  // Data access events
  dataExported: (userId, dataTypes, request) => {
    logAuditEvent(
      "data.exported",
      userId,
      { action: "User data exported", dataTypes },
      request
    );
  },

  sensitiveDataAccessed: (userId, dataType, request) => {
    logAuditEvent(
      "data.accessed",
      userId,
      { action: "Sensitive data accessed", dataType },
      request
    );
  },

  // Payment events
  subscriptionCreated: (userId, tier, request) => {
    logAuditEvent(
      "subscription.created",
      userId,
      { action: "Subscription created", tier },
      request
    );
  },

  subscriptionUpdated: (userId, oldTier, newTier, request) => {
    logAuditEvent(
      "subscription.updated",
      userId,
      { action: "Subscription tier changed", oldTier, newTier },
      request
    );
  },

  subscriptionCanceled: (userId, tier, request) => {
    logAuditEvent(
      "subscription.canceled",
      userId,
      { action: "Subscription canceled", tier },
      request
    );
  },

  promoCodeApplied: (userId, code, request) => {
    logAuditEvent(
      "promo.applied",
      userId,
      { action: "Promo code applied", code: sanitizeForLog(code) },
      request
    );
  },

  // Security events
  rateLimitExceeded: (identifier, endpoint, request) => {
    logAuditEvent(
      "security.rate_limit.exceeded",
      null,
      { action: "Rate limit exceeded", identifier: sanitizeForLog(identifier), endpoint },
      request
    );
  },

  invalidTokenDetected: (tokenType, request) => {
    logAuditEvent(
      "security.invalid_token",
      null,
      { action: "Invalid token detected", tokenType },
      request
    );
  },

  suspiciousActivity: (userId, activityType, details, request) => {
    logAuditEvent(
      "security.suspicious",
      userId,
      { action: "Suspicious activity detected", activityType, ...details },
      request
    );
  },

  // Permission/authorization events
  unauthorizedAccess: (userId, resource, request) => {
    logAuditEvent(
      "security.unauthorized",
      userId,
      { action: "Unauthorized access attempt", resource },
      request
    );
  },

  // Admin events
  adminAction: (adminUserId, action, targetUserId, request) => {
    logAuditEvent(
      "admin.action",
      adminUserId,
      { action: "Admin action performed", adminAction: action, targetUserId: sanitizeForLog(targetUserId) },
      request
    );
  },

  // Compliance events
  consentGranted: (userId, consentType, request) => {
    logAuditEvent(
      "compliance.consent.granted",
      userId,
      { action: "User consent granted", consentType },
      request
    );
  },

  consentRevoked: (userId, consentType, request) => {
    logAuditEvent(
      "compliance.consent.revoked",
      userId,
      { action: "User consent revoked", consentType },
      request
    );
  },

  gdprDataRequest: (userId, requestType, request) => {
    logAuditEvent(
      "compliance.gdpr.request",
      userId,
      { action: "GDPR data request", requestType },
      request
    );
  },
};

/**
 * Database schema for audit_logs table (run this in Supabase):
 *
 * CREATE TABLE audit_logs (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   event_type TEXT NOT NULL,
 *   user_id TEXT,
 *   ip_address TEXT,
 *   user_agent TEXT,
 *   details JSONB,
 *   environment TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
 * CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
 * CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
 *
 * -- Set up Row Level Security (RLS)
 * ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 *
 * -- Only allow service role to write (API routes)
 * CREATE POLICY "Service role can insert audit logs" ON audit_logs
 *   FOR INSERT
 *   TO service_role
 *   WITH CHECK (true);
 *
 * -- Only admins can read audit logs
 * CREATE POLICY "Admins can read audit logs" ON audit_logs
 *   FOR SELECT
 *   USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
 */
