-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);

-- Create memberships table (user-workspace relation with roles)
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'publisher', 'creator', 'analyst', 'finance', 'guest')),
  scopes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_memberships_workspace_id ON public.memberships(workspace_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'publisher', 'creator', 'analyst', 'finance', 'guest')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_workspace_id ON public.invitations(workspace_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);

-- Create contents table (AI-generated text content)
CREATE TABLE public.contents (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'caption', 'article', 'script', 'email')),
  ai_params JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_contents_workspace_id ON public.contents(workspace_id, created_at DESC);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_created_by ON public.contents(created_by);

-- Create assets table (media files)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio')),
  mime_type TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration FLOAT,
  storage_url TEXT NOT NULL,
  cdn_url TEXT,
  provider TEXT,
  ai_params JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_workspace_id ON public.assets(workspace_id, created_at DESC);
CREATE INDEX idx_assets_asset_type ON public.assets(asset_type);
CREATE INDEX idx_assets_provider ON public.assets(provider);

-- Create jobs table (async job queue)
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('text_generation', 'image_generation', 'video_generation', 'audio_generation', 'automation')),
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  input_params JSONB NOT NULL,
  output_data JSONB,
  error_message TEXT,
  credits_estimated INTEGER NOT NULL,
  credits_actual INTEGER,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_workspace_id ON public.jobs(workspace_id, created_at DESC);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);

-- Create wallets table (credits per workspace)
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  held_balance INTEGER NOT NULL DEFAULT 0 CHECK (held_balance >= 0),
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'creator', 'pro', 'team', 'enterprise')),
  plan_credits_monthly INTEGER DEFAULT 20,
  billing_cycle_start DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_workspace_id ON public.wallets(workspace_id);

-- Create usage_ledger table (credit usage history)
CREATE TABLE public.usage_ledger (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('hold', 'finalize', 'refund', 'purchase', 'grant')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_ledger_workspace_id ON public.usage_ledger(workspace_id, created_at DESC);
CREATE INDEX idx_usage_ledger_job_id ON public.usage_ledger(job_id);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_workspace_id ON public.audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Create automation_flows table (placeholder for phase 2)
CREATE TABLE public.automation_flows (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_config JSONB NOT NULL,
  actions_config JSONB NOT NULL,
  conditions_config JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_flows_workspace_id ON public.automation_flows(workspace_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_flows_updated_at
  BEFORE UPDATE ON public.automation_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners and admins can update"
  ON public.workspaces FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- RLS Policies for memberships
CREATE POLICY "Users can view memberships in their workspaces"
  ON public.memberships FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage memberships"
  ON public.memberships FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for contents
CREATE POLICY "Users can view contents in their workspaces"
  ON public.contents FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contents in their workspaces"
  ON public.contents FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher', 'creator')
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own contents or as admin"
  ON public.contents FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND (
        role IN ('owner', 'admin', 'publisher') OR
        (role = 'creator' AND created_by = auth.uid())
      )
    )
  );

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their workspaces"
  ON public.assets FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets in their workspaces"
  ON public.assets FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher', 'creator')
    ) AND created_by = auth.uid()
  );

-- RLS Policies for jobs
CREATE POLICY "Users can view jobs in their workspaces"
  ON public.jobs FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their workspaces"
  ON public.jobs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher', 'creator')
    ) AND created_by = auth.uid()
  );

-- RLS Policies for wallets
CREATE POLICY "Users can view wallets in their workspaces"
  ON public.wallets FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace finance/admin can manage wallets"
  ON public.wallets FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'finance')
    )
  );

-- RLS Policies for usage_ledger
CREATE POLICY "Users can view usage in their workspaces"
  ON public.usage_ledger FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'analyst')
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations in their workspaces"
  ON public.invitations FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for automation_flows
CREATE POLICY "Users can view automation flows in their workspaces"
  ON public.automation_flows FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage automation flows"
  ON public.automation_flows FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher')
    )
  );