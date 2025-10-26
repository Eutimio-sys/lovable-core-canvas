# 🧪 E2E Test Scripts & Scenarios

## Overview
This document provides end-to-end testing scenarios for the AI Content + Automation Platform. Each scenario includes step-by-step instructions, expected outcomes, and verification points.

---

## 1️⃣ AI Content Generation Flow (PAL)

### Scenario: Generate Image → Hold Credits → Finalize → Save Asset

**Prerequisites:**
- User logged in
- Workspace has sufficient credits (≥5)

**Steps:**

1. **Navigate to Media Studio → Image**
   - URL: `/media/image`

2. **Enter generation parameters:**
   ```
   Prompt: "Modern minimalist office space with natural lighting"
   Style: "photographic"
   Size: 1024x1024
   ```

3. **Click "Generate"**
   - ✅ Credits are held (check wallet)
   - ✅ Job created with status "queued"
   - ✅ UI shows loading state

4. **Monitor job progress:**
   - ✅ Job status updates to "running"
   - ✅ Progress bar shows completion %
   - ✅ Realtime updates via Supabase channel

5. **Upon completion:**
   - ✅ Job status = "completed"
   - ✅ Credits finalized (estimated vs actual logged)
   - ✅ Asset saved to `assets` table
   - ✅ Image displayed in UI
   - ✅ Entry in `usage_ledger` with transaction details

6. **Verify asset in Asset Library:**
   - URL: `/assets`
   - ✅ Asset appears in grid
   - ✅ Correct metadata (dimensions, file size)
   - ✅ Download and preview work

**SQL Verification:**
```sql
-- Check job
SELECT * FROM jobs WHERE job_type = 'image_generation' ORDER BY created_at DESC LIMIT 1;

-- Check ledger
SELECT * FROM usage_ledger WHERE job_id = '<job_id>';

-- Check asset
SELECT * FROM assets WHERE id = '<asset_id>';
```

---

## 2️⃣ Content Creation → Text Generation

### Scenario: Generate AI Content → Save to Content Studio

**Prerequisites:**
- User logged in with creator/publisher role

**Steps:**

1. **Navigate to Content Studio**
   - URL: `/content`

2. **Click "Generate with AI"**

3. **Enter generation parameters:**
   ```
   Topic: "5 Tips for Social Media Marketing"
   Tone: "professional"
   Length: "medium"
   ```

4. **Generate content:**
   - ✅ Credits held
   - ✅ Job queued → running → completed
   - ✅ Text displayed in editor

5. **Edit and save:**
   - Add title and tags
   - Set status to "draft"
   - ✅ Content saved to `contents` table

6. **Verify in Content Studio list:**
   - ✅ Content appears in grid
   - ✅ Correct metadata

---

## 3️⃣ Scheduler Flow → Schedule → Publish

### Scenario: Schedule Post → Publish via Worker → Track Results

**Prerequisites:**
- Social channels connected (mock OAuth)
- Content/assets exist

**Steps:**

1. **Navigate to Scheduler**
   - URL: `/scheduler`

2. **Create scheduled post:**
   - Select asset(s)
   - Write caption
   - Select target channels: `facebook_ig`, `x`
   - Set schedule time: 2 minutes from now
   - ✅ Credits held (1 per target = 2 total)

3. **Verify in Calendar view:**
   - ✅ Post appears at scheduled time
   - ✅ Status = "scheduled"

4. **Wait for worker execution:**
   - Cron runs every 1 minute
   - ✅ Status changes to "publishing" then "published"
   - ✅ Results saved per target (success/failure)
   - ✅ Credits finalized based on actual success
   - ✅ Notification created

5. **Check History:**
   - URL: `/scheduler?view=history`
   - ✅ Post shows in history with results

