import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if configured
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Database types
export interface DbPipeline {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  steps: DbPipelineStep[];
  risk_level: "safe" | "low" | "medium" | "high" | "critical";
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPipelineStep {
  id: string;
  tool: string;
  name: string;
  inputs: Record<string, unknown>;
  depends_on?: string[];
}

export interface DbPipelineExecution {
  id: string;
  pipeline_id: string;
  user_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  current_step: string | null;
  steps: DbStepProgress[];
  started_at: string;
  completed_at: string | null;
  duration: number;
  result: unknown | null;
  error: string | null;
}

export interface DbStepProgress {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at: string | null;
  completed_at: string | null;
  output: unknown | null;
  error: string | null;
}

// Pipeline CRUD operations
export const pipelineApi = {
  // Get all pipelines for current user
  async list(userId: string): Promise<DbPipeline[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("pipelines")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single pipeline
  async get(id: string): Promise<DbPipeline | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("pipelines")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create pipeline
  async create(pipeline: Omit<DbPipeline, "id" | "created_at" | "updated_at">): Promise<DbPipeline | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("pipelines")
      .insert(pipeline)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update pipeline
  async update(id: string, updates: Partial<DbPipeline>): Promise<DbPipeline | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("pipelines")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete pipeline
  async delete(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("pipelines").delete().eq("id", id);
    if (error) throw error;
  },

  // Get executions for a pipeline
  async getExecutions(pipelineId: string, limit = 10): Promise<DbPipelineExecution[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("pipeline_executions")
      .select("*")
      .eq("pipeline_id", pipelineId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get all executions for user
  async getAllExecutions(userId: string, limit = 20): Promise<DbPipelineExecution[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("pipeline_executions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// Supabase SQL for creating tables (for reference):
/*
-- Pipelines table
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Custom',
  steps JSONB NOT NULL DEFAULT '[]',
  risk_level TEXT NOT NULL DEFAULT 'safe',
  is_custom BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline executions table
CREATE TABLE pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration INTEGER NOT NULL DEFAULT 0,
  result JSONB,
  error TEXT
);

-- RLS Policies
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pipelines"
  ON pipelines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pipelines"
  ON pipelines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipelines"
  ON pipelines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipelines"
  ON pipelines FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own executions"
  ON pipeline_executions FOR SELECT
  USING (auth.uid() = user_id);
*/
