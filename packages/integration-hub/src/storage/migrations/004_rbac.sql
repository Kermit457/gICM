-- Migration: 004_rbac
-- Multi-Tenancy & Role-Based Access Control
-- Phase 9A: Enterprise Security Foundation

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,

  -- Plan & billing
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  billing_email VARCHAR(255),
  stripe_customer_id VARCHAR(255),

  -- Settings (plan-based limits and preferences)
  settings JSONB DEFAULT '{
    "maxPipelines": 10,
    "maxMembers": 5,
    "maxSchedules": 5,
    "maxBudgets": 3,
    "auditLogRetentionDays": 30,
    "apiRateLimit": 100,
    "webhooksEnabled": true,
    "ssoEnabled": false,
    "notifyOnBudgetAlert": true,
    "notifyOnPipelineFailure": true,
    "notifyOnNewMember": true
  }'::jsonb,

  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Role & permissions
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  custom_permissions TEXT[], -- Override role permissions

  -- User info (denormalized for display)
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),

  -- Metadata
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one membership per user per org
  UNIQUE(org_id, user_id)
);

-- Indexes for org_members
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(org_id, role);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON org_members(email);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON org_members(status) WHERE status = 'active';

-- ============================================================================
-- ORGANIZATION INVITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),

  -- Token for accepting invite
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),

  -- Metadata
  invited_by UUID NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,

  -- Personalization
  message TEXT
);

-- Indexes for org_invites
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON org_invites(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_org_invites_status ON org_invites(status, expires_at) WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see orgs they are members of
CREATE POLICY org_select_policy ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Organizations: Only owners can update
CREATE POLICY org_update_policy ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

-- Organizations: Only owners can delete
CREATE POLICY org_delete_policy ON organizations
  FOR DELETE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

-- Org members: Users can see members of their orgs
CREATE POLICY members_select_policy ON org_members
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members m2
      WHERE m2.user_id = auth.uid() AND m2.status = 'active'
    )
  );

-- Org members: Admins and owners can insert/update/delete
CREATE POLICY members_modify_policy ON org_members
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members m2
      WHERE m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'admin')
        AND m2.status = 'active'
    )
  );

-- Invites: Admins and owners can manage invites
CREATE POLICY invites_policy ON org_invites
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members m2
      WHERE m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'admin')
        AND m2.status = 'active'
    )
  );

-- ============================================================================
-- ADD ORG_ID TO EXISTING TABLES (for tenant isolation)
-- ============================================================================

-- Add org_id to pipelines (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipelines') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipelines' AND column_name = 'org_id') THEN
      ALTER TABLE pipelines ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_pipelines_org ON pipelines(org_id);
    END IF;
  END IF;
END $$;

-- Add org_id to schedules (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'org_id') THEN
      ALTER TABLE schedules ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_schedules_org ON schedules(org_id);
    END IF;
  END IF;
END $$;

-- Add org_id to budgets (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'org_id') THEN
      ALTER TABLE budgets ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_budgets_org ON budgets(org_id);
    END IF;
  END IF;
END $$;

-- Add org_id to webhooks (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'org_id') THEN
      ALTER TABLE webhooks ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(org_id);
    END IF;
  END IF;
END $$;

-- Add org_id to marketplace_templates (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_templates') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_templates' AND column_name = 'org_id') THEN
      ALTER TABLE marketplace_templates ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_marketplace_templates_org ON marketplace_templates(org_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Organization members with org info
CREATE OR REPLACE VIEW v_org_members AS
SELECT
  m.*,
  o.name as org_name,
  o.slug as org_slug,
  o.plan as org_plan
FROM org_members m
JOIN organizations o ON o.id = m.org_id
WHERE m.status = 'active';

-- View: User organizations (orgs a user belongs to)
CREATE OR REPLACE VIEW v_user_orgs AS
SELECT
  m.user_id,
  m.role,
  o.*,
  m.joined_at as member_since,
  m.last_active_at
FROM org_members m
JOIN organizations o ON o.id = m.org_id
WHERE m.status = 'active';

-- View: Organization stats
CREATE OR REPLACE VIEW v_org_stats AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.plan,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') as member_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending') as pending_invites,
  (o.settings->>'maxMembers')::int as max_members,
  o.created_at,
  o.updated_at
