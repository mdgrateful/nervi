# Stripe Subscription Setup Guide

## Current Status

✅ **Backend Code Complete**
- Checkout session creation
- Webhook handling for subscription updates
- 7-day free trial configured
- Database schema ready

❌ **Needs Configuration**
- Stripe account setup
- Environment variables
- Database migration
- Access control implementation

---

## Step 1: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Set trial dates for existing users (7 days from their signup)
UPDATE users
SET
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '7 days',
  subscription_status = CASE
    WHEN created_at + INTERVAL '7 days' > NOW() THEN 'trialing'
    ELSE 'free'
  END
WHERE trial_start_date IS NULL;
```

---

## Step 2: Stripe Account Setup

### 2.1 Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete account verification

### 2.2 Create a Product
1. Go to **Products** in Stripe Dashboard
2. Click **+ Add Product**
3. Name: "Nervi Basic" (or choose one plan)
4. Pricing:
   - **Recurring**: Monthly
   - **Price**: $9.99/month (or your chosen price)
5. Save the product

### 2.3 Get the Price ID
1. Click on the product you just created
2. Under "Pricing", copy the **Price ID** (starts with `price_`)
3. Save this - you'll need it for environment variables

### 2.4 Get API Keys
1. Go to **Developers** > **API Keys**
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. **⚠️ IMPORTANT**: Keep this secret! Never commit to GitHub

### 2.5 Setup Webhook
1. Go to **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Listen to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 3: Environment Variables

### 3.1 Local Development (.env.local)
Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_BASIC_PRICE_ID=price_YOUR_PRICE_ID_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_BASE_URL=http://localhost:3010
```

### 3.2 Vercel Production
Add these same variables in Vercel:
1. Go to your project on Vercel
2. **Settings** > **Environment Variables**
3. Add all four variables above
4. Change `NEXT_PUBLIC_BASE_URL` to your production URL (e.g., `https://nervi-app.vercel.app`)

---

## Step 4: Access Control Implementation

### Current Behavior:
- All users can access all pages

### Required Behavior:
- **Active subscription** (`active` or `trialing`): Full access
- **No subscription or payment failed** (`free`, `past_due`, `unpaid`, `canceled`): Only profile page access

### Implementation Needed:

I'll create this middleware for you. It will:
1. Check user's subscription status on every page load
2. Redirect non-paying users to profile page
3. Show a banner prompting them to subscribe
4. Allow profile page access for data export and account deletion

---

## Step 5: Testing the Flow

### Test Mode Flow:
1. **Sign up** as a new user
2. **Start trial**: User automatically gets 7-day trial
3. **During trial**: Full access to all features
4. **Day 7**: Stripe attempts to charge
5. **If payment succeeds**: Subscription becomes `active`
6. **If payment fails**: Status becomes `past_due`, access restricted

### Test Cards (Stripe Test Mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

---

## Subscription Status Flow

```
User Signs Up
    ↓
Trial Starts (7 days, status: 'trialing')
    ↓
    ├─→ Day 7: Payment Succeeds → Status: 'active' ✅
    │                              (Full Access)
    │
    └─→ Day 7: Payment Fails → Status: 'past_due' ⚠️
                                (Profile Page Only)
                                    ↓
                                Payment Retried
                                    ↓
                        ├─→ Success → Status: 'active' ✅
                        │
                        └─→ Fails Again → Status: 'unpaid' ❌
                                           (Profile Page Only)
```

---

## Next Steps

Want me to:
1. ✅ Create access control middleware
2. ✅ Add subscription status banner
3. ✅ Update profile page to show subscription management
4. ✅ Add trial countdown indicator

Let me know and I'll implement the access control next!
