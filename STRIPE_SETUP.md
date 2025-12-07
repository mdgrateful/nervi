# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for Nervi.

## Overview

Nervi uses Stripe for subscription management with two tiers:
- **Basic**: $9.99/month
- **Premium**: $19.99/month

## Step 1: Create a Stripe Account

1. Go to https://stripe.com and sign up for an account
2. Complete your business profile

## Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click "Developers" in the left sidebar
3. Click "API keys"
4. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

**Important**: Start with test mode keys (pk_test_ and sk_test_). Switch to live mode only when you're ready to accept real payments.

## Step 3: Create Subscription Products

1. In Stripe Dashboard, click "Products" in the left sidebar
2. Click "Add product"

### Create Basic Plan

1. **Product name**: Nervi Basic
2. **Description**: Unlimited conversations, daily care plans, pattern tracking, life story mapping, and email support
3. **Pricing model**: Standard pricing
4. **Price**: $9.99 USD
5. **Billing period**: Monthly
6. **Payment type**: Recurring
7. Click "Save product"
8. **Copy the Price ID** (starts with `price_`) - you'll need this for the environment variables

### Create Premium Plan

1. Click "Add product" again
2. **Product name**: Nervi Premium
3. **Description**: Everything in Basic plus advanced analytics, priority AI, data export, priority support, and early access features
4. **Pricing model**: Standard pricing
5. **Price**: $19.99 USD
6. **Billing period**: Monthly
7. **Payment type**: Recurring
8. Click "Save product"
9. **Copy the Price ID** (starts with `price_`) - you'll need this for the environment variables

## Step 4: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your app when subscription events occur (payment succeeded, subscription canceled, etc.)

1. In Stripe Dashboard, click "Developers" → "Webhooks"
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/stripe-webhook`
   - For local development: Use a tool like ngrok or Stripe CLI
   - For production: Use your actual domain
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing secret** (starts with `whsec_`) - you'll need this for the environment variables

## Step 5: Update Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Stripe Price IDs (from Step 3)
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx

# Stripe Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Your app URL (used for redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL when deploying
```

## Step 6: Run Database Migration

Run the SQL migration to add subscription fields to your database:

1. Open Supabase Dashboard
2. Go to the SQL Editor
3. Open the file `add-subscription-fields.sql` in this repo
4. Copy and paste the SQL into the Supabase SQL Editor
5. Click "Run"

This will add the following columns to your `users` table:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`
- `subscription_tier`
- `subscription_current_period_end`

## Step 7: Test the Integration

### Test Mode

1. Make sure you're using test mode API keys (starting with `sk_test_` and `pk_test_`)
2. Restart your development server
3. Go to your profile page
4. Click "Choose Basic" or "Choose Premium"
5. You'll be redirected to Stripe Checkout
6. Use a test card:
   - **Card number**: 4242 4242 4242 4242
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
   - **ZIP**: Any 5 digits
7. Complete the checkout
8. You should be redirected back to your profile
9. Check that your subscription status updated

### Verify Webhook

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click on your webhook endpoint
3. Check the "Attempted webhooks" section
4. You should see successful webhook deliveries (200 status code)

## Step 8: Go Live (When Ready)

When you're ready to accept real payments:

1. Complete your Stripe account activation (business details, bank account, etc.)
2. Switch to "Live mode" in the Stripe Dashboard (toggle in top right)
3. Get your live API keys from "Developers" → "API keys"
4. Create live versions of your products (or copy test mode products to live mode)
5. Set up live webhook endpoint
6. Update your `.env.local` with live keys:
   - Change `STRIPE_SECRET_KEY` to your live secret key
   - Change `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your live publishable key
   - Update the price IDs to live mode price IDs
   - Update the webhook secret to the live webhook secret
7. Deploy your app
8. Test with a real card (you can refund test transactions)

## Customer Portal

The Customer Portal allows users to:
- View their subscription details
- Update payment method
- View invoice history
- Cancel subscription

To enable it:

1. In Stripe Dashboard, go to "Settings" → "Billing" → "Customer portal"
2. Click "Activate portal"
3. Configure what customers can do:
   - ✓ Cancel subscriptions
   - ✓ Update payment methods
   - ✓ View invoice history
4. Click "Save"

Now when users click "Manage Subscription" on the profile page, they'll be taken to the Stripe Customer Portal.

## Testing with Stripe CLI (Optional)

For local development, you can use the Stripe CLI to test webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Run: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
4. Use the webhook signing secret provided by the CLI
5. Trigger test events: `stripe trigger payment_intent.succeeded`

## Subscription Status Values

Your app handles these subscription statuses:

- `free` - No active subscription
- `active` - Active paid subscription
- `trialing` - In trial period (if you enable trials)
- `past_due` - Payment failed, subscription still active
- `canceled` - Subscription canceled
- `incomplete` - Initial payment failed
- `incomplete_expired` - Initial payment failed and expired
- `unpaid` - Payment failed, subscription ended

## Troubleshooting

### Webhook not working

1. Check that your webhook URL is correct and accessible
2. Verify the webhook secret in your environment variables
3. Check Stripe Dashboard → Webhooks for error messages
4. Look at your server logs for errors

### Subscription not updating

1. Check that the webhook is being received (Stripe Dashboard → Webhooks)
2. Verify the user_id in the subscription metadata
3. Check your database to see if the fields exist
4. Look at server logs for database errors

### Test card not working

Make sure you're using Stripe test cards: https://stripe.com/docs/testing

### Users can't cancel

1. Ensure Customer Portal is activated in Stripe settings
2. Check that users have a `stripe_customer_id` in the database
3. Verify the customer portal URL is accessible

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing
- Webhook Testing: https://stripe.com/docs/webhooks/test

## Cost Considerations

**Stripe fees** (as of 2024):
- 2.9% + $0.30 per successful transaction
- No monthly fees for under 500 customers
- No setup fees

**For 100 customers at $9.99/month**:
- Revenue: $999/month
- Stripe fees: ~$35/month (2.9% + $0.30 per transaction)
- Net: ~$964/month

**Switching to Square** (if needed after 500 customers):
You can export customer data and migrate, but note:
- Customers will need to re-enter payment info
- Subscription continuity will be disrupted
- Plan the migration during a low-activity period
