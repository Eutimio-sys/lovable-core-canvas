-- Add stripe_customer_id to workspaces table for Phase 3 preparation
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer_id 
ON public.workspaces(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN public.workspaces.stripe_customer_id IS 'Stripe customer ID for billing integration (Phase 3)';