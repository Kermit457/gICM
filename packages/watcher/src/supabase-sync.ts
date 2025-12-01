/**
 * Supabase Sync
 * Sync file changes to Supabase for cloud storage and team collaboration
 */

import type { FileChange } from "./types.js";

interface SupabaseConfig {
  url: string;
  key: string;
  tablePrefix?: string;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  channel: (name: string) => SupabaseChannel;
}

interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder;
  insert: (data: unknown) => SupabaseQueryBuilder;
  upsert: (data: unknown) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  then: <T>(resolve: (result: { data: T | null; error: Error | null }) => void) => Promise<void>;
}

interface SupabaseChannel {
  on: (event: string, config: unknown, callback: (payload: unknown) => void) => SupabaseChannel;
  subscribe: () => void;
  unsubscribe: () => void;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  error?: string;
}

export interface SyncConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tablePrefix?: string;
  projectId: string;
  teamId?: string;
  enableRealtime?: boolean;
}

/**
 * Supabase sync for file changes
 *
 * Required Supabase tables (run these SQL commands in Supabase):
 *
 * ```sql
 * -- File changes table
 * CREATE TABLE gicm_file_changes (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   project_id TEXT NOT NULL,
 *   team_id TEXT,
 *   type TEXT NOT NULL CHECK (type IN ('add', 'change', 'unlink')),
 *   path TEXT NOT NULL,
 *   size INTEGER,
 *   timestamp TIMESTAMPTZ NOT NULL,
 *   synced_at TIMESTAMPTZ DEFAULT NOW(),
 *   synced_by TEXT
 * );
 *
 * -- Indexes
 * CREATE INDEX idx_changes_project ON gicm_file_changes(project_id);
 * CREATE INDEX idx_changes_team ON gicm_file_changes(team_id);
 * CREATE INDEX idx_changes_timestamp ON gicm_file_changes(timestamp DESC);
 *
 * -- Enable realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE gicm_file_changes;
 * ```
 */
export class SupabaseSync {
  private client: SupabaseClient | null = null;
  private config: SyncConfig;
  private tableName: string;
  private channel: SupabaseChannel | null = null;
  private changeHandlers: ((change: FileChange) => void)[] = [];

  constructor(config: SyncConfig) {
    this.config = config;
    const prefix = config.tablePrefix || "gicm";
    this.tableName = `${prefix}_file_changes`;
  }

  /**
   * Lazy initialize Supabase client
   */
  private async getClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;

    try {
      const { createClient } = await import("@supabase/supabase-js");
      this.client = createClient(
        this.config.supabaseUrl,
        this.config.supabaseKey
      ) as unknown as SupabaseClient;
      return this.client;
    } catch {
      throw new Error(
        "Supabase client not available. Install @supabase/supabase-js: pnpm add @supabase/supabase-js"
      );
    }
  }

  /**
   * Sync file changes to Supabase
   */
  async syncChanges(changes: FileChange[]): Promise<SyncResult> {
    if (changes.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    try {
      const client = await this.getClient();

      const rows = changes.map((change) => ({
        project_id: this.config.projectId,
        team_id: this.config.teamId,
        type: change.type,
        path: change.path,
        size: change.size,
        timestamp: change.timestamp,
        synced_by: process.env.USER || process.env.USERNAME || "unknown",
      }));

      const { error } = await client.from(this.tableName).insert(rows) as {
        data: unknown;
        error: Error | null;
      };

      if (error) {
        return {
          success: false,
          synced: 0,
          failed: changes.length,
          error: error.message,
        };
      }

      return {
        success: true,
        synced: changes.length,
        failed: 0,
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: changes.length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get recent changes from Supabase (for team sync)
   */
  async getRemoteChanges(
    since?: Date,
    limit: number = 100
  ): Promise<FileChange[]> {
    try {
      const client = await this.getClient();

      let query = client
        .from(this.tableName)
        .select("*")
        .eq("project_id", this.config.projectId);

      if (this.config.teamId) {
        query = query.eq("team_id", this.config.teamId);
      }

      query = query
        .order("timestamp", { ascending: false })
        .limit(limit);

      const { data, error } = await query as {
        data: Record<string, unknown>[] | null;
        error: Error | null;
      };

      if (error || !data) {
        return [];
      }

      return data.map((row) => ({
        type: row.type as FileChange["type"],
        path: row.path as string,
        size: row.size as number | undefined,
        timestamp: row.timestamp as string,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to realtime changes (for team collaboration)
   */
  async subscribeToChanges(
    handler: (change: FileChange) => void
  ): Promise<void> {
    if (!this.config.enableRealtime) {
      return;
    }

    try {
      const client = await this.getClient();
      this.changeHandlers.push(handler);

      if (!this.channel) {
        this.channel = client.channel(`${this.tableName}:${this.config.projectId}`);

        this.channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: this.tableName,
            filter: `project_id=eq.${this.config.projectId}`,
          },
          (payload: unknown) => {
            const row = (payload as { new: Record<string, unknown> }).new;
            const change: FileChange = {
              type: row.type as FileChange["type"],
              path: row.path as string,
              size: row.size as number | undefined,
              timestamp: row.timestamp as string,
            };

            // Notify all handlers
            for (const h of this.changeHandlers) {
              h(change);
            }
          }
        );

        this.channel.subscribe();
      }
    } catch {
      // Realtime not available
    }
  }

  /**
   * Unsubscribe from realtime changes
   */
  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.changeHandlers = [];
  }

  /**
   * Check if Supabase is configured and available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getClient();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create SupabaseSync from environment variables
 */
export function createSyncFromEnv(): SupabaseSync | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  const projectId = process.env.GICM_PROJECT_ID;

  if (!url || !key || !projectId) {
    return null;
  }

  return new SupabaseSync({
    supabaseUrl: url,
    supabaseKey: key,
    projectId,
    teamId: process.env.GICM_TEAM_ID,
    tablePrefix: process.env.GICM_TABLE_PREFIX || "gicm",
    enableRealtime: process.env.GICM_REALTIME === "true",
  });
}
