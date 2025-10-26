-- Phase 2: Scheduler, Social Integrations & Automation
-- Create tables for channels, scheduled posts, automation runs, and notifications

-- Channels table: connected social accounts per workspace
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('facebook_ig', 'x', 'linkedin', 'tiktok')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  scopes TEXT[] DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Channel tokens table: OAuth token bundle (mock)
CREATE TABLE public.channel_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled posts table: items to publish
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  asset_ids UUID[] DEFAULT '{}',
  provider_targets TEXT[] NOT NULL,
  caption TEXT NOT NULL,
  schedule_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'queued', 'publishing', 'published', 'failed', 'cancelled')),
  results JSONB DEFAULT '[]',
  error_message TEXT,
  credits_held INTEGER DEFAULT 0,
  credits_actual INTEGER,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation runs table: execution record per trigger occurrence
CREATE TABLE public.automation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  credits_held INTEGER DEFAULT 0,
  credits_actual INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table: in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('publish_success', 'publish_failed', 'automation_completed', 'automation_failed', 'channel_expired', 'credits_low', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_channels_workspace_provider ON public.channels(workspace_id, provider);
CREATE INDEX idx_channel_tokens_channel ON public.channel_tokens(channel_id);
CREATE INDEX idx_scheduled_posts_workspace_schedule ON public.scheduled_posts(workspace_id, schedule_at);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_automation_runs_workspace_flow ON public.automation_runs(workspace_id, flow_id);
CREATE INDEX idx_automation_runs_started ON public.automation_runs(started_at DESC);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read_at);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can view channels in their workspaces"
  ON public.channels FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage channels"
  ON public.channels FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for channel_tokens
CREATE POLICY "Admins can view channel tokens"
  ON public.channel_tokens FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage channel tokens"
  ON public.channel_tokens FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view scheduled posts in their workspaces"
  ON public.scheduled_posts FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can create scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher', 'creator')
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Publishers can update scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'publisher')
    )
  );

CREATE POLICY "Admins can delete scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for automation_runs
CREATE POLICY "Users can view automation runs in their workspaces"
  ON public.automation_runs FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_tokens_updated_at
  BEFORE UPDATE ON public.channel_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();