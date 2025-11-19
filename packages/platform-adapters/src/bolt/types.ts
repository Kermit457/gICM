/**
 * Bolt.new (StackBlitz) API types
 * Based on StackBlitz SDK and WebContainers API
 */

export interface BoltProjectConfig {
  title: string;
  description: string;
  template: 'node' | 'typescript' | 'react' | 'vue' | 'svelte' | 'angular';
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  settings?: {
    compile?: {
      trigger?: 'auto' | 'keystroke' | 'save';
      action?: 'hmr' | 'refresh';
      clearConsole?: boolean;
    };
  };
}

export interface BoltDeploymentOptions {
  openFile?: string;
  newWindow?: boolean;
  devToolsHeight?: number;
  forceEmbedLayout?: boolean;
  clickToLoad?: boolean;
  view?: 'preview' | 'editor';
  hideExplorer?: boolean;
  hideNavigation?: boolean;
  hideDevTools?: boolean;
}

export interface BoltProject {
  id: string;
  title: string;
  description: string;
  owner: {
    id: string;
    username: string;
  };
  template: string;
  created_at: string;
  updated_at: string;
  url: string;
  embed_url: string;
  editor_url: string;
  preview_url: string;
}

export interface BoltOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface BoltUser {
  id: string;
  username: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface BoltWebhookPayload {
  event: 'project.created' | 'project.updated' | 'project.deleted' | 'file.changed';
  project: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    username: string;
  };
  timestamp: string;
  data?: {
    file_path?: string;
    content?: string;
    changes?: Array<{
      path: string;
      type: 'added' | 'modified' | 'deleted';
    }>;
  };
}
