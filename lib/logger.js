/**
 * Secure Logging Utility for Nervi
 *
 * Best Practices:
 * - Never log passwords, tokens, or sensitive user data
 * - Only log to console in development
 * - In production, send to secure logging service (Sentry, LogRocket, etc.)
 * - Automatically sanitize data before logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sanitize data before logging to remove sensitive fields
 */
function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'password_hash',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'access_token',
    'refresh_token',
    'session',
    'cookie',
    'authorization',
    'credit_card',
    'ssn',
    'email', // Optionally remove in production
    'user_id', // Optionally remove in production
    'userId',
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLog(item));
  }

  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Log informational message
 * Only logs to console in development
 */
export function logInfo(message, metadata = {}) {
  if (isDevelopment) {
    console.log(`[INFO] ${message}`, sanitizeForLog(metadata));
  }

  // TODO: In production, send to logging service like Sentry
  // if (!isDevelopment) {
  //   sentryCaptureMessage(message, 'info', metadata);
  // }
}

/**
 * Log error with automatic sanitization
 * Logs to console in dev, sends to error tracking in production
 */
export function logError(message, error, metadata = {}) {
  const sanitizedError = {
    message: error?.message || 'Unknown error',
    code: error?.code,
    name: error?.name,
    // Do NOT log stack traces or full error objects (may contain sensitive data)
  };

  const sanitizedMetadata = sanitizeForLog(metadata);

  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, sanitizedError, sanitizedMetadata);
  }

  // TODO: In production, send to Sentry or other error tracking
  // if (!isDevelopment) {
  //   Sentry.captureException(error, {
  //     tags: { area: message },
  //     extra: sanitizedMetadata,
  //   });
  // }
}

/**
 * Log warning
 */
export function logWarning(message, metadata = {}) {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, sanitizeForLog(metadata));
  }

  // TODO: Send to monitoring service in production
}

/**
 * Log API request (for audit purposes)
 * Only logs endpoint and status, never logs request body
 */
export function logApiRequest(method, endpoint, statusCode, metadata = {}) {
  const logData = {
    method,
    endpoint,
    statusCode,
    timestamp: new Date().toISOString(),
    ...sanitizeForLog(metadata),
  };

  if (isDevelopment) {
    console.log(`[API] ${method} ${endpoint} - ${statusCode}`, logData);
  }

  // TODO: Send to analytics/monitoring in production
}

/**
 * Log security event for audit trail
 * These should ALWAYS be logged, even in production
 */
export function logSecurityEvent(event, metadata = {}) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeForLog(metadata),
  };

  // Always log security events (but sanitized)
  console.log(`[SECURITY] ${event}`, logData);

  // TODO: Send to security monitoring/SIEM in production
  // This should go to audit logs database
}

/**
 * Example usage in API routes:
 *
 * import { logInfo, logError, logSecurityEvent } from '@/lib/logger';
 *
 * // Good - logs general info without sensitive data
 * logInfo('User signup initiated', { source: 'web' });
 *
 * // Good - logs error without exposing data
 * logError('Database connection failed', error, { operation: 'user_fetch' });
 *
 * // Good - logs security event for audit
 * logSecurityEvent('Failed login attempt', { attempts: 3 });
 *
 * // BAD - Don't do this:
 * console.log('User created:', user); // Exposes email, userId, etc.
 * console.error(error); // May contain sensitive data in stack trace
 */
