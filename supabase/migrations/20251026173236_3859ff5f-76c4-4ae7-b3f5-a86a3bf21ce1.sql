-- Fix infinite recursion in RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view memberships in their workspaces" ON public.memberships;
DROP POLICY IF EXISTS "Workspace admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

-- Create security definer function to check workspace access
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.memberships WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$;

-- Create security definer function to check if user is workspace admin
CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE workspace_id = _workspace_id 
    AND user_id = _user_id 
    AND role IN ('owner', 'admin')
  );
$$;

-- Recreate workspaces policies using security definer function
CREATE POLICY "Users can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (public.user_has_workspace_access(auth.uid(), id));

-- Recreate memberships policies using security definer function
CREATE POLICY "Users can view memberships in their workspaces"
  ON public.memberships FOR SELECT
  USING (public.user_has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can manage memberships"
  ON public.memberships FOR ALL
  USING (public.user_is_workspace_admin(auth.uid(), workspace_id));