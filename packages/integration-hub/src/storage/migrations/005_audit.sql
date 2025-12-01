-- ============================================================================
-- Phase 9B: Audit Logging System
-- Enterprise audit trail with integrity verification
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AUDIT EVENTS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_events (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Classification
  category VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  result VARCHAR(16) NOT NULL DEFAULT 'success',

  -- Details
  description TEXT NOT NULL,
  message TEXT,

  -- Context (JSON)
  context JSONB NOT NULL DEFAULT '{}',

  -- Resource (optional)
  resource_type VARCHAR(64),
  resource_id VARCHAR(64),
  resource_name VARCHAR(255),
  resource_attributes JSONB,

  -- Changes (for update events)
  changes JSONB,

  -- Additional metadata
  metadata JSONB,

  -- Error info (for failures)
  error_code VARCHAR(64),
  error_message TEXT,

  -- Retention
  retention_days INTEGER DEFAULT 90,
  expires_at TIMESTAMPTZ,

  -- Integrity chain
  hash VARCHAR(128),
  previous_hash VARCHAR(128),

  -- Indexes
  CONSTRAINT valid_category CHECK (category IN (
    'auth', 'organization', 'member', 'pipeline', 'schedule',
    'budget', 'webhook', 'settings', 'api', 'security', 'system'
  )),
  CONSTRAINT valid_severity CHECK (severity IN (
    'debug', 'info', 'warning', 'error', 'critical'
  )),
  CONSTRAINT valid_result CHECK (result IN (
    'success', 'failure', 'partial', 'pending'
  ))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_org_timestamp ON audit_events(org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_result ON audit_events(result);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_expires ON audit_events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events((context->>'userId'));
CREATE INDEX IF NOT EXISTS idx_audit_search ON audit_events USING gin(to_tsvector('english', description));

-- ----------------------------------------------------------------------------
-- AUDIT RETENTION POLICIES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,

  category VARCHAR(32) NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 90,
  archive_after_days INTEGER,
  delete_after_archive BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, category)
);

