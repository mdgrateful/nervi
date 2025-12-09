/**
 * Rate Limiting Utility for Next.js API Routes
 *
 * Protects against brute force attacks and API abuse by limiting
 * the number of requests from a single IP address within a time window.
 *
 * This is an in-memory implementation that can be upgraded to Redis
 * for production distributed systems.
 */

import { logSecurityEvent } from "./logger";

// In-memory store for rate limit tracking
// Format: { identifier: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier (IP address)
 */
function getIdentifier(request) {
  // Try to get real IP from headers (for when behind proxy/CDN)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address (may not be available in Next.js)
  return request.ip || "unknown";
}

/**
 * Check and update rate limit
 *
 * @param {Request} request - Next.js request object
 * @param {number} limit - Maximum number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} endpoint - Endpoint identifier for logging
 * @returns {Object} { success: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(request, limit, windowMs, endpoint = "api") {
  const identifier = getIdentifier(request);
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > limit) {
    logSecurityEvent("Rate limit exceeded", {
      endpoint,
      identifier: identifier.substring(0, 10) + "...", // Partial IP for security
      count: entry.count,
      limit
    });

    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Rate limit middleware for API routes
 *
 * @param {Request} request
 * @param {number} limit
 * @param {number} windowMs
 * @param {string} endpoint
 * @returns {Response|null} Returns error response if rate limited, null if OK
 */
export function rateLimit(request, limit, windowMs, endpoint) {
  const result = checkRateLimit(request, limit, windowMs, endpoint);

  if (!result.success) {
    const resetDate = new Date(result.resetTime);
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfter: retryAfter
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString()
        }
      }
    );
  }

  return null;
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimiters = {
  // Login attempts: 5 per 15 minutes
  login: (request) => rateLimit(request, 5, 15 * 60 * 1000, "login"),

  // Signup: 3 accounts per hour per IP
  signup: (request) => rateLimit(request, 3, 60 * 60 * 1000, "signup"),

  // Password reset: 3 attempts per hour
  passwordReset: (request) => rateLimit(request, 3, 60 * 60 * 1000, "password-reset"),

  // General API: 60 requests per minute
  api: (request) => rateLimit(request, 60, 60 * 1000, "api"),

  // Strict for sensitive operations: 10 per hour
  strict: (request) => rateLimit(request, 10, 60 * 60 * 1000, "strict")
};

/**
 * Clear rate limit for a specific identifier (useful for testing)
 */
export function clearRateLimit(identifier, endpoint) {
  const key = `${endpoint}:${identifier}`;
  rateLimitStore.delete(key);
}
