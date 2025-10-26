# Stripe Billing Integration Guide

## Overview

This application uses Stripe for subscription billing and one-time credit purchases. The integration supports:

- **Subscription Plans**: Recurring monthly/yearly plans with automatic credit allocation
- **Credit Packs**: One-time purchases of credit bundles with bonus credits
- **Customer Portal**: Self-service billing management
- **Webhook Processing**: Automated credit provisioning and subscription management

## Architecture

### Database Schema

#### Plans Table
Stores subscription tier definitions:
- `name`: Plan name (e.g., "Pro", "Enterprise")
- `stripe_price_id`: Stripe Price ID for checkout
- `amount_cents`: Price in cents
- `interval`: Billing interval (month/year)
- `credits_per_interval`: Credits allocated per billing cycle
- `features`: JSON array of plan features

#### Packs Table
Stores one-time credit pack definitions:
- `name`: Pack name (e.g., "Growth Pack")
- `stripe_price_id`: Stripe Price ID for checkout
- `amount_cents`: Price in cents
- `credits`: Base credits included
- `bonus_credits`: Additional bonus credits

#### Stripe Events Table
Logs all webhook events for audit and debugging:
- `stripe_event_id`: Unique Stripe event ID
- `event_type`: Event type (e.g., `invoice.paid`)
- `workspace_id`: Associated workspace
- `payload`: Full event data as JSON
- `processed`: Processing status

### Edge Functions

#### `/stripe-checkout`
Creates Stripe Checkout sessions for subscriptions or credit packs.

**Request Body:**
```json
{
  "type": "subscription" | "payment",
  "priceId": "price_xxxxx",
  "workspaceId": "uuid",
  "successUrl": "https://your-app.com/success",
  "cancelUrl": "https://your-app.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/xxxxx"
}
```

#### `/stripe-portal`
Creates Stripe Customer Portal sessions for billing management.

**Request Body:**
```json
{
  "customerId": "cus_xxxxx",
  "returnUrl": "https://your-app.com/billing"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/xxxxx"
}
```

#### `/stripe-webhook`
Processes Stripe webhook events. Must be configured as webhook endpoint in Stripe Dashboard.

**Webhook URL:** `https://your-project.supabase.co/functions/v1/stripe-webhook`

**Handled Events:**
- `checkout.session.completed`: Links Stripe customer to workspace
- `invoice.paid`: Adds subscription credits to wallet
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Marks subscription as canceled
- `payment_intent.succeeded`: Adds credit pack credits to wallet

## Setup Instructions

### 1. Configure Stripe API Keys

Add your Stripe secret key as a Supabase secret:

```bash
# In Lovable, use the secrets tool or manually add:
STRIPE_SECRET_KEY=sk_live_xxxxx or sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (optional but recommended)
```

### 2. Create Products and Prices in Stripe

For each subscription plan and credit pack:

1. Go to Stripe Dashboard → Products
2. Create a new product
3. Add a price (recurring for subscriptions, one-time for packs)
4. Copy the Price ID (starts with `price_`)

### 3. Update Database with Stripe Price IDs

```sql
-- Update subscription plans
UPDATE plans 
SET stripe_price_id = 'price_xxxxx' 
WHERE name = 'Pro';

-- Update credit packs
UPDATE packs 
SET stripe_price_id = 'price_xxxxx' 
WHERE name = 'Growth Pack';
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
4. Copy the webhook signing secret
5. Add it as `STRIPE_WEBHOOK_SECRET` in Supabase secrets

## Usage Flow

### Subscription Purchase

1. User clicks "Select Plan" on a subscription plan
2. Frontend calls `/stripe-checkout` with plan's `stripe_price_id`
3. User is redirected to Stripe Checkout
4. After payment, Stripe sends `checkout.session.completed` webhook
5. Webhook handler links Stripe customer ID to workspace
6. Stripe sends `invoice.paid` webhook
7. Webhook handler adds credits to wallet based on plan

### Credit Pack Purchase

1. User clicks "Purchase Pack" on a credit pack
2. Frontend calls `/stripe-checkout` with pack's `stripe_price_id`
3. User is redirected to Stripe Checkout
4. After payment, Stripe sends `payment_intent.succeeded` webhook
5. Webhook handler adds credits + bonus credits to wallet

### Subscription Management

1. User clicks "Manage Billing" button
2. Frontend calls `/stripe-portal` with customer ID
3. User is redirected to Stripe Customer Portal
4. User can update payment method, view invoices, cancel subscription
5. Any changes trigger webhooks to update database

## Credit Allocation

Credits are automatically added to the workspace wallet using the `add_credits()` database function:

```sql
SELECT add_credits(
  p_workspace_id := 'workspace-uuid',
  p_amount := 1000,
  p_description := 'Monthly subscription credits',
  p_stripe_payment_intent_id := 'pi_xxxxx',
  p_stripe_charge_id := 'ch_xxxxx'
);
```

This function:
- Updates wallet balance
- Records transaction in usage_ledger
- Links transaction to Stripe payment for reconciliation

## Testing

### Test Mode

1. Use Stripe test API keys (`sk_test_xxxxx`)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and CVC
4. Test different scenarios:
   - Successful payment
   - Declined payment
   - Subscription cancellation
   - Subscription update

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
```

## Monitoring

### Check Webhook Logs

```sql
-- View recent webhook events
SELECT 
  stripe_event_id,
  event_type,
  processed,
  created_at,
  error_message
FROM stripe_events
ORDER BY created_at DESC
LIMIT 20;

-- Check unprocessed events
SELECT * FROM stripe_events WHERE processed = false;
```

### Check Credit Transactions

```sql
-- View recent credit additions
SELECT 
  description,
  amount,
  balance_after,
  stripe_payment_intent_id,
  created_at
FROM usage_ledger
WHERE transaction_type = 'credit'
ORDER BY created_at DESC
LIMIT 20;
```

## Security Considerations

1. **Webhook Signature Verification**: Always verify webhook signatures in production
2. **API Key Security**: Never expose secret keys in frontend code
3. **Customer Validation**: Always validate workspace ownership before operations
4. **Amount Validation**: Verify payment amounts match expected prices
5. **Idempotency**: Handle duplicate webhook events gracefully

## Troubleshooting

### Credits Not Added After Payment

1. Check `stripe_events` table for webhook receipt
2. Verify `processed = true` in stripe_events
3. Check edge function logs for errors
4. Verify price ID matches in database

### Checkout Session Creation Fails

1. Verify `STRIPE_SECRET_KEY` is set
2. Check price ID exists in Stripe
3. Verify price is active in Stripe Dashboard
4. Check edge function logs for detailed error

### Customer Portal Access Denied

1. Verify workspace has `stripe_customer_id`
2. Check customer exists in Stripe
3. Verify customer ID format is correct

## Support

For issues related to:
- **Stripe Integration**: Check Stripe Dashboard → Logs
- **Database Issues**: Check Supabase → Database → Logs
- **Edge Function Issues**: Check Supabase → Edge Functions → Logs
- **Frontend Issues**: Check browser console

## Next Steps

1. Enable Stripe integration using the Lovable Stripe tool
2. Configure production API keys
3. Create production products and prices
4. Test end-to-end flow in production mode
5. Monitor webhook processing and credit allocation
