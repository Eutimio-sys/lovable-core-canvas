# RBAC & RLS Policy Guide

## Overview

This guide explains the Role-Based Access Control (RBAC) and Row-Level Security (RLS) implementation in the AI Content Platform.

---

## 🎭 Roles

### 7 Predefined Roles

| Role | Key | Description |
|------|-----|-------------|
| Owner | `owner` | Full access to workspace, can transfer ownership |
| Admin | `admin` | Can manage members, settings, and all content |
| Publisher | `publisher` | Can create, edit, and publish content |
| Creator | `creator` | Can create own content only |
| Analyst | `analyst` | Read-only access to analytics and reports |
| Finance | `finance` | Can view/manage billing and credits |
| Guest | `guest` | Limited read-only access |

---

## 📊 Permission Matrix

### Content Operations

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Content | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Create Content | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Own Content | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit All Content | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Content | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Media & Assets

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Generate Assets | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Assets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Scheduling & Publishing

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Create Schedule | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish Now | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel Schedule | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Social Connections

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Channels | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Connect Channels | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Disconnect Channels | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Automation

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Flows | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create/Edit Flows | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Enable/Disable | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Test Runs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Team Management

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Billing & Analytics

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Wallet | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Purchase Credits | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Change Plan | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Settings & Security

| Permission | Owner | Admin | Publisher | Creator | Analyst | Finance | Guest |
|------------|-------|-------|-----------|---------|---------|---------|-------|
| View Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔒 RLS Policies

### Core Pattern: Workspace Membership Check

Most policies follow this pattern:

```sql
-- Check if user has workspace access
CREATE OR REPLACE FUNCTION user_has_workspace_access(
  _user_id uuid,
  _workspace_id uuid
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = _workspace_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM memberships 
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION user_is_workspace_admin(
  _user_id uuid,
  _workspace_id uuid
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships 
    WHERE workspace_id = _workspace_id 
    AND user_id = _user_id 
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Example Policies by Table

#### Contents Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view workspace content"
ON contents FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- INSERT: Creators+ can create
CREATE POLICY "Creators can create content"
ON contents FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'publisher', 'creator')
  )
  AND created_by = auth.uid()
);

-- UPDATE: Creators can edit own, Publishers+ can edit all
CREATE POLICY "Users can update content"
ON contents FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND (
      role IN ('owner', 'admin', 'publisher')
      OR (role = 'creator' AND contents.created_by = auth.uid())
    )
  )
);
```

#### Assets Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view workspace assets"
ON assets FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- INSERT: Creators+ can create
CREATE POLICY "Creators can create assets"
ON assets FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'publisher', 'creator')
  )
  AND created_by = auth.uid()
);
```

#### Scheduled Posts Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view scheduled posts"
ON scheduled_posts FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- INSERT: Creators+ can create
CREATE POLICY "Creators can create scheduled posts"
ON scheduled_posts FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'publisher', 'creator')
  )
);

-- UPDATE: Publishers+ can update
CREATE POLICY "Publishers can update scheduled posts"
ON scheduled_posts FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'publisher')
  )
);

-- DELETE: Admins+ can delete
CREATE POLICY "Admins can delete scheduled posts"
ON scheduled_posts FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);
```

#### Channels Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view channels"
ON channels FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- ALL: Admins+ can manage
CREATE POLICY "Admins can manage channels"
ON channels FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);
```

#### Automation Flows Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view automation flows"
ON automation_flows FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- ALL: Admins+ can manage
CREATE POLICY "Admins can manage automation flows"
ON automation_flows FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'publisher')
  )
);
```

#### Wallets Table

```sql
-- SELECT: All workspace members can view
CREATE POLICY "Users can view wallet"
ON wallets FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- UPDATE: Finance/Admin/Owner can update
CREATE POLICY "Finance can manage wallet"
ON wallets FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'finance')
  )
);
```

#### Audit Logs Table

```sql
-- SELECT: Analysts+ can view
CREATE POLICY "Analysts can view audit logs"
ON audit_logs FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'analyst')
  )
);
```

---

## 🧪 Testing RLS Policies

### Test Cases

```sql
-- Test 1: Creator can view workspace content
SELECT * FROM contents WHERE workspace_id = 'test-workspace-id';
-- Expected: Returns content from their workspace

-- Test 2: Creator can create content
INSERT INTO contents (workspace_id, title, content, created_by)
VALUES ('test-workspace-id', 'Test', 'Content', auth.uid());
-- Expected: Success

-- Test 3: Creator cannot edit others' content
UPDATE contents SET title = 'Hacked' 
WHERE created_by != auth.uid();
-- Expected: 0 rows updated

-- Test 4: Publisher can edit all content
UPDATE contents SET title = 'Edited' 
WHERE workspace_id = 'test-workspace-id';
-- Expected: Success (if user is publisher)

-- Test 5: Guest cannot create content
INSERT INTO contents (workspace_id, title, content, created_by)
VALUES ('test-workspace-id', 'Test', 'Content', auth.uid());
-- Expected: RLS policy violation (if user is guest)
```

---

## 🚨 Security Best Practices

### ✅ Do's

1. **Always filter by workspace_id** in queries
2. **Use helper functions** for common checks
3. **Test policies** with different roles
4. **Use `created_by = auth.uid()`** for ownership checks
5. **Combine SELECT and UPDATE/DELETE** policies carefully
6. **Enable RLS on all tables** with sensitive data

### ❌ Don'ts

1. **Don't bypass RLS** with `security definer` functions
2. **Don't use `true` or `1=1`** in policies
3. **Don't forget to check** `created_by` field
4. **Don't expose** cross-workspace data
5. **Don't allow anonymous** access to user data

---

## 📝 Implementation Checklist

- [x] Define 7 standard roles
- [x] Create helper functions (`user_has_workspace_access`, `user_is_workspace_admin`)
- [x] Enable RLS on all tables
- [x] Create SELECT policies for all tables
- [x] Create INSERT policies with role checks
- [x] Create UPDATE policies with ownership/role checks
- [x] Create DELETE policies with admin checks
- [x] Test policies with different roles
- [x] Document permission matrix
- [x] Add audit logging for sensitive operations

---

## 🔗 Related Files

- `supabase/migrations/` - Database schema and policies
- `src/types/index.ts` - TypeScript role definitions
- `src/hooks/useAuth.tsx` - Authentication context
- `src/hooks/useWorkspace.tsx` - Workspace context with role checks
