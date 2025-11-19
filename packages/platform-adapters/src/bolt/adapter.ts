import axios, { AxiosInstance } from 'axios';
import type {
  BoltProject,
  BoltProjectConfig,
  BoltDeploymentOptions,
  BoltOAuthTokens,
  BoltUser,
} from './types';

/**
 * Bolt.new (StackBlitz) Platform Adapter
 * Handles project creation, deployment, and bidirectional sync
 */
export class BoltAdapter {
  private client: AxiosInstance;
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;

    // StackBlitz API base (hypothetical - actual API may differ)
    // Note: As of now, StackBlitz doesn't have a public REST API
    // This is designed for when they release one, or we use WebContainers SDK
    this.client = axios.create({
      baseURL: 'https://api.stackblitz.com/v1',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
  }

  /**
   * Set authentication token
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Create a new Bolt.new project from gICM item
   */
  async createProject(
    projectName: string,
    files: Record<string, string>,
    dependencies?: Record<string, string>,
    framework: string = 'node'
  ): Promise<BoltProject> {
    const config: BoltProjectConfig = {
      title: projectName,
      description: `Deployed from gICM Marketplace`,
      template: this.mapFrameworkToTemplate(framework),
      files: this.flattenFiles(files),
      dependencies: dependencies || {},
    };

    // Note: Using StackBlitz SDK approach for now
    // In production, this would use their official API
    const embedUrl = this.generateEmbedUrl(config);

    // For now, we generate a shareable URL
    // In production with OAuth, we'd POST to their API
    return {
      id: this.generateProjectId(config),
      title: config.title,
      description: config.description,
      owner: {
        id: 'user-id', // Would come from OAuth
        username: 'username',
      },
      template: config.template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      url: embedUrl,
      embed_url: embedUrl,
      editor_url: `${embedUrl}?view=editor`,
      preview_url: `${embedUrl}?view=preview`,
    };
  }

  /**
   * Generate StackBlitz embed URL (current public approach)
   */
  generateEmbedUrl(config: BoltProjectConfig, options?: BoltDeploymentOptions): string {
    const params = new URLSearchParams({
      title: config.title,
      description: config.description || '',
      template: config.template,
    });

    if (options?.openFile) {
      params.set('file', options.openFile);
    }
    if (options?.view) {
      params.set('view', options.view);
    }
    if (options?.hideExplorer) {
      params.set('hideExplorer', '1');
    }
    if (options?.hideNavigation) {
      params.set('hideNavigation', '1');
    }

    // Generate project.json payload
    const projectPayload = {
      files: config.files,
      dependencies: config.dependencies || {},
      template: config.template,
    };

    // Encode payload
    const encoded = this.encodeProject(projectPayload);

    return `https://bolt.new/~/github.com/${encoded}`;
  }

  /**
   * Fetch existing Bolt project (requires API access)
   */
  async fetchProject(projectId: string): Promise<BoltProject> {
    if (!this.accessToken) {
      throw new Error('OAuth token required to fetch projects');
    }

    try {
      const response = await this.client.get<BoltProject>(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Bolt project: ${error}`);
    }
  }

  /**
   * Update existing project files
   */
  async updateProject(
    projectId: string,
    updates: {
      files?: Record<string, string>;
      dependencies?: Record<string, string>;
    }
  ): Promise<BoltProject> {
    if (!this.accessToken) {
      throw new Error('OAuth token required to update projects');
    }

    try {
      const response = await this.client.patch<BoltProject>(`/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update Bolt project: ${error}`);
    }
  }

  /**
   * Sync changes from Bolt.new back to gICM
   */
  async syncChanges(projectId: string): Promise<{
    files: Record<string, string>;
    dependencies: Record<string, string>;
  }> {
    const project = await this.fetchProject(projectId);

    // In production, we'd fetch the actual file contents
    // For now, return placeholder
    return {
      files: {},
      dependencies: {},
    };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<BoltUser> {
    if (!this.accessToken) {
      throw new Error('OAuth token required');
    }

    try {
      const response = await this.client.get<BoltUser>('/user');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  /**
   * Exchange OAuth code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<BoltOAuthTokens> {
    try {
      const response = await axios.post<BoltOAuthTokens>(
        'https://stackblitz.com/oauth/token',
        {
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`OAuth token exchange failed: ${error}`);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<BoltOAuthTokens> {
    try {
      const response = await axios.post<BoltOAuthTokens>(
        'https://stackblitz.com/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapFrameworkToTemplate(framework: string): BoltProjectConfig['template'] {
    const mapping: Record<string, BoltProjectConfig['template']> = {
      react: 'react',
      next: 'node', // Next.js projects use node template
      vue: 'vue',
      svelte: 'svelte',
      angular: 'angular',
      node: 'node',
      vanilla: 'typescript',
    };

    return mapping[framework] || 'typescript';
  }

  private flattenFiles(files: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(files)) {
      const path = prefix ? `${prefix}/${key}` : key;

      if (typeof value === 'string') {
        result[path] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenFiles(value, path));
      }
    }

    return result;
  }

  private encodeProject(project: any): string {
    // Base64 encode the project JSON
    const json = JSON.stringify(project);
    return Buffer.from(json).toString('base64url');
  }

  private generateProjectId(config: BoltProjectConfig): string {
    // Generate deterministic ID from config
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(config))
      .digest('hex');
    return hash.substring(0, 16);
  }
}

/**
 * Generate OAuth authorization URL
 */
export function generateBoltAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read_user write_projects',
    state,
  });

  return `https://stackblitz.com/oauth/authorize?${params.toString()}`;
}
