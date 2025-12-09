/**
 * Password Validation Utility
 * Enforces strong password requirements for user security
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export function validatePassword(password) {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      errors: ["Password is required"],
      strength: 0
    };
  }

  // Length check
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*, etc.)");
  }

  // Calculate strength score (0-100)
  let strength = 0;

  if (password.length >= 12) strength += 20;
  if (password.length >= 16) strength += 10;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Get human-readable strength label
 */
export function getPasswordStrengthLabel(strength) {
  if (strength >= 90) return "Very Strong";
  if (strength >= 70) return "Strong";
  if (strength >= 50) return "Moderate";
  if (strength >= 30) return "Weak";
  return "Very Weak";
}

/**
 * Get color for password strength indicator
 */
export function getPasswordStrengthColor(strength) {
  if (strength >= 90) return "#22c55e"; // green
  if (strength >= 70) return "#84cc16"; // lime
  if (strength >= 50) return "#eab308"; // yellow
  if (strength >= 30) return "#f97316"; // orange
  return "#dc2626"; // red
}
