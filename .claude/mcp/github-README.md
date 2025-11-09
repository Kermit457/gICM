# GitHub MCP

## Overview
The GitHub MCP provides comprehensive GitHub integration for Claude, enabling repository management, issue tracking, pull requests, code search, and GitHub Actions automation. This MCP streamlines development workflows by providing direct access to GitHub's full API capabilities.

## What It Does
- **Repository Management**: Create, clone, and manage repositories
- **Issue Tracking**: Create, update, and search issues
- **Pull Requests**: Create, review, and merge pull requests
- **Code Search**: Search code across repositories
- **GitHub Actions**: Trigger workflows and view runs
- **Gists**: Create and manage code snippets
- **Releases**: Create and publish releases
- **Team Management**: Manage teams and permissions
- **Webhooks**: Configure repository webhooks

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-github
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-github
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/github.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-personal-access-token"
      }
    }
  }
}
```

## Required Environment Variables

### GITHUB_TOKEN
- **Description**: Personal Access Token (PAT) for GitHub authentication
- **Type**: Classic or Fine-grained PAT
- **How to Create**:
  1. Go to GitHub Settings → Developer settings → Personal access tokens
  2. Click "Generate new token (classic)" or "Generate new token (fine-grained)"
  3. Select required scopes (see below)
  4. Generate and copy the token
- **Security**: Keep secret! Add to `.env` file, never commit

### Required Token Scopes

#### Classic PAT (recommended for full functionality)
- `repo` - Full repository access
- `workflow` - GitHub Actions access
- `read:org` - Read organization data
- `read:user` - Read user profile data
- `user:email` - Read user email
- `admin:repo_hook` - Repository webhooks
- `delete_repo` - Delete repositories (if needed)

#### Fine-grained PAT (minimum scopes)
- **Repository permissions**:
  - Contents: Read and write
  - Issues: Read and write
  - Pull requests: Read and write
  - Workflows: Read and write
  - Metadata: Read-only
- **Account permissions**:
  - Email addresses: Read-only

### Optional Environment Variables

#### GITHUB_ENTERPRISE_URL
- **Description**: GitHub Enterprise Server URL
- **Format**: `https://github.your-company.com`
- **Example**: `"GITHUB_ENTERPRISE_URL": "https://github.enterprise.com"`

#### GITHUB_DEFAULT_OWNER
- **Description**: Default repository owner/organization
- **Example**: `"GITHUB_DEFAULT_OWNER": "your-username"`

## Usage Examples

### Repository Operations

#### List Repositories
```typescript
// List user repositories
const repos = await github.listRepos({
  owner: "username",
  type: "owner",
  sort: "updated"
});

// List organization repositories
const orgRepos = await github.listRepos({
  org: "organization-name",
  type: "all"
});
```

#### Create Repository
```typescript
// Create new repository
const repo = await github.createRepo({
  name: "my-new-project",
  description: "Project description",
  private: false,
  auto_init: true,
  gitignore_template: "Node",
  license_template: "mit"
});
```

#### Clone Repository
```typescript
// Clone repository information
const repo = await github.getRepo({
  owner: "username",
  repo: "repository-name"
});
```

### Issue Management

#### Create Issue
```typescript
// Create new issue
const issue = await github.createIssue({
  owner: "username",
  repo: "project",
  title: "Bug: Application crashes on startup",
  body: `## Description
The application crashes when attempting to start.

## Steps to Reproduce
1. Run npm start
2. Observe crash

## Expected Behavior
Application should start successfully.`,
  labels: ["bug", "priority-high"],
  assignees: ["developer1"]
});
```

#### Search Issues
```typescript
// Search for issues
const issues = await github.searchIssues({
  query: "is:open label:bug repo:username/project",
  sort: "created",
  order: "desc"
});

// Filter by labels
const bugs = await github.searchIssues({
  query: "is:issue is:open label:bug",
  per_page: 50
});
```

#### Update Issue
```typescript
// Update issue
const updated = await github.updateIssue({
  owner: "username",
  repo: "project",
  issue_number: 42,
  state: "closed",
  labels: ["bug", "fixed"]
});
```

### Pull Request Operations

#### Create Pull Request
```typescript
// Create PR
const pr = await github.createPullRequest({
  owner: "username",
  repo: "project",
  title: "feat: Add bonding curve implementation",
  body: `## Summary
Implements exponential bonding curve for token launches.

## Changes
- Add bonding curve math module
- Implement price calculation
- Add comprehensive tests

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing complete`,
  head: "feature/bonding-curve",
  base: "main",
  draft: false
});
```

