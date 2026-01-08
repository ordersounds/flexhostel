-- Create payment_type enum
CREATE TYPE public.payment_type AS ENUM ('rent', 'charge', 'manual');

-- Add new columns to payments table
ALTER TABLE public.payments 
ADD COLUMN payment_type public.payment_type NOT NULL DEFAULT 'rent',
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN manual_confirmation_by uuid REFERENCES public.profiles(id),
ADD COLUMN notes text;

-- Create index for payment lookups by type
CREATE INDEX idx_payments_type ON public.payments(payment_type);
CREATE INDEX idx_payments_reference ON public.payments(paystack_reference);