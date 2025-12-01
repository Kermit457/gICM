-- ============================================================================
-- gICM Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/bscpftwzsgmuhxaceqhy/sql
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: positions
-- Tracks open and closed trading positions
-- ============================================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(100) NOT NULL,
  chain VARCHAR(20) NOT NULL DEFAULT 'solana',
  size DECIMAL(18,8) NOT NULL,
  entry_price DECIMAL(18,8) NOT NULL,
  current_price DECIMAL(18,8),
  pnl DECIMAL(18,8) DEFAULT 0,
  pnl_percent DECIMAL(10,4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_token_chain ON positions(token, chain);
CREATE INDEX IF NOT EXISTS idx_positions_opened_at ON positions(opened_at DESC);

-- ============================================================================
-- Table: trades
-- Records all trade executions (opens, closes, partial exits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL, -- 'open', 'close', 'partial'
  token VARCHAR(100) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  size DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,8) NOT NULL,
  pnl DECIMAL(18,8),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_position_id ON trades(position_id);
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);

-- ============================================================================
-- Table: signals
-- Hunter agent signals queued for analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS signals (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  token VARCHAR(100),
  chain VARCHAR(20),
  action VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  urgency VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  reasoning TEXT,
  risk VARCHAR(20) NOT NULL,
  risk_factors JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'queued',
  analysis JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source);
CREATE INDEX IF NOT EXISTS idx_signals_token ON signals(token);
CREATE INDEX IF NOT EXISTS idx_signals_received_at ON signals(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence DESC);

-- ============================================================================
-- Table: discoveries
-- Hunter discoveries for deduplication and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT,
  fingerprint VARCHAR(200) UNIQUE,
  relevance DECIMAL(5,4),
  metrics JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for discoveries
CREATE INDEX IF NOT EXISTS idx_discoveries_source ON discoveries(source);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON discoveries(type);
CREATE INDEX IF NOT EXISTS idx_discoveries_fingerprint ON discoveries(fingerprint);
CREATE INDEX IF NOT EXISTS idx_discoveries_discovered_at ON discoveries(discovered_at DESC);

-- ============================================================================
-- Table: daily_stats
-- Aggregated daily trading statistics
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  pnl DECIMAL(18,8) DEFAULT 0,
  trades_count INT DEFAULT 0,
  signals_received INT DEFAULT 0,
  signals_queued INT DEFAULT 0,
  signals_rejected INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for daily_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- ============================================================================
-- Row Level Security (RLS) - Disabled for service role
-- Enable these if you need user-specific access control
-- ============================================================================

-- For now, we disable RLS to allow service role full access
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (service role)
CREATE POLICY "Allow all for authenticated" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON trades FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON signals FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON discoveries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON daily_stats FOR ALL USING (true);

-- ============================================================================
-- Updated_at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to positions
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to daily_stats
CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert initial daily_stats row for today
-- ============================================================================
INSERT INTO daily_stats (date) VALUES (CURRENT_DATE) ON CONFLICT (date) DO NOTHING;
