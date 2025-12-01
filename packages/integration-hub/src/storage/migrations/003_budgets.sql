-- Migration: 003_budgets
-- Cost Budgets & Alerts System

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Budget limits
  limit_amount DECIMAL(12, 4) NOT NULL CHECK (limit_amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

  -- Current spending
  current_spend DECIMAL(12, 4) DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Thresholds (JSON array)
  thresholds JSONB DEFAULT '[
    {"percentage": 50, "severity": "info", "action": "notify"},
    {"percentage": 80, "severity": "warning", "action": "warn"},
    {"percentage": 100, "severity": "critical", "action": "pause_pipelines"}
  ]'::jsonb,

  -- Scope
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('global', 'pipeline', 'user', 'team', 'tag')),
  scope_target_id VARCHAR(255),
  scope_tags TEXT[],

  -- Settings
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'exceeded', 'archived')),
  auto_pause_pipelines BOOLEAN DEFAULT true,
  notify_on_exceed BOOLEAN DEFAULT true,
  rollover_unused BOOLEAN DEFAULT false,

  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spending records table
CREATE TABLE IF NOT EXISTS spending_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

  -- Cost details
  amount DECIMAL(12, 6) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Source
  source VARCHAR(20) NOT NULL CHECK (source IN ('pipeline', 'api_call', 'storage', 'compute', 'other')),
  pipeline_id VARCHAR(255),
  execution_id VARCHAR(255),
  step_id VARCHAR(255),

  -- Breakdown (tokens, model, duration)
  breakdown JSONB,

  -- Metadata
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

  -- Alert details
  type VARCHAR(30) NOT NULL CHECK (type IN ('threshold_warning', 'threshold_exceeded', 'anomaly_detected', 'pipeline_expensive', 'rate_limit_warning')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Context
  current_spend DECIMAL(12, 4) NOT NULL,
  budget_limit DECIMAL(12, 4) NOT NULL,
  percentage_used DECIMAL(5, 2) NOT NULL,

  -- Related entities
  pipeline_id VARCHAR(255),
  execution_id VARCHAR(255),

  -- Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(255),

  -- Actions taken
  actions_taken JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_scope ON budgets(scope_type, scope_target_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period_dates ON budgets(period_start, period_end);

-- Indexes for spending records
CREATE INDEX IF NOT EXISTS idx_spending_budget ON spending_records(budget_id);
CREATE INDEX IF NOT EXISTS idx_spending_timestamp ON spending_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_spending_pipeline ON spending_records(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_spending_source ON spending_records(source);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON budget_alerts(acknowledged, created_at DESC) WHERE NOT acknowledged;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON budget_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON budget_alerts(type);

-- View: Active budgets with usage stats
CREATE OR REPLACE VIEW v_budget_status AS
SELECT
  b.*,
  ROUND((b.current_spend / b.limit_amount * 100)::numeric, 2) as percentage_used,
  b.limit_amount - b.current_spend as remaining_amount,
  EXTRACT(DAY FROM (b.period_end - NOW())) as days_remaining,
  (SELECT COUNT(*) FROM budget_alerts ba WHERE ba.budget_id = b.id AND NOT ba.acknowledged) as unack_alerts
FROM budgets b
WHERE b.status = 'active';

-- View: Daily spending aggregation
CREATE OR REPLACE VIEW v_daily_spending AS
SELECT
  budget_id,
  DATE(timestamp) as spend_date,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  source,
  ARRAY_AGG(DISTINCT pipeline_id) FILTER (WHERE pipeline_id IS NOT NULL) as pipelines
FROM spending_records
GROUP BY budget_id, DATE(timestamp), source
ORDER BY spend_date DESC;

-- View: Pipeline spending leaderboard
CREATE OR REPLACE VIEW v_pipeline_spending AS
SELECT
  budget_id,
  pipeline_id,
  SUM(amount) as total_spend,
  COUNT(*) as execution_count,
  AVG(amount) as avg_cost,
  MAX(amount) as max_cost,
  MIN(timestamp) as first_spend,
  MAX(timestamp) as last_spend
FROM spending_records
WHERE pipeline_id IS NOT NULL
GROUP BY budget_id, pipeline_id
ORDER BY total_spend DESC;

-- Function: Record spending and check thresholds
CREATE OR REPLACE FUNCTION record_spending(
  p_budget_id UUID,
  p_amount DECIMAL,
  p_source VARCHAR,
  p_pipeline_id VARCHAR DEFAULT NULL,
  p_execution_id VARCHAR DEFAULT NULL,
  p_breakdown JSONB DEFAULT NULL
)
RETURNS TABLE (
  record_id UUID,
  new_spend DECIMAL,
  percentage DECIMAL,
  threshold_crossed BOOLEAN,
  alert_id UUID
) AS $$
DECLARE
  v_record_id UUID;
  v_budget budgets%ROWTYPE;
  v_new_spend DECIMAL;
  v_percentage DECIMAL;
  v_threshold_crossed BOOLEAN := false;
  v_alert_id UUID := NULL;
  v_threshold JSONB;
BEGIN
  -- Get budget
  SELECT * INTO v_budget FROM budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget not found: %', p_budget_id;
  END IF;

  -- Insert spending record
  INSERT INTO spending_records (budget_id, amount, source, pipeline_id, execution_id, breakdown)
  VALUES (p_budget_id, p_amount, p_source, p_pipeline_id, p_execution_id, p_breakdown)
  RETURNING id INTO v_record_id;

  -- Update budget spend
  v_new_spend := v_budget.current_spend + p_amount;
  UPDATE budgets SET current_spend = v_new_spend, updated_at = NOW() WHERE id = p_budget_id;

  -- Calculate percentage
  v_percentage := ROUND((v_new_spend / v_budget.limit_amount * 100)::numeric, 2);

  -- Check thresholds
  FOR v_threshold IN SELECT * FROM jsonb_array_elements(v_budget.thresholds) ORDER BY (value->>'percentage')::int DESC
  LOOP
    IF v_percentage >= (v_threshold->>'percentage')::int THEN
      v_threshold_crossed := true;

      -- Create alert if threshold just crossed
      IF (v_budget.current_spend / v_budget.limit_amount * 100) < (v_threshold->>'percentage')::int THEN
        INSERT INTO budget_alerts (
          budget_id, type, severity, title, message,
          current_spend, budget_limit, percentage_used,
          pipeline_id, execution_id
        ) VALUES (
          p_budget_id,
          CASE WHEN v_percentage >= 100 THEN 'threshold_exceeded' ELSE 'threshold_warning' END,
          v_threshold->>'severity',
          CASE WHEN v_percentage >= 100
            THEN format('Budget "%s" exceeded!', v_budget.name)
            ELSE format('Budget "%s" at %s%%', v_budget.name, v_percentage)
          END,
          format('Spending reached $%s of $%s limit (%s%%)', v_new_spend, v_budget.limit_amount, v_percentage),
          v_new_spend, v_budget.limit_amount, v_percentage,
          p_pipeline_id, p_execution_id
        ) RETURNING id INTO v_alert_id;

        -- Update budget status if exceeded
        IF v_percentage >= 100 THEN
          UPDATE budgets SET status = 'exceeded' WHERE id = p_budget_id;
        END IF;
      END IF;

      EXIT; -- Only trigger highest threshold
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_record_id, v_new_spend, v_percentage, v_threshold_crossed, v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get budget summary
CREATE OR REPLACE FUNCTION get_budget_summary(p_budget_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_budget budgets%ROWTYPE;
  v_result JSONB;
  v_days_in_period INT;
  v_days_passed INT;
  v_avg_daily DECIMAL;
BEGIN
  SELECT * INTO v_budget FROM budgets WHERE id = p_budget_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_days_in_period := EXTRACT(DAY FROM (v_budget.period_end - v_budget.period_start))::int;
  v_days_passed := GREATEST(1, EXTRACT(DAY FROM (NOW() - v_budget.period_start))::int);
  v_avg_daily := v_budget.current_spend / v_days_passed;

  SELECT jsonb_build_object(
    'budget', row_to_json(v_budget),
    'percentageUsed', ROUND((v_budget.current_spend / v_budget.limit_amount * 100)::numeric, 2),
    'remainingAmount', GREATEST(0, v_budget.limit_amount - v_budget.current_spend),
    'averageDailySpend', ROUND(v_avg_daily::numeric, 4),
    'projectedEndOfPeriod', ROUND((v_avg_daily * v_days_in_period)::numeric, 2),
    'daysRemaining', GREATEST(0, v_days_in_period - v_days_passed),
    'topPipelines', COALESCE((
      SELECT jsonb_agg(p ORDER BY p.total_spend DESC)
      FROM (
        SELECT pipeline_id, SUM(amount) as total_spend
        FROM spending_records
        WHERE budget_id = p_budget_id AND pipeline_id IS NOT NULL
        GROUP BY pipeline_id
        LIMIT 5
      ) p
    ), '[]'::jsonb),
    'recentAlerts', COALESCE((
      SELECT jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC)
      FROM (
        SELECT * FROM budget_alerts WHERE budget_id = p_budget_id LIMIT 5
      ) a
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Reset budget for new period
CREATE OR REPLACE FUNCTION reset_budget_period(p_budget_id UUID)
RETURNS budgets AS $$
DECLARE
  v_budget budgets%ROWTYPE;
  v_rollover DECIMAL := 0;
  v_new_start TIMESTAMPTZ;
  v_new_end TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_budget FROM budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget not found: %', p_budget_id;
  END IF;

  -- Calculate rollover if enabled
  IF v_budget.rollover_unused THEN
    v_rollover := GREATEST(0, v_budget.limit_amount - v_budget.current_spend);
  END IF;

  -- Calculate new period bounds
  CASE v_budget.period
    WHEN 'daily' THEN
      v_new_start := date_trunc('day', NOW());
      v_new_end := v_new_start + interval '1 day' - interval '1 second';
    WHEN 'weekly' THEN
      v_new_start := date_trunc('week', NOW());
      v_new_end := v_new_start + interval '1 week' - interval '1 second';
    WHEN 'monthly' THEN
      v_new_start := date_trunc('month', NOW());
      v_new_end := (v_new_start + interval '1 month') - interval '1 second';
    WHEN 'quarterly' THEN
      v_new_start := date_trunc('quarter', NOW());
      v_new_end := (v_new_start + interval '3 months') - interval '1 second';
    WHEN 'yearly' THEN
      v_new_start := date_trunc('year', NOW());
      v_new_end := (v_new_start + interval '1 year') - interval '1 second';
  END CASE;

  -- Update budget
  UPDATE budgets SET
    current_spend = 0,
    limit_amount = limit_amount + v_rollover,
    period_start = v_new_start,
    period_end = v_new_end,
    status = 'active',
    updated_at = NOW()
  WHERE id = p_budget_id
  RETURNING * INTO v_budget;

  RETURN v_budget;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_budget_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_updated ON budgets;
CREATE TRIGGER trg_budget_updated
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_timestamp();
