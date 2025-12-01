-- Pipeline Schedules Schema
-- Migration: 002_schedules.sql

-- =========================================================================
-- SCHEDULES TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS pipeline_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL,
  pipeline_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled', 'error')),
  inputs JSONB DEFAULT '{}',
  max_retries INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 300000,
  webhook_url TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('completed', 'failed', 'cancelled')),
  run_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schedules_pipeline ON pipeline_schedules(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON pipeline_schedules(status) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON pipeline_schedules(next_run) WHERE enabled = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_schedules_tags ON pipeline_schedules USING GIN(tags);

-- =========================================================================
-- SCHEDULE EXECUTIONS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS schedule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES pipeline_schedules(id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL,
  execution_id TEXT, -- Links to pipeline_executions
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  attempt INTEGER DEFAULT 1,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_exec_schedule ON schedule_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exec_status ON schedule_executions(status);
CREATE INDEX IF NOT EXISTS idx_schedule_exec_scheduled ON schedule_executions(scheduled_at);

-- =========================================================================
-- HELPER FUNCTION: Update schedule timestamp
-- =========================================================================

CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_schedule_timestamp ON pipeline_schedules;
CREATE TRIGGER trigger_update_schedule_timestamp
  BEFORE UPDATE ON pipeline_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_timestamp();

-- =========================================================================
-- SAMPLE DATA (for development/testing)
-- =========================================================================

-- Uncomment below to insert sample schedules:
/*
INSERT INTO pipeline_schedules (pipeline_id, pipeline_name, name, description, cron_expression, timezone, enabled)
VALUES
  ('research-and-analyze', 'Research & Analyze', 'Daily Research', 'Run crypto research every morning', '0 9 * * *', 'America/New_York', true),
  ('content-generation', 'Content Generation', 'Weekly Blog', 'Generate blog posts every Monday', '0 10 * * 1', 'UTC', true),
  ('security-audit', 'Security Audit', 'Nightly Security Scan', 'Run security audits overnight', '0 2 * * *', 'UTC', false);
*/

-- =========================================================================
-- VIEWS
-- =========================================================================

-- View: Active schedules with next run info
CREATE OR REPLACE VIEW v_active_schedules AS
SELECT
  s.id,
  s.name,
  s.pipeline_name,
  s.cron_expression,
  s.timezone,
  s.next_run,
  s.last_run,
  s.last_status,
  s.run_count,
  s.consecutive_failures,
  (
    SELECT COUNT(*)::INTEGER
    FROM schedule_executions e
    WHERE e.schedule_id = s.id AND e.status = 'completed'
  ) as successful_runs,
  (
    SELECT COUNT(*)::INTEGER
    FROM schedule_executions e
    WHERE e.schedule_id = s.id AND e.status = 'failed'
  ) as failed_runs
FROM pipeline_schedules s
WHERE s.enabled = true AND s.status = 'active'
ORDER BY s.next_run ASC NULLS LAST;

-- View: Schedule execution history
CREATE OR REPLACE VIEW v_schedule_history AS
SELECT
  e.id,
  e.schedule_id,
  s.name as schedule_name,
  s.pipeline_name,
  e.status,
  e.scheduled_at,
  e.started_at,
  e.completed_at,
  EXTRACT(EPOCH FROM (e.completed_at - e.started_at)) * 1000 as duration_ms,
  e.error,
  e.attempt
FROM schedule_executions e
JOIN pipeline_schedules s ON s.id = e.schedule_id
ORDER BY e.scheduled_at DESC;

-- =========================================================================
-- FUNCTIONS
-- =========================================================================

-- Function: Get upcoming scheduled runs
CREATE OR REPLACE FUNCTION get_upcoming_runs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  schedule_id UUID,
  schedule_name TEXT,
  pipeline_id TEXT,
  pipeline_name TEXT,
  next_run TIMESTAMPTZ,
  cron_expression TEXT,
  timezone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.pipeline_id,
    s.pipeline_name,
    s.next_run,
    s.cron_expression,
    s.timezone
  FROM pipeline_schedules s
  WHERE s.enabled = true
    AND s.status = 'active'
    AND s.next_run IS NOT NULL
  ORDER BY s.next_run ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get schedule statistics
CREATE OR REPLACE FUNCTION get_schedule_stats()
RETURNS TABLE (
  total_schedules BIGINT,
  active_schedules BIGINT,
  paused_schedules BIGINT,
  total_runs BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM pipeline_schedules) as total_schedules,
    (SELECT COUNT(*) FROM pipeline_schedules WHERE status = 'active' AND enabled = true) as active_schedules,
    (SELECT COUNT(*) FROM pipeline_schedules WHERE status = 'paused') as paused_schedules,
    (SELECT COUNT(*) FROM schedule_executions WHERE status IN ('completed', 'failed')) as total_runs,
    (SELECT COUNT(*) FROM schedule_executions WHERE status = 'completed') as successful_runs,
    (SELECT COUNT(*) FROM schedule_executions WHERE status = 'failed') as failed_runs,
    CASE
      WHEN (SELECT COUNT(*) FROM schedule_executions WHERE status IN ('completed', 'failed')) > 0
      THEN ROUND(
        (SELECT COUNT(*)::NUMERIC FROM schedule_executions WHERE status = 'completed') /
        (SELECT COUNT(*)::NUMERIC FROM schedule_executions WHERE status IN ('completed', 'failed')) * 100,
        2
      )
      ELSE 0
    END as success_rate;
END;
$$ LANGUAGE plpgsql;
