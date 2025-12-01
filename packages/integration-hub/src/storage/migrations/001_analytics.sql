-- Pipeline Analytics Schema
-- Run this in Supabase SQL Editor to set up analytics tables

-- =========================================================================
-- PIPELINE EXECUTIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT UNIQUE NOT NULL,
  pipeline_id TEXT NOT NULL,
  pipeline_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_tokens INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  llm_cost DECIMAL(10,6) DEFAULT 0,
  api_cost DECIMAL(10,6) DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_executions_pipeline_id ON pipeline_executions(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON pipeline_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON pipeline_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_executions_execution_id ON pipeline_executions(execution_id);

-- =========================================================================
-- DAILY ANALYTICS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS daily_analytics (
  date DATE PRIMARY KEY,
  total_executions INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  cancelled INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  by_pipeline JSONB DEFAULT '{}',
  by_tool JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- WEBHOOK CONFIGURATIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['pipeline.completed'],
  enabled BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 5000,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhook_configs(enabled);

-- =========================================================================
-- WEBHOOK DELIVERIES TABLE (for audit/debugging)
-- =========================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  attempts INTEGER DEFAULT 0,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON webhook_deliveries(created_at);

-- =========================================================================
-- PIPELINE TEMPLATES TABLE (for user-saved pipelines)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pipeline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  steps JSONB NOT NULL,
  default_inputs JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  avg_cost DECIMAL(10,6),
  avg_duration_ms INTEGER,
  success_rate DECIMAL(5,2),
  author TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON pipeline_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON pipeline_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON pipeline_templates(usage_count DESC);

-- =========================================================================
-- FUNCTIONS
-- =========================================================================

-- Function to update daily analytics when execution completes
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
  exec_date DATE;
  day_stats RECORD;
BEGIN
  -- Only process completed/failed/cancelled executions
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status = 'running' THEN
    exec_date := DATE(NEW.started_at);

    -- Upsert daily analytics
    INSERT INTO daily_analytics (date, total_executions, successful, failed, cancelled, total_tokens, input_tokens, output_tokens, total_cost, avg_duration_ms)
    VALUES (
      exec_date,
      1,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
      COALESCE(NEW.total_tokens, 0),
      COALESCE(NEW.input_tokens, 0),
      COALESCE(NEW.output_tokens, 0),
      COALESCE(NEW.total_cost, 0),
      COALESCE(NEW.duration_ms, 0)
    )
    ON CONFLICT (date) DO UPDATE SET
      total_executions = daily_analytics.total_executions + 1,
      successful = daily_analytics.successful + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      failed = daily_analytics.failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      cancelled = daily_analytics.cancelled + CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
      total_tokens = daily_analytics.total_tokens + COALESCE(NEW.total_tokens, 0),
      input_tokens = daily_analytics.input_tokens + COALESCE(NEW.input_tokens, 0),
      output_tokens = daily_analytics.output_tokens + COALESCE(NEW.output_tokens, 0),
      total_cost = daily_analytics.total_cost + COALESCE(NEW.total_cost, 0),
      avg_duration_ms = (daily_analytics.avg_duration_ms * daily_analytics.total_executions + COALESCE(NEW.duration_ms, 0)) / (daily_analytics.total_executions + 1),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update daily analytics
DROP TRIGGER IF EXISTS trigger_update_daily_analytics ON pipeline_executions;
CREATE TRIGGER trigger_update_daily_analytics
  AFTER UPDATE ON pipeline_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_executions_updated ON pipeline_executions;
CREATE TRIGGER trigger_executions_updated
  BEFORE UPDATE ON pipeline_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_webhooks_updated ON webhook_configs;
CREATE TRIGGER trigger_webhooks_updated
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_templates_updated ON pipeline_templates;
CREATE TRIGGER trigger_templates_updated
  BEFORE UPDATE ON pipeline_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================
-- Enable RLS on all tables (optional, for multi-tenant scenarios)
-- ALTER TABLE pipeline_executions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pipeline_templates ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SAMPLE DATA (optional, for testing)
-- =========================================================================
-- INSERT INTO pipeline_templates (name, description, category, steps, is_public, tags)
-- VALUES
--   ('Research & Analyze', 'Hunt for opportunities and analyze them', 'research',
--    '[{"id":"hunt","tool":"hunter_discover","inputs":{}},{"id":"score","tool":"hunter_score","dependsOn":["hunt"]}]'::jsonb,
--    true, ARRAY['research', 'crypto', 'analysis']),
--   ('Content Generation', 'Generate blog post with SEO optimization', 'content',
--    '[{"id":"keywords","tool":"growth_keyword_research"},{"id":"blog","tool":"growth_generate_blog","dependsOn":["keywords"]}]'::jsonb,
--    true, ARRAY['content', 'seo', 'blog']);

COMMENT ON TABLE pipeline_executions IS 'Stores all pipeline execution history with costs and tokens';
COMMENT ON TABLE daily_analytics IS 'Aggregated daily statistics for dashboard';
COMMENT ON TABLE webhook_configs IS 'Webhook endpoint configurations for notifications';
COMMENT ON TABLE webhook_deliveries IS 'Audit log of webhook delivery attempts';
COMMENT ON TABLE pipeline_templates IS 'User-saved and community pipeline templates';
