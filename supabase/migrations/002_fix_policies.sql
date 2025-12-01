-- ============================================================================
-- Fix: Drop existing policies and recreate
-- Run this if you get "policy already exists" errors
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON positions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON trades;
DROP POLICY IF EXISTS "Allow all for authenticated" ON signals;
DROP POLICY IF EXISTS "Allow all for authenticated" ON discoveries;
DROP POLICY IF EXISTS "Allow all for authenticated" ON daily_stats;

-- Recreate policies
CREATE POLICY "Allow all for authenticated" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON trades FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON signals FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON discoveries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON daily_stats FOR ALL USING (true);

-- Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
