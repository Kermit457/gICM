-- Content Pipeline Schema
-- Run this in Supabase SQL Editor to set up content pipeline tables
-- Migration: 004_content_pipeline.sql

-- =========================================================================
-- ENGINE EVENTS TABLE
-- Captures all activity from Money, Growth, Product engines
-- =========================================================================
CREATE TABLE IF NOT EXISTS engine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine TEXT NOT NULL CHECK (engine IN ('orchestrator', 'money', 'growth', 'product')),
  type TEXT NOT NULL CHECK (type IN (
    'trade_executed', 'pnl_snapshot', 'feature_shipped',
    'campaign_launched', 'content_published', 'bug_fixed',
    'retro', 'win_recorded'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metrics JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  links TEXT[] DEFAULT ARRAY[]::TEXT[],
  source JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_events_engine ON engine_events(engine);
CREATE INDEX IF NOT EXISTS idx_engine_events_type ON engine_events(type);
CREATE INDEX IF NOT EXISTS idx_engine_events_timestamp ON engine_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engine_events_tags ON engine_events USING GIN(tags);

-- =========================================================================
-- WIN RECORDS TABLE
-- Tracks achievements and wins for content generation
-- =========================================================================
CREATE TABLE IF NOT EXISTS win_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  win_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('money', 'growth', 'product', 'ops')),
  subcategory TEXT NOT NULL,
  title TEXT NOT NULL,
  value DECIMAL(20,6) NOT NULL,
  unit TEXT NOT NULL,
  engine_event_id UUID REFERENCES engine_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wins_category ON win_records(category);
CREATE INDEX IF NOT EXISTS idx_wins_created ON win_records(created_at DESC);

-- =========================================================================
-- CONTENT BRIEFS TABLE
-- Strategic content plans generated from events
-- =========================================================================
CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN (
    'build_authority', 'ship_update', 'show_agent_alpha',
    'convert_users', 'recruit_builders'
  )),
  narrative_angle TEXT NOT NULL CHECK (narrative_angle IN (
    'macro_thesis', 'trading_case_study', 'devlog',
    'product_launch', 'playbook_howto'
  )),
  primary_audience TEXT NOT NULL CHECK (primary_audience IN (
    'traders', 'founders', 'devs', 'partners', 'community'
  )),
  time_scope TEXT NOT NULL CHECK (time_scope IN ('daily', 'weekly', 'monthly', 'evergreen')),
  key_idea TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]',
  wins JSONB DEFAULT '[]',
  market_context JSONB DEFAULT '{}',
  target_length TEXT NOT NULL CHECK (target_length IN ('tweet', 'thread', 'short_post', 'longform')),
  target_channels TEXT[] NOT NULL DEFAULT ARRAY['blog'],
  primary_cta TEXT NOT NULL CHECK (primary_cta IN (
    'join_waitlist', 'launch_with_us', 'try_agent',
    'join_community', 'book_call', 'subscribe'
  )),
  seed_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_status ON content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_narrative ON content_briefs(narrative_angle);
CREATE INDEX IF NOT EXISTS idx_briefs_audience ON content_briefs(primary_audience);
CREATE INDEX IF NOT EXISTS idx_briefs_created ON content_briefs(created_at DESC);

-- =========================================================================
-- CONTENT ARTICLES TABLE
-- Generated articles with SEO metadata
-- =========================================================================
CREATE TABLE IF NOT EXISTS content_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT UNIQUE NOT NULL,
  brief_id UUID NOT NULL REFERENCES content_briefs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  seo JSONB NOT NULL DEFAULT '{
    "seoTitle": "",
    "metaDescription": "",
    "slug": "",
    "keywords": [],
    "faqs": [],
    "internalLinks": [],
    "externalLinks": []
  }',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'ready_for_review', 'approved', 'ready_for_publish', 'published', 'rejected'
  )),
  reviewer_notes TEXT,
  published_at TIMESTAMPTZ,
  published_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_brief ON content_articles(brief_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON content_articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON content_articles(published_at DESC);

-- =========================================================================
-- DISTRIBUTION PACKETS TABLE
-- Multi-channel formatted content
-- =========================================================================
CREATE TABLE IF NOT EXISTS distribution_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id TEXT UNIQUE NOT NULL,
  article_id UUID NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  base_slug TEXT NOT NULL,

  -- Primary channels (free + API-friendly)
  blog_post TEXT,
  substack_body TEXT,
  mirror_body TEXT,
  medium_body TEXT,
  devto_body TEXT,
  hashnode_body TEXT,
  github_readme TEXT,

  -- Social snippets (require approval before posting)
  twitter_thread JSONB DEFAULT '[]',
  linkedin_post TEXT,
  reddit_draft TEXT,

  -- Email digest content
  email_digest_html TEXT,
  email_digest_text TEXT,

  -- RSS feed entry
  rss_entry JSONB DEFAULT '{}',

  -- Metadata
  canonical_url TEXT,
  og_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'distributed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_packets_article ON distribution_packets(article_id);
CREATE INDEX IF NOT EXISTS idx_packets_status ON distribution_packets(status);
CREATE INDEX IF NOT EXISTS idx_packets_created ON distribution_packets(created_at DESC);

-- =========================================================================
-- DISTRIBUTION ATTEMPTS TABLE
-- Track per-channel publish attempts
-- =========================================================================
CREATE TABLE IF NOT EXISTS distribution_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES distribution_packets(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN (
    'blog', 'substack', 'mirror', 'medium', 'devto', 'hashnode',
    'github', 'twitter', 'linkedin', 'reddit', 'email', 'rss'
  )),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  external_url TEXT,
  external_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_attempts_packet ON distribution_attempts(packet_id);
CREATE INDEX IF NOT EXISTS idx_attempts_channel ON distribution_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON distribution_attempts(status);

-- =========================================================================
-- CONTENT METRICS TABLE
-- Track engagement from external platforms
-- =========================================================================
CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  reads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  subscribers_gained INTEGER DEFAULT 0,
  estimated_reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_metrics_article ON content_metrics(article_id);
CREATE INDEX IF NOT EXISTS idx_metrics_channel ON content_metrics(channel);
CREATE INDEX IF NOT EXISTS idx_metrics_collected ON content_metrics(collected_at DESC);

-- Unique constraint on article + channel + date for daily aggregation
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_daily ON content_metrics(
  article_id, channel, DATE(collected_at)
);

-- =========================================================================
-- CONTENT FEEDBACK TABLE
-- Manual review notes and approval workflow
-- =========================================================================
CREATE TABLE IF NOT EXISTS content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL DEFAULT 'system',
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('approval', 'rejection', 'revision', 'note')),
  comment TEXT,
  changes_requested JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_article ON content_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON content_feedback(feedback_type);