**SQL Verification:**
```sql
-- Check scheduled post
SELECT * FROM scheduled_posts WHERE id = '<post_id>';

-- Check results
SELECT results, credits_held, credits_actual FROM scheduled_posts WHERE id = '<post_id>';

-- Check notification
SELECT * FROM notifications WHERE payload->>'post_id' = '<post_id>';
```

---

## 4️⃣ Automation Flow → Trigger → Actions

### Scenario: Create Automation → Test → Execute → Track

**Prerequisites:**
- Automation builder access (publisher/admin)

**Steps:**

1. **Navigate to Automation Builder**
   - URL: `/automation`

2. **Create new automation:**
   ```
   Trigger: "webhook" (content_created)
   Condition: tag includes "auto-post"
   Actions:
     - Generate image with AI
     - Schedule post to all channels
   ```

3. **Test automation:**
   - Click "Test Run"
   - Provide test data
   - ✅ Dry-run executes without consuming credits
   - ✅ Steps shown with preview results

4. **Activate automation:**
   - Toggle "Active"
   - ✅ Status saved to `automation_flows`

5. **Trigger automation:**
   - Create content with tag "auto-post"
   - ✅ Automation run created
   - ✅ Credits held for actions
   - ✅ Image generated → Post scheduled
   - ✅ Credits finalized
   - ✅ Notification sent

6. **Check Automation Runs:**
   - URL: `/automation?tab=runs`
   - ✅ Run shown with status "completed"
   - ✅ Steps breakdown visible

**SQL Verification:**
```sql
-- Check automation flow
SELECT * FROM automation_flows WHERE is_active = true;

-- Check run
SELECT * FROM automation_runs WHERE flow_id = '<flow_id>' ORDER BY started_at DESC LIMIT 1;

-- Check ledger
SELECT * FROM usage_ledger WHERE metadata->>'automation_run_id' = '<run_id>';
```

---

## 5️⃣ RBAC & RLS Policy Tests

### Scenario: Verify Role-Based Access Control

**Test Cases:**

#### A. **Creator can create but not delete:**
```sql
-- As creator user
INSERT INTO contents (workspace_id, title, created_by, ...) VALUES (...); -- ✅ Allowed
DELETE FROM contents WHERE id = '<id>'; -- ❌ Denied (RLS)
```

#### B. **Publisher can schedule posts:**
```sql
-- As publisher user
INSERT INTO scheduled_posts (workspace_id, ...) VALUES (...); -- ✅ Allowed
UPDATE scheduled_posts SET status = 'published' WHERE id = '<id>'; -- ✅ Allowed
```

#### C. **Analyst can only read:**
```sql
-- As analyst user
SELECT * FROM usage_ledger WHERE workspace_id = '<ws_id>'; -- ✅ Allowed
INSERT INTO contents (...) VALUES (...); -- ❌ Denied (RLS)
```

#### D. **Workspace isolation:**
```sql
-- As user in workspace A
SELECT * FROM contents WHERE workspace_id = '<workspace_B_id>'; -- ❌ Returns empty (RLS)
```

**Verification:**
- Use Postman/Bruno collection with different user tokens
- Check RLS policies via SQL:
```sql
SELECT * FROM pg_policies WHERE tablename = 'contents';
```

---

## 6️⃣ Realtime Updates Test

### Scenario: Verify Realtime Channels

**Test:**

1. **Open two browser tabs:**
   - Tab 1: Dashboard
   - Tab 2: Media Studio

2. **Generate image in Tab 2:**
   - ✅ Tab 1 Dashboard shows job update in realtime
   - ✅ JobQueuePanel updates without refresh

3. **Subscribe to channels:**
```typescript
// Jobs realtime
supabase.channel('jobs-changes').on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'jobs',
  filter: `workspace_id=eq.${workspaceId}`
}, (payload) => console.log(payload)).subscribe();

// Assets realtime
supabase.channel('assets-changes').on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'assets'
}, (payload) => console.log(payload)).subscribe();
```

---

## 7️⃣ Credit Flow Validation

