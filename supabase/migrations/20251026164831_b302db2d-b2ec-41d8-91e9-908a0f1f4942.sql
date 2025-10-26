-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true);

-- Storage policies for assets bucket
CREATE POLICY "Anyone can view assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assets' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assets' AND 
    auth.uid() IS NOT NULL
  );

-- Function to create default workspace and wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create a default workspace for the new user
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace'),
    'workspace-' || LOWER(SUBSTRING(NEW.id::text, 1, 8)),
    NEW.id
  )
  RETURNING id INTO new_workspace_id;

  -- Create membership for the owner
  INSERT INTO public.memberships (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Create wallet with starter plan
  INSERT INTO public.wallets (workspace_id, balance, plan, plan_credits_monthly)
  VALUES (new_workspace_id, 20, 'starter', 20);

  RETURN NEW;
END;
$$;

-- Trigger to create workspace when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to hold credits before job starts
CREATE OR REPLACE FUNCTION public.hold_credits(
  p_workspace_id uuid,
  p_amount integer,
  p_job_id uuid,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  -- Check if enough balance
  IF v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Update wallet
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    held_balance = held_balance + p_amount
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO usage_ledger (
    workspace_id,
    job_id,
    transaction_type,
    amount,
    balance_after,
    description,
    created_by
  )
  VALUES (
    p_workspace_id,
    p_job_id,
    'hold',
    -p_amount,
    v_new_balance,
    p_description,
    auth.uid()
  );

  RETURN true;
END;
$$;

-- Function to finalize credits after job completes
CREATE OR REPLACE FUNCTION public.finalize_credits(
  p_workspace_id uuid,
  p_held_amount integer,
  p_actual_amount integer,
  p_job_id uuid,
  p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund_amount integer;
  v_new_balance integer;
BEGIN
  v_refund_amount := p_held_amount - p_actual_amount;

  -- Update wallet
  UPDATE wallets
  SET 
    held_balance = held_balance - p_held_amount,
    balance = balance + v_refund_amount
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  -- Record finalize transaction
  INSERT INTO usage_ledger (
    workspace_id,
    job_id,
    transaction_type,
    amount,
    balance_after,
    description,
    created_by
  )
  VALUES (
    p_workspace_id,
    p_job_id,
    'finalize',
    -p_actual_amount,
    v_new_balance,
    p_description,
    auth.uid()
  );

  -- Record refund if any
  IF v_refund_amount > 0 THEN
    INSERT INTO usage_ledger (
      workspace_id,
      job_id,
      transaction_type,
      amount,
      balance_after,
      description,
      created_by
    )
    VALUES (
      p_workspace_id,
      p_job_id,
      'refund',
      v_refund_amount,
      v_new_balance,
      'Credit refund: ' || p_description,
      auth.uid()
    );
  END IF;
END;
$$;