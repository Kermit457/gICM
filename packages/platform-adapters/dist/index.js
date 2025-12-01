var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/bolt/adapter.ts
import axios from "axios";
var BoltAdapter = class {
  client;
  accessToken;
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: "https://api.stackblitz.com/v1",
      headers: {
        "Content-Type": "application/json",
        ...accessToken && { Authorization: `Bearer ${accessToken}` }
      }
    });
  }
  /**
   * Set authentication token
   */
  setAccessToken(token) {
    this.accessToken = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  /**
   * Create a new Bolt.new project from gICM item
   */
  async createProject(projectName, files, dependencies, framework = "node") {
    const config = {
      title: projectName,
      description: `Deployed from gICM Marketplace`,
      template: this.mapFrameworkToTemplate(framework),
      files: this.flattenFiles(files),
      dependencies: dependencies || {}
    };
    const embedUrl = this.generateEmbedUrl(config);
    return {
      id: this.generateProjectId(config),
      title: config.title,
      description: config.description,
      owner: {
        id: "user-id",
        // Would come from OAuth
        username: "username"
      },
      template: config.template,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      url: embedUrl,
      embed_url: embedUrl,
      editor_url: `${embedUrl}?view=editor`,
      preview_url: `${embedUrl}?view=preview`
    };
  }
  /**
   * Generate StackBlitz embed URL (current public approach)
   */
  generateEmbedUrl(config, options) {
    const params = new URLSearchParams({
      title: config.title,
      description: config.description || "",
      template: config.template
    });
    if (options?.openFile) {
      params.set("file", options.openFile);
    }
    if (options?.view) {
      params.set("view", options.view);
    }
    if (options?.hideExplorer) {
      params.set("hideExplorer", "1");
    }
    if (options?.hideNavigation) {
      params.set("hideNavigation", "1");
    }
    const projectPayload = {
      files: config.files,
      dependencies: config.dependencies || {},
      template: config.template
    };
    const encoded = this.encodeProject(projectPayload);
    return `https://bolt.new/~/github.com/${encoded}`;
  }
  /**
   * Fetch existing Bolt project (requires API access)
   */
  async fetchProject(projectId) {
    if (!this.accessToken) {
      throw new Error("OAuth token required to fetch projects");
    }
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Bolt project: ${error}`);
    }
  }
  /**
   * Update existing project files
   */
  async updateProject(projectId, updates) {
    if (!this.accessToken) {
      throw new Error("OAuth token required to update projects");
    }
    try {
      const response = await this.client.patch(`/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update Bolt project: ${error}`);
    }
  }
  /**
   * Sync changes from Bolt.new back to gICM
   */
  async syncChanges(projectId) {
    const project = await this.fetchProject(projectId);
    return {
      files: {},
      dependencies: {}
    };
  }
  /**
   * Get current user info
   */
  async getCurrentUser() {
    if (!this.accessToken) {
      throw new Error("OAuth token required");
    }
    try {
      const response = await this.client.get("/user");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }
  /**
   * Exchange OAuth code for access token
   */
  static async exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    try {
      const response = await axios.post(
        "https://stackblitz.com/oauth/token",
        {
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
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
  static async refreshToken(refreshToken, clientId, clientSecret) {
    try {
      const response = await axios.post(
        "https://stackblitz.com/oauth/token",
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
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
  mapFrameworkToTemplate(framework) {
    const mapping = {
      react: "react",
      next: "node",
      // Next.js projects use node template
      vue: "vue",
      svelte: "svelte",
      angular: "angular",
      node: "node",
      vanilla: "typescript"
    };
    return mapping[framework] || "typescript";
  }
  flattenFiles(files, prefix = "") {
    const result = {};
    for (const [key, value] of Object.entries(files)) {
      const path = prefix ? `${prefix}/${key}` : key;
      if (typeof value === "string") {
        result[path] = value;
      } else if (typeof value === "object" && value !== null) {
        Object.assign(result, this.flattenFiles(value, path));
      }
    }
    return result;
  }
  encodeProject(project) {
    const json = JSON.stringify(project);
    return Buffer.from(json).toString("base64url");
  }
  generateProjectId(config) {
    const hash = __require("crypto").createHash("sha256").update(JSON.stringify(config)).digest("hex");
    return hash.substring(0, 16);
  }
};
function generateBoltAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read_user write_projects",
    state
  });
  return `https://stackblitz.com/oauth/authorize?${params.toString()}`;
}
export {
  BoltAdapter,
  generateBoltAuthUrl
};
