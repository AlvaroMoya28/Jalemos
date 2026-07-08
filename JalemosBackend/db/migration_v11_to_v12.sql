-- Migration v11 → v12: remove Stripe columns, add simulated-payment support
-- Run this once against the production/dev database.

-- Remove Stripe customer ID from users
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;

-- Replace Stripe payment method ID with a sim_behavior flag
ALTER TABLE payment_methods DROP COLUMN IF EXISTS stripe_payment_method_id;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS sim_behavior TEXT;

-- Remove Stripe payment intent ID from payments
ALTER TABLE payments DROP COLUMN IF EXISTS stripe_payment_intent_id;
