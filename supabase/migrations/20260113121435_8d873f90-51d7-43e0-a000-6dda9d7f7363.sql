-- Add period_month_end column for tracking yearly payment ranges
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS period_month_end INTEGER CHECK (period_month_end >= 1 AND period_month_end <= 12);

-- Add comment for documentation
COMMENT ON COLUMN public.payments.period_month_end IS 'For yearly payments: end month of the covered period (1-12). NULL for monthly payments.';