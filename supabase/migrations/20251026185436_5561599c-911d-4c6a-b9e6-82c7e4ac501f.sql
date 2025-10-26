-- Create function to add credits to wallet
CREATE OR REPLACE FUNCTION public.add_credits(
  p_workspace_id uuid,
  p_amount integer,
  p_description text,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_stripe_charge_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_new_balance integer;
BEGIN
  -- Update wallet balance
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction in usage ledger
  INSERT INTO usage_ledger (
    workspace_id,
    transaction_type,
    amount,
    balance_after,
    description,
    stripe_payment_intent_id,
    stripe_charge_id,
    created_by
  )
  VALUES (
    p_workspace_id,
    'credit',
    p_amount,
    v_new_balance,
    p_description,
    p_stripe_payment_intent_id,
    p_stripe_charge_id,
    auth.uid()
  );
END;
$function$;