-- =========================================================================
-- MARKET CONTEXT SNAPSHOTS TABLE
-- Store market context for content generation
-- =========================================================================
CREATE TABLE IF NOT EXISTS market_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  btc_usd DECIMAL(20,2),
  eth_usd DECIMAL(20,2),
  sol_usd DECIMAL(20,2),
  volatility_index DECIMAL(10,2),
  fear_greed_index INTEGER,
  notes TEXT,
  source JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_market_captured ON market_context_snapshots(captured_at DESC);

-- =========================================================================
-- FUNCTIONS
-- =========================================================================

-- Auto-update updated_at on content_briefs
CREATE OR REPLACE FUNCTION update_brief_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_brief_updated ON content_briefs;
CREATE TRIGGER trigger_brief_updated
  BEFORE UPDATE ON content_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_brief_timestamp();

-- Auto-update updated_at on content_articles
DROP TRIGGER IF EXISTS trigger_article_updated ON content_articles;
CREATE TRIGGER trigger_article_updated
  BEFORE UPDATE ON content_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Calculate word count and reading time on article insert/update
CREATE OR REPLACE FUNCTION calculate_article_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Rough word count (split on whitespace)
  NEW.word_count := array_length(regexp_split_to_array(NEW.markdown, '\s+'), 1);
  -- Reading time: ~200 words per minute
  NEW.reading_time_minutes := GREATEST(1, CEIL(NEW.word_count / 200.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_article_stats ON content_articles;
CREATE TRIGGER trigger_article_stats
  BEFORE INSERT OR UPDATE OF markdown ON content_articles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_article_stats();

-- =========================================================================
-- VIEWS
-- =========================================================================

-- View: Content pipeline overview
CREATE OR REPLACE VIEW content_pipeline_overview AS
SELECT
  b.brief_id,
  b.key_idea,
  b.narrative_angle,
  b.status as brief_status,
  b.created_at as brief_created,
  a.article_id,
  a.title as article_title,
  a.status as article_status,
  a.word_count,
  p.packet_id,
  p.status as packet_status,
  COALESCE(array_length(p.twitter_thread::text[]::text[], 1), 0) as tweet_count
FROM content_briefs b
LEFT JOIN content_articles a ON a.brief_id = b.id
LEFT JOIN distribution_packets p ON p.article_id = a.id
ORDER BY b.created_at DESC;

-- View: Distribution success rates by channel
CREATE OR REPLACE VIEW distribution_success_rates AS
SELECT
  channel,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success')::decimal /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate
FROM distribution_attempts
GROUP BY channel
ORDER BY success_rate DESC;

-- =========================================================================
-- COMMENTS
-- =========================================================================

COMMENT ON TABLE engine_events IS 'Raw activity events from Money, Growth, Product engines';
COMMENT ON TABLE win_records IS 'Achievement tracking for content generation';
COMMENT ON TABLE content_briefs IS 'Strategic content plans generated from engine events';
COMMENT ON TABLE content_articles IS 'Generated articles with SEO metadata';
COMMENT ON TABLE distribution_packets IS 'Multi-channel formatted content ready for distribution';
COMMENT ON TABLE distribution_attempts IS 'Per-channel publish attempt tracking';
COMMENT ON TABLE content_metrics IS 'Engagement metrics from external platforms';
COMMENT ON TABLE content_feedback IS 'Manual review and approval workflow';
COMMENT ON TABLE market_context_snapshots IS 'Market data snapshots for content context';

-- =========================================================================
-- SAMPLE DISTRIBUTION CHANNELS CONFIG (for reference)
-- =========================================================================
-- The following channels are FREE and API-friendly for autonomous publishing:
--
-- Tier 1 (Full Automation):
--   - blog: Your own Next.js blog (commit markdown via GitHub API)
--   - substack: Email + blog via API/email automation
--   - mirror: Web3 essays via wallet-based publishing
--   - medium: Syndication via API with canonical URLs
--   - devto: Devlogs via official API
--   - hashnode: Dev-focused via API
--   - github: CHANGELOG.md, docs/ via GitHub API
--   - rss: Expose feeds for aggregators
--   - email: Digest via Buttondown/MailerLite/Mailchimp free tier
--
-- Tier 2 (Agent Draft + Human Approve):
--   - twitter: Draft threads, human clicks post
--   - linkedin: Draft posts, human clicks post
--   - reddit: Draft for selected subreddits, human posts
--
-- NOT Recommended for Automation:
--   - instagram, tiktok, facebook (ban risk)