-- ----------------------------------------------------------------------------
-- AUDIT ARCHIVES (for long-term storage)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_archives (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,

  -- Archive metadata
  archive_name VARCHAR(255) NOT NULL,
  archive_date DATE NOT NULL,

  -- Date range covered
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Stats
  event_count INTEGER NOT NULL,
  file_size_bytes BIGINT,

  -- Storage location
  storage_type VARCHAR(32) DEFAULT 'local',
  storage_path TEXT,
  storage_url TEXT,

  -- Integrity
  checksum VARCHAR(128),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_archives_org ON audit_archives(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_archives_date ON audit_archives(archive_date DESC);

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function: Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_org_id VARCHAR(64),
  p_category VARCHAR(32),
  p_action VARCHAR(32),
  p_severity VARCHAR(16),
  p_result VARCHAR(16),
  p_description TEXT,
  p_context JSONB DEFAULT '{}',
  p_resource_type VARCHAR(64) DEFAULT NULL,
  p_resource_id VARCHAR(64) DEFAULT NULL,
  p_resource_name VARCHAR(255) DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_error_code VARCHAR(64) DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_retention_days INTEGER DEFAULT NULL
) RETURNS VARCHAR(64) AS $$
DECLARE
  v_id VARCHAR(64);
  v_retention INTEGER;
  v_expires TIMESTAMPTZ;
  v_previous_hash VARCHAR(128);
BEGIN
  -- Generate ID
  v_id := 'aud_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(random()::text), 1, 9);

  -- Get retention days (from policy or default)
  SELECT COALESCE(
    p_retention_days,
    (SELECT retention_days FROM audit_retention_policies WHERE org_id = p_org_id AND category = p_category),
    CASE p_category
      WHEN 'auth' THEN 365
      WHEN 'organization' THEN 730
      WHEN 'member' THEN 365
      WHEN 'security' THEN 730
      WHEN 'api' THEN 30
      ELSE 90
    END
  ) INTO v_retention;

  -- Calculate expiration
  v_expires := NOW() + (v_retention || ' days')::INTERVAL;

  -- Get previous hash for chain integrity
  SELECT hash INTO v_previous_hash
  FROM audit_events
  WHERE org_id = p_org_id
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Insert event
  INSERT INTO audit_events (
    id, org_id, category, action, severity, result,
    description, context, resource_type, resource_id, resource_name,
    changes, error_code, error_message, retention_days, expires_at, previous_hash
  ) VALUES (
    v_id, p_org_id, p_category, p_action, p_severity, p_result,
    p_description, p_context, p_resource_type, p_resource_id, p_resource_name,
    p_changes, p_error_code, p_error_message, v_retention, v_expires, v_previous_hash
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Query audit events with pagination
CREATE OR REPLACE FUNCTION query_audit_events(
  p_org_id VARCHAR(64),
  p_category VARCHAR(32) DEFAULT NULL,
  p_action VARCHAR(32) DEFAULT NULL,
  p_severity VARCHAR(16) DEFAULT NULL,
  p_result VARCHAR(16) DEFAULT NULL,
  p_user_id VARCHAR(64) DEFAULT NULL,
  p_resource_type VARCHAR(64) DEFAULT NULL,
  p_resource_id VARCHAR(64) DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id VARCHAR(64),
  timestamp TIMESTAMPTZ,
  category VARCHAR(32),
  action VARCHAR(32),
  severity VARCHAR(16),
  result VARCHAR(16),
  description TEXT,
  context JSONB,
  resource_type VARCHAR(64),
  resource_id VARCHAR(64),
  resource_name VARCHAR(255),
  changes JSONB,
  error_code VARCHAR(64),
  error_message TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT e.*
    FROM audit_events e
    WHERE e.org_id = p_org_id
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_action IS NULL OR e.action = p_action)
      AND (p_severity IS NULL OR e.severity = p_severity)
      AND (p_result IS NULL OR e.result = p_result)
      AND (p_user_id IS NULL OR e.context->>'userId' = p_user_id)
      AND (p_resource_type IS NULL OR e.resource_type = p_resource_type)
      AND (p_resource_id IS NULL OR e.resource_id = p_resource_id)
      AND (p_start_date IS NULL OR e.timestamp >= p_start_date)
      AND (p_end_date IS NULL OR e.timestamp <= p_end_date)
      AND (p_search IS NULL OR to_tsvector('english', e.description) @@ plainto_tsquery('english', p_search))
  ),
  counted AS (
    SELECT COUNT(*) AS cnt FROM filtered
  )
  SELECT
    f.id,
    f.timestamp,
    f.category,
    f.action,
    f.severity,
    f.result,
    f.description,
    f.context,
    f.resource_type,
    f.resource_id,
    f.resource_name,
    f.changes,
    f.error_code,
    f.error_message,
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY f.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Get audit statistics
CREATE OR REPLACE FUNCTION get_audit_stats(
  p_org_id VARCHAR(64),
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := NOW() - (p_days || ' days')::INTERVAL;

  SELECT jsonb_build_object(
    'totalEvents', COUNT(*),
    'eventsByCategory', (
      SELECT jsonb_object_agg(category, cnt)
      FROM (SELECT category, COUNT(*) as cnt FROM audit_events WHERE org_id = p_org_id AND timestamp >= v_start_date GROUP BY category) s
    ),
    'eventsBySeverity', (
      SELECT jsonb_object_agg(severity, cnt)
      FROM (SELECT severity, COUNT(*) as cnt FROM audit_events WHERE org_id = p_org_id AND timestamp >= v_start_date GROUP BY severity) s
    ),
    'eventsByResult', (
      SELECT jsonb_object_agg(result, cnt)
      FROM (SELECT result, COUNT(*) as cnt FROM audit_events WHERE org_id = p_org_id AND timestamp >= v_start_date GROUP BY result) s
    ),
    'topUsers', (
      SELECT jsonb_agg(jsonb_build_object('userId', user_id, 'eventCount', cnt))
      FROM (
        SELECT context->>'userId' as user_id, COUNT(*) as cnt
        FROM audit_events
        WHERE org_id = p_org_id AND timestamp >= v_start_date AND context->>'userId' IS NOT NULL
        GROUP BY context->>'userId'
        ORDER BY cnt DESC
        LIMIT 10
      ) s
    ),
    'recentActivity', (
      SELECT jsonb_agg(jsonb_build_object('date', dt, 'count', cnt))
      FROM (
        SELECT DATE(timestamp) as dt, COUNT(*) as cnt
        FROM audit_events
        WHERE org_id = p_org_id AND timestamp >= v_start_date
        GROUP BY DATE(timestamp)
        ORDER BY dt
      ) s
    )
  ) INTO v_result
  FROM audit_events
  WHERE org_id = p_org_id AND timestamp >= v_start_date;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function: Apply retention and cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_audit_events()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM audit_events
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function: Verify audit chain integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity(
  p_org_id VARCHAR(64),
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  total_events BIGINT,
  valid_events BIGINT,
  invalid_events BIGINT,
  broken_chain BOOLEAN,
  first_break_at TIMESTAMPTZ
) AS $$
DECLARE
  v_prev_hash VARCHAR(128) := NULL;
  v_record RECORD;
  v_broken_at TIMESTAMPTZ := NULL;
  v_total BIGINT := 0;
  v_invalid BIGINT := 0;
BEGIN
  FOR v_record IN
    SELECT e.id, e.timestamp, e.hash, e.previous_hash
    FROM audit_events e
    WHERE e.org_id = p_org_id
      AND (p_start_date IS NULL OR e.timestamp >= p_start_date)
      AND (p_end_date IS NULL OR e.timestamp <= p_end_date)
    ORDER BY e.timestamp ASC
  LOOP
    v_total := v_total + 1;

    -- Check chain link
    IF v_prev_hash IS NOT NULL AND v_record.previous_hash != v_prev_hash THEN
      v_invalid := v_invalid + 1;
      IF v_broken_at IS NULL THEN
        v_broken_at := v_record.timestamp;
      END IF;
    END IF;

    v_prev_hash := v_record.hash;
  END LOOP;

  total_events := v_total;
  valid_events := v_total - v_invalid;
  invalid_events := v_invalid;
  broken_chain := v_invalid > 0;
  first_break_at := v_broken_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- VIEWS
-- ----------------------------------------------------------------------------

-- View: Recent audit events
CREATE OR REPLACE VIEW v_recent_audit_events AS
SELECT
  ae.id,
  ae.org_id,
  ae.timestamp,
  ae.category,
  ae.action,
  ae.severity,
  ae.result,
  ae.description,
  ae.context->>'userId' as user_id,
  ae.context->>'userEmail' as user_email,
  ae.resource_type,
  ae.resource_id,
  ae.resource_name,
  ae.error_code,
  o.name as org_name
FROM audit_events ae
LEFT JOIN organizations o ON o.id = ae.org_id
ORDER BY ae.timestamp DESC;

-- View: Security events
CREATE OR REPLACE VIEW v_security_events AS
SELECT *
FROM audit_events
WHERE category = 'security'
   OR severity IN ('error', 'critical')
   OR result = 'failure'
ORDER BY timestamp DESC;

-- View: User activity summary
CREATE OR REPLACE VIEW v_user_activity AS
SELECT
  org_id,
  context->>'userId' as user_id,
  context->>'userEmail' as user_email,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE result = 'success') as successful_events,
  COUNT(*) FILTER (WHERE result = 'failure') as failed_events,
  MAX(timestamp) as last_activity,
  MIN(timestamp) as first_activity,
  COUNT(DISTINCT category) as categories_accessed
FROM audit_events
WHERE context->>'userId' IS NOT NULL
GROUP BY org_id, context->>'userId', context->>'userEmail';

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_archives ENABLE ROW LEVEL SECURITY;

-- Policies for audit_events
CREATE POLICY audit_events_select_policy ON audit_events
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
    AND (
      SELECT role FROM org_members
      WHERE org_id = audit_events.org_id
        AND user_id = current_setting('app.user_id', true)
    ) IN ('owner', 'admin')
  );

