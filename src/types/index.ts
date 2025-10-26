// Core types for the AI Content Platform

export type UserRole = 'owner' | 'admin' | 'publisher' | 'creator' | 'analyst' | 'finance' | 'guest';

export type ContentType = 'post' | 'caption' | 'article' | 'script' | 'email';
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export type AssetType = 'image' | 'video' | 'audio';
export type JobType = 'text_generation' | 'image_generation' | 'video_generation' | 'audio_generation' | 'automation';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type PlanType = 'starter' | 'creator' | 'pro' | 'team' | 'enterprise';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: UserRole;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  content_type: ContentType;
  ai_params: Record<string, any>;
  tags: string[];
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  workspace_id: string;
  name: string;
  asset_type: AssetType;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  storage_url: string;
  cdn_url: string | null;
  provider: string | null;
  ai_params: Record<string, any>;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  workspace_id: string;
  job_type: JobType;
  provider: string | null;
  status: JobStatus;
  progress: number;
  input_params: Record<string, any>;
  output_data: Record<string, any> | null;
  error_message: string | null;
  credits_estimated: number;
  credits_actual: number | null;
  asset_id: string | null;
  content_id: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  workspace_id: string;
  balance: number;
  held_balance: number;
  plan: PlanType;
  plan_credits_monthly: number | null;
  billing_cycle_start: string | null;
  updated_at: string;
  created_at: string;
}

export interface UsageLedger {
  id: string;
  workspace_id: string;
  job_id: string | null;
  transaction_type: 'hold' | 'finalize' | 'refund' | 'purchase' | 'grant';
  amount: number;
  balance_after: number;
  description: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Phase 2 types
export type SocialProvider = 'facebook_ig' | 'x' | 'linkedin' | 'tiktok';
export type ChannelStatus = 'active' | 'expired' | 'revoked' | 'error';
export type ScheduledPostStatus = 'draft' | 'scheduled' | 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type AutomationRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type NotificationType = 'publish_success' | 'publish_failed' | 'automation_completed' | 'automation_failed' | 'channel_expired' | 'credits_low' | 'system';

export interface Channel {
  id: string;
  workspace_id: string;
  provider: SocialProvider;
  account_name: string;
  account_id: string;
  status: ChannelStatus;
  scopes: string[];
  connected_at: string;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledPost {
  id: string;
  workspace_id: string;
  content_id: string | null;
  asset_ids: string[];
  provider_targets: string[];
  caption: string;
  schedule_at: string;
  timezone: string;
  status: ScheduledPostStatus;
  results: any[];
  error_message: string | null;
  credits_held: number;
  credits_actual: number | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  workspace_id: string;
  flow_id: string;
  status: AutomationRunStatus;
  trigger_data: Record<string, any>;
  steps: any[];
  credits_held: number;
  credits_actual: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}