FROM organizations o
LEFT JOIN org_members m ON m.org_id = o.id
LEFT JOIN org_invites i ON i.org_id = o.id
GROUP BY o.id;

-- View: Pending invites with org info
CREATE OR REPLACE VIEW v_pending_invites AS
SELECT
  i.*,
  o.name as org_name,
  o.slug as org_slug,
  inviter.email as inviter_email,
  inviter.display_name as inviter_name
FROM org_invites i
JOIN organizations o ON o.id = i.org_id
LEFT JOIN org_members inviter ON inviter.user_id = i.invited_by AND inviter.org_id = i.org_id
WHERE i.status = 'pending' AND i.expires_at > NOW();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Check if user has permission in org
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_member org_members%ROWTYPE;
  v_role_permissions TEXT[];
BEGIN
  -- Get member
  SELECT * INTO v_member
  FROM org_members
  WHERE user_id = p_user_id AND org_id = p_org_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Define role permissions (simplified - in production use a lookup table)
  CASE v_member.role
    WHEN 'owner' THEN
      RETURN TRUE; -- Owner has all permissions
    WHEN 'admin' THEN
      v_role_permissions := ARRAY[
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete', 'pipeline:execute',
        'schedule:create', 'schedule:read', 'schedule:update', 'schedule:delete',
        'budget:create', 'budget:read', 'budget:update', 'budget:delete',
        'member:read', 'member:update', 'member:delete',
        'invite:create', 'invite:read', 'invite:delete',
        'settings:read', 'settings:update',
        'audit:read', 'audit:export'
      ];
    WHEN 'editor' THEN
      v_role_permissions := ARRAY[
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:execute',
        'schedule:create', 'schedule:read', 'schedule:update',
        'budget:create', 'budget:read', 'budget:update',
        'member:read'
      ];
    WHEN 'viewer' THEN
      v_role_permissions := ARRAY[
        'pipeline:read',
        'schedule:read',
        'budget:read',
        'member:read'
      ];
    ELSE
      RETURN FALSE;
  END CASE;

  -- Check custom permissions first
  IF v_member.custom_permissions IS NOT NULL AND p_permission = ANY(v_member.custom_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check role permissions
  RETURN p_permission = ANY(v_role_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's role in org
CREATE OR REPLACE FUNCTION get_user_role(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM org_members
  WHERE user_id = p_user_id AND org_id = p_org_id AND status = 'active';

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Transfer organization ownership
CREATE OR REPLACE FUNCTION transfer_ownership(
  p_org_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_from_member org_members%ROWTYPE;
  v_to_member org_members%ROWTYPE;
BEGIN
  -- Verify from_user is owner
  SELECT * INTO v_from_member
  FROM org_members
  WHERE org_id = p_org_id AND user_id = p_from_user_id AND role = 'owner' AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source user is not the owner of this organization';
  END IF;

  -- Verify to_user is a member
  SELECT * INTO v_to_member
  FROM org_members
  WHERE org_id = p_org_id AND user_id = p_to_user_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user is not a member of this organization';
  END IF;

  -- Transfer ownership
  UPDATE org_members SET role = 'admin' WHERE id = v_from_member.id;
  UPDATE org_members SET role = 'owner' WHERE id = v_to_member.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE org_invites
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at on organizations
CREATE OR REPLACE FUNCTION update_org_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_updated ON organizations;
CREATE TRIGGER trg_org_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_org_timestamp();

-- Trigger: Update last_active_at on member activity
CREATE OR REPLACE FUNCTION update_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE org_members
  SET last_active_at = NOW()
  WHERE user_id = NEW.user_id AND org_id = NEW.org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default organization for existing data (if needed)
-- This should be run manually or via application code
-- INSERT INTO organizations (id, name, slug, created_by)
-- VALUES (gen_random_uuid(), 'Default Organization', 'default', 'system');