#### Review Pull Request
```typescript
// Get PR details
const pr = await github.getPullRequest({
  owner: "username",
  repo: "project",
  pull_number: 123
});

// List PR files
const files = await github.listPullRequestFiles({
  owner: "username",
  repo: "project",
  pull_number: 123
});

// Submit review
const review = await github.createReview({
  owner: "username",
  repo: "project",
  pull_number: 123,
  event: "APPROVE",
  body: "LGTM! Code looks good."
});
```

#### Merge Pull Request
```typescript
// Merge PR
const merge = await github.mergePullRequest({
  owner: "username",
  repo: "project",
  pull_number: 123,
  merge_method: "squash",
  commit_title: "feat: Add bonding curve implementation (#123)",
  commit_message: "Implements exponential bonding curve"
});
```

### Code Search

#### Search Code
```typescript
// Search for code
const results = await github.searchCode({
  query: "bonding curve language:rust repo:username/project",
  per_page: 20
});

// Search for function definitions
const functions = await github.searchCode({
  query: "function calculate_price language:typescript"
});
```

#### Search Commits
```typescript
// Search commits
const commits = await github.searchCommits({
  query: "author:username fix bug",
  sort: "committer-date",
  order: "desc"
});
```

### GitHub Actions

#### Trigger Workflow
```typescript
// Trigger workflow dispatch
await github.triggerWorkflow({
  owner: "username",
  repo: "project",
  workflow_id: "deploy.yml",
  ref: "main",
  inputs: {
    environment: "production",
    version: "1.2.0"
  }
});
```

#### List Workflow Runs
```typescript
// Get workflow runs
const runs = await github.listWorkflowRuns({
  owner: "username",
  repo: "project",
  workflow_id: "test.yml",
  status: "completed",
  per_page: 10
});
```

#### Get Run Logs
```typescript
// Download workflow logs
const logs = await github.getWorkflowRunLogs({
  owner: "username",
  repo: "project",
  run_id: 123456
});
```

### Releases

#### Create Release
```typescript
// Create new release
const release = await github.createRelease({
  owner: "username",
  repo: "project",
  tag_name: "v1.2.0",
  name: "Release 1.2.0",
  body: `## Features
- Add bonding curve support
- Improve performance

## Bug Fixes
- Fix wallet connection issue
- Resolve RPC timeout`,
  draft: false,
  prerelease: false
});
```

#### Upload Release Assets
```typescript
// Upload asset to release
await github.uploadReleaseAsset({
  owner: "username",
  repo: "project",
  release_id: release.id,
  name: "binary-linux-x64",
  data: binaryData
});
```

### Gists

#### Create Gist
```typescript
// Create gist
const gist = await github.createGist({
  description: "Bonding curve implementation",
  public: true,
  files: {
    "bonding-curve.rs": {
      content: rustCode
    },
    "README.md": {
      content: documentation
    }
  }
});
```

### File Operations

#### Get File Contents
```typescript
// Read file from repository
const file = await github.getFileContents({
  owner: "username",
  repo: "project",
  path: "src/lib/registry.ts",
  ref: "main"
});

const content = Buffer.from(file.content, 'base64').toString('utf-8');
```

#### Create/Update File
```typescript
// Create or update file
await github.createOrUpdateFile({
  owner: "username",
  repo: "project",
  path: "src/config.json",
  message: "Update configuration",
  content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
  branch: "main",
  sha: existingFile?.sha // Required for updates
});
```

## Configuration Options

### Rate Limiting
```json
{
  "env": {
    "GITHUB_TOKEN": "your-token",
    "GITHUB_RATE_LIMIT_STRATEGY": "throttle",
    "GITHUB_MAX_RETRIES": "3"
  }
}
```

### Caching
```json
{
  "env": {
    "GITHUB_TOKEN": "your-token",
    "GITHUB_CACHE_ENABLED": "true",
    "GITHUB_CACHE_TTL": "300"
  }
}
```

### Timeout Configuration
```json
{
  "env": {
    "GITHUB_TOKEN": "your-token",
    "GITHUB_TIMEOUT": "30000",
    "GITHUB_REQUEST_TIMEOUT": "10000"
  }
}
```

## Best Practices

### Security
1. **Token Security**: Use fine-grained PATs with minimal scopes
2. **Secret Storage**: Store tokens in environment variables
3. **Token Rotation**: Rotate tokens regularly (90 days)
4. **Audit Logs**: Review GitHub audit logs periodically
5. **Access Control**: Limit token access to necessary repositories

### Performance
1. **Rate Limits**: Respect GitHub rate limits (5000 requests/hour)
2. **Pagination**: Use pagination for large result sets
3. **Conditional Requests**: Use ETags for caching
4. **Webhooks**: Use webhooks instead of polling when possible
5. **GraphQL**: Consider GraphQL API for complex queries

### Development Workflow
1. **Branch Strategy**: Use feature branches for development
2. **PR Reviews**: Require code reviews before merging
3. **CI/CD**: Automate testing with GitHub Actions
4. **Protected Branches**: Protect main/master branches
5. **Semantic Versioning**: Use semantic versioning for releases

