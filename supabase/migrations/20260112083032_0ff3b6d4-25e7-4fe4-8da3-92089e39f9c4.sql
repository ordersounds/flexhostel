-- Create tenant_charge_preferences table for locking payment frequency choice
CREATE TABLE public.tenant_charge_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charge_id UUID NOT NULL REFERENCES public.charges(id) ON DELETE CASCADE,
  chosen_frequency TEXT NOT NULL CHECK (chosen_frequency IN ('monthly', 'yearly')),
  locked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, charge_id)
);

-- Enable RLS
ALTER TABLE public.tenant_charge_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own charge preferences"
ON public.tenant_charge_preferences
FOR SELECT
USING (tenant_id = auth.uid() OR get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Tenants can insert own charge preferences"
ON public.tenant_charge_preferences
FOR INSERT
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Landlord can manage all preferences"
ON public.tenant_charge_preferences
FOR ALL
USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- Add period tracking columns to payments table
ALTER TABLE public.payments 
ADD COLUMN period_month INTEGER CHECK (period_month >= 1 AND period_month <= 12),
ADD COLUMN period_year INTEGER,
ADD COLUMN period_label TEXT;

-- Add index for faster lookups
CREATE INDEX idx_tenant_charge_preferences_tenant_charge 
ON public.tenant_charge_preferences(tenant_id, charge_id);

CREATE INDEX idx_payments_period 
ON public.payments(period_year, period_month);