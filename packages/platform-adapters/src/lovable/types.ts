/**
 * Lovable.dev API types
 * Focuses on Supabase + Shadcn project generation
 */

export interface LovableProjectConfig {
  name: string;
  description: string;
  framework: 'react' | 'next';
  styling: 'tailwind' | 'shadcn';

  // Supabase configuration
  supabase?: {
    schema: LovableSupabaseSchema;
    auth?: {
      providers: ('email' | 'google' | 'github')[];
    };
  };

  // Component configuration
  components?: {
    name: string;
    type: 'shadcn' | 'custom';
    variant?: string;
  }[];

  // Environment variables
  env?: Record<string, { description: string; required: boolean }>;
}

export interface LovableSupabaseSchema {
  tables: LovableTable[];
  policies?: LovableRLSPolicy[];
  functions?: LovableFunction[];
  triggers?: LovableTrigger[];
}

export interface LovableTable {
  name: string;
  columns: LovableColumn[];
  indexes?: LovableIndex[];
}

export interface LovableColumn {
  name: string;
  type: string;
  nullable?: boolean;
  default?: any;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}

export interface LovableIndex {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface LovableRLSPolicy {
  table: string;
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  roles?: string[];
}

export interface LovableFunction {
  name: string;
  args: Array<{ name: string; type: string }>;
  returns: string;
  language: 'plpgsql' | 'sql';
  body: string;
}

export interface LovableTrigger {
  name: string;
  table: string;
  timing: 'BEFORE' | 'AFTER';
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  function: string;
}

export interface LovableProject {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
  url: string;
  preview_url: string;
  status: 'draft' | 'active' | 'archived';
}

export interface LovableOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface LovableUser {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
}
