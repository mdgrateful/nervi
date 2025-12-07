import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Subscription pricing configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    price: 9.99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID, // You'll create this in Stripe Dashboard
    features: [
      'Unlimited conversations with Nervi',
      'Personalized daily nervous system care plans',
      'Notes and pattern tracking',
      'Life story mapping',
      'Email support',
    ],
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID, // You'll create this in Stripe Dashboard
    features: [
      'Everything in Basic',
      'Advanced nervous system analytics',
      'Priority AI responses',
      'Export all your data',
      'Priority email support',
      'Early access to new features',
    ],
  },
};

// Helper function to check if subscription is active
export function isSubscriptionActive(subscriptionStatus) {
  return ['active', 'trialing'].includes(subscriptionStatus);
}

// Helper function to check if user has premium features
export function hasPremiumAccess(subscriptionTier, subscriptionStatus) {
  return (
    subscriptionTier === 'premium' &&
    isSubscriptionActive(subscriptionStatus)
  );
}
