-- Migration: Add missing columns to users table
-- This migration adds date_of_birth, address, and pincode columns if they don't exist

-- Add date_of_birth column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
        COMMENT ON COLUMN users.date_of_birth IS 'User date of birth for age verification and demographics';
    END IF;
END $$;

-- Add address column if it doesn't exist  
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
        COMMENT ON COLUMN users.address IS 'User full address information';
    END IF;
END $$;

-- Add pincode column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pincode') THEN
        ALTER TABLE users ADD COLUMN pincode VARCHAR(20);
        COMMENT ON COLUMN users.pincode IS 'Postal/ZIP code for user address - for future use';
    END IF;
END $$;