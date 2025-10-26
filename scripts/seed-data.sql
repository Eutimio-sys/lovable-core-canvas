-- Seed Data Script for AI Content Platform
-- This script creates demo data for testing Phase 1 & 2 features

-- Note: Run this after the user has signed up and created their first workspace
-- Replace 'YOUR_USER_ID' and 'YOUR_WORKSPACE_ID' with actual values

-- 1. Add demo content
INSERT INTO public.contents (workspace_id, title, content, content_type, status, tags, created_by)
VALUES 
  ('YOUR_WORKSPACE_ID', 'Welcome to AI Content Platform', 
   'This is a demo article about our platform features...', 
   'article', 'published', ARRAY['demo', 'welcome'], 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', '10 Tips for Social Media Success', 
   '1. Post consistently\n2. Engage with your audience\n3. Use high-quality images...', 
   'post', 'draft', ARRAY['tips', 'social-media'], 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'Product Launch Script', 
   'Hello everyone! Today we''re excited to announce...', 
   'script', 'draft', ARRAY['video', 'launch'], 'YOUR_USER_ID');

-- 2. Add demo assets
INSERT INTO public.assets (workspace_id, name, asset_type, storage_url, mime_type, file_size, width, height, created_by, ai_params)
VALUES 
  ('YOUR_WORKSPACE_ID', 'Hero Image - Sunset City', 'image', 
   'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', 
   'image/jpeg', 2048000, 1920, 1080, 'YOUR_USER_ID',
   '{"prompt": "A futuristic city at sunset", "style": "cinematic"}'::jsonb),
  
  ('YOUR_WORKSPACE_ID', 'Product Photo', 'image',
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
   'image/jpeg', 1536000, 1200, 800, 'YOUR_USER_ID',
   '{"prompt": "Professional product photography", "style": "studio"}'::jsonb),
  
  ('YOUR_WORKSPACE_ID', 'Voice-over Demo', 'audio',
   'https://example.com/demo-audio.mp3',
   'audio/mpeg', 512000, NULL, NULL, 'YOUR_USER_ID',
   '{"text": "Welcome to our platform", "voice": "professional"}'::jsonb);

-- 3. Add demo jobs (some completed, some in progress)
INSERT INTO public.jobs (workspace_id, job_type, provider, status, progress, input_params, credits_estimated, created_by)
VALUES 
  ('YOUR_WORKSPACE_ID', 'text_generation', 'gemini', 'completed', 100,
   '{"prompt": "Write an article", "model": "gemini-2.5-flash"}'::jsonb, 1, 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'image_generation', 'stability', 'running', 45,
   '{"prompt": "Abstract art", "width": 1024, "height": 1024}'::jsonb, 5, 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'video_generation', 'runway', 'queued', 0,
   '{"prompt": "Product showcase", "duration": 10}'::jsonb, 30, 'YOUR_USER_ID');

-- 4. Add demo scheduled posts (next 5-10 minutes)
INSERT INTO public.scheduled_posts (
  workspace_id, caption, provider_targets, schedule_at, timezone, 
  status, credits_held, created_by
)
VALUES 
  ('YOUR_WORKSPACE_ID', 
   'Check out our latest blog post! 🚀 #AI #ContentCreation',
   ARRAY['demo_channel_ig', 'demo_channel_x'],
   NOW() + INTERVAL '5 minutes',
   'Asia/Bangkok',
   'scheduled',
   2,
   'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID',
   'New product launch coming soon! Stay tuned 👀',
   ARRAY['demo_channel_linkedin'],
   NOW() + INTERVAL '10 minutes',
   'Asia/Bangkok',
   'scheduled',
   1,
   'YOUR_USER_ID');

-- 5. Add demo automation flow
INSERT INTO public.automation_flows (
  workspace_id, name, description, is_active,
  trigger_config, conditions_config, actions_config, created_by
)
VALUES 
  ('YOUR_WORKSPACE_ID',
   'Auto-generate social images',
   'Automatically generate an image when a new blog post is created',
   true,
   '{"type": "post_created", "contentType": "article"}'::jsonb,
   '[{"field": "status", "operator": "equals", "value": "published"}]'::jsonb,
   '[{"type": "generate_image", "params": {"prompt": "Hero image for: {{title}}", "width": 1200, "height": 630}}]'::jsonb,
   'YOUR_USER_ID');

-- 6. Add demo automation run
INSERT INTO public.automation_runs (
  workspace_id, flow_id, status, trigger_data, steps, credits_held
)
SELECT 
  'YOUR_WORKSPACE_ID',
  id,
  'completed',
  '{"contentId": "uuid", "event": "post_created"}'::jsonb,
  '[
    {"type": "trigger", "status": "matched", "timestamp": "2024-01-15T10:00:00Z"},
    {"type": "condition", "status": "passed", "condition": "status equals published"},
    {"type": "action", "status": "completed", "action": "generate_image", "result": "Image generated successfully"}
  ]'::jsonb,
  2
FROM public.automation_flows 
WHERE workspace_id = 'YOUR_WORKSPACE_ID' 
LIMIT 1;

-- 7. Add usage ledger entries
INSERT INTO public.usage_ledger (
  workspace_id, transaction_type, amount, balance_after, 
  description, created_by
)
VALUES 
  ('YOUR_WORKSPACE_ID', 'grant', 100, 100, 
   'Initial credits grant', 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'hold', -5, 95, 
   'Hold for image generation', 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'finalize', 0, 95, 
   'Finalized image generation (5 credits)', 'YOUR_USER_ID'),
  
  ('YOUR_WORKSPACE_ID', 'hold', -2, 93,
   'Hold for scheduled post (2 targets)', 'YOUR_USER_ID');

-- 8. Update wallet balance
UPDATE public.wallets 
SET balance = 93, held_balance = 2
WHERE workspace_id = 'YOUR_WORKSPACE_ID';

-- 9. Add audit log entries
INSERT INTO public.audit_logs (
  workspace_id, user_id, action, resource_type, resource_id
)
VALUES 
  ('YOUR_WORKSPACE_ID', 'YOUR_USER_ID', 'created', 'content', 
   (SELECT id FROM contents WHERE title = 'Welcome to AI Content Platform' LIMIT 1)),
  
  ('YOUR_WORKSPACE_ID', 'YOUR_USER_ID', 'created', 'scheduled_post',
   (SELECT id FROM scheduled_posts LIMIT 1)),
  
  ('YOUR_WORKSPACE_ID', 'YOUR_USER_ID', 'created', 'automation_flow',
   (SELECT id FROM automation_flows LIMIT 1));

-- Success message
SELECT 'Seed data created successfully! 🎉' as message;
SELECT 'Created: 3 contents, 3 assets, 3 jobs, 2 scheduled posts, 1 automation flow' as summary;
