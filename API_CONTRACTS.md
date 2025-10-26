# API Contracts Documentation

## Overview
This document provides detailed API contracts for all endpoints in the AI Content + Automation Platform.

---

## Phase 1 — Content & Media Generation

### 1. Generate Text Content
**Endpoint:** `POST /supabase/functions/generate-text`

**Request:**
```json
{
  "prompt": "Write a blog post about AI automation",
  "type": "article",
  "workspaceId": "uuid",
  "model": "google/gemini-2.5-flash"
}
```

**Response:** `200 OK`
```json
{
  "jobId": "uuid",
  "status": "queued",
  "creditsHeld": 1,
  "estimatedCredits": 1
}
```

### 2. Generate Image
**Endpoint:** `POST /supabase/functions/generate-image`

**Request:**
```json
{
  "prompt": "A futuristic city at sunset",
  "width": 1024,
  "height": 1024,
  "workspaceId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "jobId": "uuid",
  "status": "queued",
  "creditsHeld": 5,
  "estimatedCredits": 5,
  "assetUrl": "https://cdn.example.com/..."
}
```

### 3. Get Job Status
**Endpoint:** `GET /api/jobs/:id`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "completed",
  "progress": 100,
  "outputData": {
    "assetId": "uuid",
    "url": "https://..."
  },
  "creditsEstimated": 5,
  "creditsActual": 5,
  "error": null
}
```

---

## Phase 2 — Social Connections

### 4. Connect Social Channel
**Endpoint:** `POST /supabase/functions/channels/connect`

**Request:**
```json
{
  "provider": "facebook_ig",
  "workspaceId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "channelId": "uuid",
  "provider": "facebook_ig",
  "accountName": "Demo Account",
  "accountId": "mock_123",
  "status": "active",
  "connectedAt": "2024-01-15T10:00:00Z"
}
```

### 5. List Channels
**Endpoint:** `GET /supabase/functions/channels/list`

**Response:** `200 OK`
```json
{
  "channels": [
    {
      "id": "uuid",
      "provider": "facebook_ig",
      "accountName": "My Instagram",
      "status": "active",
      "connectedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 6. Disconnect Channel
**Endpoint:** `DELETE /supabase/functions/channels/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Channel disconnected"
}
```

---

## Phase 2 — Scheduler

### 7. Create Scheduled Post
**Endpoint:** `POST /supabase/functions/scheduler-publish/create`

**Request:**
```json
{
  "workspaceId": "uuid",
  "caption": "Check out our new product!",
  "assetIds": ["uuid1", "uuid2"],
  "providerTargets": ["channel_uuid_1", "channel_uuid_2"],
  "scheduleAt": "2024-01-20T14:00:00Z",
  "timezone": "Asia/Bangkok"
}
```

**Response:** `201 Created`
```json
{
  "postId": "uuid",
  "status": "scheduled",
  "scheduleAt": "2024-01-20T14:00:00Z",
  "creditsHeld": 2,
  "estimatedCredits": 2
}
```

### 8. List Scheduled Posts
**Endpoint:** `GET /supabase/functions/scheduler-publish/list?status=scheduled&from=2024-01-01&to=2024-12-31`

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Check out our new product!",
      "status": "scheduled",
      "scheduleAt": "2024-01-20T14:00:00Z",
      "providerTargets": ["channel_1", "channel_2"],
      "results": []
    }
  ]
}
```

### 9. Get Post Details
**Endpoint:** `GET /supabase/functions/scheduler-publish/:id`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "caption": "Check out our new product!",
  "status": "published",
  "scheduleAt": "2024-01-20T14:00:00Z",
  "results": [
    {
      "provider": "facebook_ig",
      "channelId": "uuid",
      "success": true,
      "publishedId": "ig_post_123",
      "publishedAt": "2024-01-20T14:01:30Z"
    }
  ],
  "creditsHeld": 2,
  "creditsActual": 2
}
```

### 10. Publish Now
**Endpoint:** `POST /supabase/functions/scheduler-publish/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "status": "queued",
  "message": "Post queued for immediate publishing"
}
```

---

## Phase 2 — Automation

### 11. Create Automation Flow
**Endpoint:** `POST /api/automation/flows`

**Request:**
```json
{
  "workspaceId": "uuid",
  "name": "Auto-generate image on new post",
  "description": "When a new post is created, generate an image",
  "triggerConfig": {
    "type": "post_created"
  },
  "conditionsConfig": [
    {
      "field": "contentType",
      "operator": "equals",
      "value": "article"
    }
  ],
  "actionsConfig": [
    {
      "type": "generate_image",
      "params": {
        "prompt": "Generate hero image for: {{content.title}}"
      }
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "flowId": "uuid",
  "name": "Auto-generate image on new post",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 12. Test Automation Flow
**Endpoint:** `POST /supabase/functions/automation-engine/test-run`

**Request:**
```json
{
  "flowId": "uuid",
  "testData": {
    "contentId": "uuid",
    "title": "New Blog Post",
    "contentType": "article"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "steps": [
    {
      "type": "trigger",
      "status": "matched",
      "data": {"contentId": "uuid"}
    },
    {
      "type": "condition",
      "status": "passed",
      "condition": "contentType equals article"
    },
    {
      "type": "action",
      "status": "would_execute",
      "action": "generate_image"
    }
  ]
}
```

### 13. List Automation Runs
**Endpoint:** `GET /supabase/functions/automation-engine/runs?flowId=uuid`

**Response:** `200 OK`
```json
{
  "runs": [
    {
      "id": "uuid",
      "flowId": "uuid",
      "status": "completed",
      "startedAt": "2024-01-15T10:05:00Z",
      "finishedAt": "2024-01-15T10:05:30Z",
      "steps": [...],
      "creditsHeld": 2,
      "creditsActual": 2
    }
  ]
}
```

### 14. Trigger Automation Flow
**Endpoint:** `POST /supabase/functions/automation-engine/trigger`

**Request:**
```json
{
  "flowId": "uuid",
  "triggerData": {
    "contentId": "uuid",
    "event": "post_created"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "runId": "uuid",
  "status": "running",
  "creditsHeld": 2
}
```

---

## Billing & Credits

### 15. Get Wallet Balance
**Endpoint:** `GET /api/billing/wallet?workspaceId=uuid`

**Response:** `200 OK`
```json
{
  "workspaceId": "uuid",
  "balance": 1000,
  "heldBalance": 50,
  "plan": "pro",
  "planCreditsMonthly": 500,
  "billingCycleStart": "2024-01-01"
}
```

### 16. Get Usage History
**Endpoint:** `GET /api/billing/usage?workspaceId=uuid&feature=publish`

**Response:** `200 OK`
```json
{
  "entries": [
    {
      "id": "uuid",
      "transactionType": "finalize",
      "amount": -2,
      "balanceAfter": 998,
      "description": "Published to 2 channels",
      "createdAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

---

## Credit Pricing

| Feature | Credits | Notes |
|---------|---------|-------|
| Text Generation | 1 | Per prompt |
| Image Generation | 3-10 | Based on size/quality |
| Video Generation | 15-50 | Based on duration |
| Voice Generation | 1 | Per 30 seconds |
| Publish (per target) | 1 | Per social media channel |
| Automation Trigger | 1 | Per execution |
| Automation Action | 1 | Per action executed |

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request",
  "message": "Missing required field: prompt"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this action"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