## Common Use Cases

### Automated PR Creation
```typescript
// Create PR after implementing feature
const pr = await github.createPullRequest({
  owner: "username",
  repo: "project",
  title: "feat: Add wallet adapter integration",
  body: generatedPRDescription,
  head: "feature/wallet-adapter",
  base: "main"
});
```

### Issue Triage
```typescript
// Find and label issues
const issues = await github.searchIssues({
  query: "is:issue is:open no:label repo:username/project"
});

for (const issue of issues.items) {
  // Analyze and label
  await github.updateIssue({
    owner: "username",
    repo: issue.repository.name,
    issue_number: issue.number,
    labels: determinedLabels
  });
}
```

### Release Automation
```typescript
// Automated release process
const release = await github.createRelease({
  owner: "username",
  repo: "project",
  tag_name: `v${version}`,
  name: `Release ${version}`,
  body: generatedChangelog,
  generate_release_notes: true
});
```

### Code Quality Checks
```typescript
// Search for potential issues in code
const results = await github.searchCode({
  query: "TODO language:typescript repo:username/project"
});

// Create issues for TODOs
for (const result of results.items) {
  await github.createIssue({
    owner: "username",
    repo: "project",
    title: `TODO: ${result.name}`,
    body: `Found TODO in ${result.path}`
  });
}
```

## Troubleshooting

### Common Issues

**Issue**: Authentication failed
- **Solution**: Verify token is correct and not expired
- **Solution**: Check token scopes include required permissions
- **Solution**: Ensure token is for correct account/organization

**Issue**: Rate limit exceeded
- **Solution**: Implement exponential backoff
- **Solution**: Cache responses when possible
- **Solution**: Use conditional requests with ETags
- **Solution**: Consider GitHub Enterprise for higher limits

**Issue**: Permission denied
- **Solution**: Verify token has required scopes
- **Solution**: Check repository permissions
- **Solution**: Ensure organization allows token access

**Issue**: Resource not found
- **Solution**: Verify repository/issue/PR exists
- **Solution**: Check spelling of owner/repo names
- **Solution**: Ensure you have access to private repository

**Issue**: MCP not connecting
- **Solution**: Verify `@modelcontextprotocol/server-github` is installed
- **Solution**: Check token format (starts with `ghp_` or `github_pat_`)
- **Solution**: Test token with GitHub API directly

### Debug Mode
Enable verbose logging:

```json
{
  "env": {
    "GITHUB_TOKEN": "your-token",
    "DEBUG": "github:*",
    "GITHUB_LOG_LEVEL": "debug"
  }
}
```

## Advanced Features

### GraphQL API
```typescript
// Use GitHub GraphQL API
const query = `
  query {
    repository(owner: "username", name: "project") {
      issues(first: 10, states: OPEN) {
        edges {
          node {
            title
            number
            createdAt
          }
        }
      }
    }
  }
`;

const result = await github.graphql(query);
```

### Webhooks Management
```typescript
// Create webhook
const webhook = await github.createWebhook({
  owner: "username",
  repo: "project",
  config: {
    url: "https://your-server.com/webhook",
    content_type: "json",
    secret: "webhook-secret"
  },
  events: ["push", "pull_request", "issues"]
});
```

### Team Management
```typescript
// Create team
const team = await github.createTeam({
  org: "organization",
  name: "backend-team",
  description: "Backend developers",
  privacy: "closed"
});

// Add team member
await github.addTeamMember({
  org: "organization",
  team_slug: "backend-team",
  username: "developer"
});
```

## Rate Limits

### REST API
- **Authenticated**: 5,000 requests per hour
- **Unauthenticated**: 60 requests per hour
- **Search API**: 30 requests per minute
- **GraphQL**: 5,000 points per hour

### Best Practices for Rate Limits
1. Check remaining rate limit: `X-RateLimit-Remaining` header
2. Implement exponential backoff
3. Use conditional requests with ETags
4. Cache responses when appropriate
5. Use GraphQL for complex queries (more efficient)

## Integration Examples

### With CI/CD Pipeline
```yaml
# GitHub Actions integration
- name: Create Deployment Issue
  run: |
    npx @modelcontextprotocol/server-github create-issue \
      --title "Deploy v${{ github.ref_name }}" \
      --body "Deployment tracking issue"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### With Development Agents
```typescript
// Git Flow Coordinator uses GitHub MCP
const coordinator = new GitFlowCoordinator({
  github: {
    enabled: true,
    autoCreatePR: true,
    requireReview: true
  }
});
```

## Additional Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Webhooks Guide](https://docs.github.com/en/webhooks)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-github`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **GitHub API**: v3 (REST) and v4 (GraphQL)
