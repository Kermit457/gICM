/**
 * Bolt.new (StackBlitz) API types
 * Based on StackBlitz SDK and WebContainers API
 */
interface BoltProjectConfig {
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
interface BoltDeploymentOptions {
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
interface BoltProject {
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
interface BoltOAuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
    scope?: string;
}
interface BoltUser {
    id: string;
    username: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
}
interface BoltWebhookPayload {
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

/**
 * Bolt.new (StackBlitz) Platform Adapter
 * Handles project creation, deployment, and bidirectional sync
 */
declare class BoltAdapter {
    private client;
    private accessToken?;
    constructor(accessToken?: string);
    /**
     * Set authentication token
     */
    setAccessToken(token: string): void;
    /**
     * Create a new Bolt.new project from gICM item
     */
    createProject(projectName: string, files: Record<string, string>, dependencies?: Record<string, string>, framework?: string): Promise<BoltProject>;
    /**
     * Generate StackBlitz embed URL (current public approach)
     */
    generateEmbedUrl(config: BoltProjectConfig, options?: BoltDeploymentOptions): string;
    /**
     * Fetch existing Bolt project (requires API access)
     */
    fetchProject(projectId: string): Promise<BoltProject>;
    /**
     * Update existing project files
     */
    updateProject(projectId: string, updates: {
        files?: Record<string, string>;
        dependencies?: Record<string, string>;
    }): Promise<BoltProject>;
    /**
     * Sync changes from Bolt.new back to gICM
     */
    syncChanges(projectId: string): Promise<{
        files: Record<string, string>;
        dependencies: Record<string, string>;
    }>;
    /**
     * Get current user info
     */
    getCurrentUser(): Promise<BoltUser>;
    /**
     * Exchange OAuth code for access token
     */
    static exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<BoltOAuthTokens>;
    /**
     * Refresh access token
     */
    static refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<BoltOAuthTokens>;
    private mapFrameworkToTemplate;
    private flattenFiles;
    private encodeProject;
    private generateProjectId;
}
/**
 * Generate OAuth authorization URL
 */
declare function generateBoltAuthUrl(clientId: string, redirectUri: string, state: string): string;

export { BoltAdapter, type BoltDeploymentOptions, type BoltOAuthTokens, type BoltProject, type BoltProjectConfig, type BoltUser, type BoltWebhookPayload, generateBoltAuthUrl };
