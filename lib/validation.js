import validator from "validator";

/**
 * Sanitizes user input by trimming whitespace and removing dangerous characters
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== "string") {
    return "";
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  return sanitized;
}

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Use validator library for robust email validation
  return validator.isEmail(email, {
    allow_utf8_local_part: false,
    require_tld: true,
  });
}

/**
 * Validates username format
 * Requirements: 3-30 characters, alphanumeric plus underscore/dash
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username format
 */
export function isValidUsername(username) {
  if (!username || typeof username !== "string") {
    return false;
  }

  // Check length
  if (username.length < 3 || username.length > 30) {
    return false;
  }

  // Check format: alphanumeric, underscore, dash only
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
}

/**
 * Validates password strength
 * Requirements: At least 8 characters, contains uppercase, lowercase, number
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates UUID format (for user IDs, etc.)
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID format
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }

  return validator.isUUID(uuid);
}

/**
 * Sanitizes and validates user state input
 * @param {string} state - US state code (2 letters)
 * @returns {boolean} - True if valid state code
 */
export function isValidStateCode(state) {
  if (!state || typeof state !== "string") {
    return false;
  }

  const validStates = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  return validStates.includes(state.toUpperCase());
}

/**
 * Validates time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} - True if valid time format
 */
export function isValidTimeFormat(time) {
  if (!time || typeof time !== "string") {
    return false;
  }

  // Match HH:MM format (00:00 - 23:59)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

/**
 * Sanitizes text content (for notes, messages, etc.)
 * Preserves most characters but removes dangerous patterns
 * @param {string} content - Content to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized content
 */
export function sanitizeTextContent(content, maxLength = 10000) {
  if (typeof content !== "string") {
    return "";
  }

  // Trim and limit length
  let sanitized = content.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Validates subscription tier
 * @param {string} tier - Subscription tier to validate
 * @returns {boolean} - True if valid tier
 */
export function isValidSubscriptionTier(tier) {
  const validTiers = ["free", "pro", "premium"];
  return validTiers.includes(tier);
}

/**
 * Validates subscription status
 * @param {string} status - Subscription status to validate
 * @returns {boolean} - True if valid status
 */
export function isValidSubscriptionStatus(status) {
  const validStatuses = ["active", "inactive", "canceled", "trialing"];
  return validStatuses.includes(status);
}

/**
 * Validates boolean-like values and converts to actual boolean
 * @param {any} value - Value to validate and convert
 * @returns {boolean|null} - Boolean value or null if invalid
 */
export function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return null;
}

/**
 * Validates and sanitizes a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export function isValidURL(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  return validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
  });
}