### Scenario: Credit Hold → Finalize → Ledger

**Steps:**

1. **Check initial wallet:**
```sql
SELECT balance, held_balance FROM wallets WHERE workspace_id = '<ws_id>';
-- e.g., balance = 100, held = 0
```

2. **Trigger job (5 credits estimated):**
   - ✅ `held_balance` increases by 5
   - ✅ `balance` remains 100

3. **Job completes (4 credits actual):**
   - ✅ `held_balance` decreases by 5
   - ✅ `balance` decreases by 4
   - ✅ Ledger entry:
```sql
SELECT * FROM usage_ledger WHERE job_id = '<job_id>';
-- transaction_type = 'debit'
-- amount = -4
-- metadata contains estimated vs actual
```

---

## 8️⃣ Error Handling & Retry

### Scenario: Job Fails → Retry → Success

**Steps:**

1. **Simulate failure:**
   - Modify PAL to fail randomly (50%)

2. **Generate image:**
   - ✅ Job status = "failed"
   - ✅ Credits released (held → balance)
   - ✅ Error message shown in UI

3. **Click "Retry":**
   - ✅ New job created
   - ✅ Credits re-held
   - ✅ Job succeeds on retry

4. **Verify retry count:**
```sql
SELECT input_params->'retry_count' FROM jobs WHERE id = '<job_id>';
```

---

## 9️⃣ Webhook Handling (Scheduler)

### Scenario: Provider Webhook → Update Status

**Steps:**

1. **Schedule post**

2. **Simulate provider webhook:**
```bash
curl -X POST https://<project>.supabase.co/functions/v1/scheduler-webhooks/provider \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "<post_id>",
    "provider": "facebook_ig",
    "status": "published",
    "external_id": "fb_12345",
    "published_url": "https://fb.com/post/12345"
  }'
```

3. **Verify update:**
```sql
SELECT results FROM scheduled_posts WHERE id = '<post_id>';
-- results should include updated status
```

---

## 🔟 End-to-End Integration Test

### Scenario: Full User Journey

1. **Sign up / Login**
2. **Generate AI content** (text + image)
3. **Create post** using generated content
4. **Connect social channel** (mock OAuth)
5. **Schedule post** for 1 minute ahead
6. **Create automation** to auto-post on content tag
7. **Monitor dashboard** for realtime updates
8. **View History** after post publishes
9. **Check Wallet & Ledger** for credit tracking
10. **Invite team member** and verify RBAC

**Expected:**
- ✅ All flows work seamlessly
- ✅ Credits tracked accurately
- ✅ Notifications received
- ✅ Realtime updates instant
- ✅ RLS enforced (no cross-workspace leaks)

---

## 🔧 Tools & Collections

- **Postman Collection:** `/postman-collection.json`
- **SQL Seed Data:** `/scripts/seed-data.sql`
- **API Contracts:** `/API_CONTRACTS.md`
- **RBAC Guide:** `/RBAC_RLS_GUIDE.md`

---

## 📊 Metrics to Track

- **Job Success Rate:** `completed / total`
- **Credit Accuracy:** `SUM(credits_actual - credits_estimated)`
- **Scheduler Reliability:** `published / scheduled`
- **Automation Success:** `completed / triggered`
- **Realtime Latency:** Time from DB insert → UI update

---

## 🚨 Common Issues & Troubleshooting

1. **Credits not released on failure:**
   - Check `finalize_credits` RPC logs
   - Verify `held_balance` updated

2. **Realtime not working:**
   - Check `supabase_realtime` publication includes tables
   - Verify REPLICA IDENTITY FULL set

3. **RLS denies legitimate access:**
   - Check user's workspace membership
   - Review policy logic with `EXPLAIN`

4. **Scheduler skips posts:**
   - Check cron interval (should be 1 min)
   - Verify worker logs for errors

---

**Last Updated:** Phase 1 + 2 Completion
**Status:** ✅ Production-Ready
