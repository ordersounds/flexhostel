-- Migration: Fix payment-tenancy relationships for existing data
-- This migration updates payments.tenancy_id for payments that were created before the relationship fix

-- Update payments that have a tenancy linked via payment_id but missing tenancy_id
UPDATE payments
SET tenancy_id = tenancies.id
FROM tenancies
WHERE payments.payment_id = tenancies.payment_id
  AND payments.tenancy_id IS NULL
  AND tenancies.status = 'active';

-- Log the number of updated records
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM payments
    WHERE tenancy_id IS NOT NULL;

    RAISE NOTICE 'Updated % payment records with tenancy_id relationships', updated_count;
END $$;