CREATE POLICY audit_events_insert_policy ON audit_events
  FOR INSERT
  WITH CHECK (true);  -- Allow system inserts

-- Policies for retention policies (admins only)
CREATE POLICY retention_policies_all ON audit_retention_policies
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = current_setting('app.user_id', true)
        AND role IN ('owner', 'admin')
    )
  );

-- Policies for archives (admins only)
CREATE POLICY archives_all ON audit_archives
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = current_setting('app.user_id', true)
        AND role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger: Update hash on insert
CREATE OR REPLACE FUNCTION update_audit_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hash IS NULL THEN
    NEW.hash := encode(
      sha256(
        (NEW.id || NEW.timestamp || NEW.category || NEW.action || NEW.description || COALESCE(NEW.previous_hash, ''))::bytea
      ),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_hash
  BEFORE INSERT ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_hash();

-- Trigger: Calculate expiration
CREATE OR REPLACE FUNCTION calculate_audit_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL AND NEW.retention_days IS NOT NULL THEN
    NEW.expires_at := NOW() + (NEW.retention_days || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_expiration
  BEFORE INSERT ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_expiration();

-- ----------------------------------------------------------------------------
-- INSERT DEFAULT RETENTION POLICIES (global)
-- ----------------------------------------------------------------------------

-- Note: These will be created per-org when needed, but we define defaults here
COMMENT ON TABLE audit_retention_policies IS
  'Default retention: auth=365, org=730, member=365, pipeline=90, schedule=90, budget=365, webhook=90, settings=365, api=30, security=730, system=365';
