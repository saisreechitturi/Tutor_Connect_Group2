-- Migration: Simplify payments table for mock payments
-- Date: 2024-11-17
-- Description: Remove unnecessary payment processing fields and simplify for mock payments

-- Remove complex payment processing columns
ALTER TABLE payments DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE payments DROP COLUMN IF EXISTS transaction_id;
ALTER TABLE payments DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE payments DROP COLUMN IF EXISTS net_amount;
ALTER TABLE payments DROP COLUMN IF EXISTS processed_at;
ALTER TABLE payments DROP COLUMN IF EXISTS refunded_at;
ALTER TABLE payments DROP COLUMN IF EXISTS payment_intent;

-- Simplify payment_method to just be 'mock'
ALTER TABLE payments ALTER COLUMN payment_method SET DEFAULT 'mock';

-- Simplify status to just pending/completed/failed
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'completed', 'failed'));

-- Set default status to completed since it's mock
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'completed';

-- Add simple description if not exists
ALTER TABLE payments ALTER COLUMN description SET DEFAULT 'Mock payment';

-- Create index for faster session payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_session_status ON payments(session_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_payer_created ON payments(payer_id, created_at DESC);