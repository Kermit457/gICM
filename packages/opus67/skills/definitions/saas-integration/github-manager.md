# GitHub Manager

> **ID:** `github-manager`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** github

## 🎯 What This Skill Does

Master GitHub API automation for repository management, pull request workflows, issue tracking, and code review automation using Octokit and GitHub Actions.

**Core Capabilities:**
- Repository automation and management
- Pull request creation and management
- Issue tracking and project boards
- Code review automation
- GitHub Actions workflow integration
- Release management and versioning
- Branch protection and security
- Webhook handling

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** github, repo, pr, pull request, issue, workflow, action, release
- **File Types:** `.yml` (GitHub Actions), `.md` (READMEs)
- **Directories:** `.github/`, `workflows/`

## 🚀 Core Capabilities

### 1. Repository Automation

**Installation & Setup:**

```typescript
// Install Octokit
npm install @octokit/rest @octokit/auth-app

// Environment configuration
// .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
```

**Basic Repository Operations:**

```typescript
// lib/github.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function createRepository(name: string, isPrivate: boolean = false) {
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      auto_init: true,
    });

    return { success: true, repo: data };
  } catch (error) {
    console.error('Repository creation failed:', error);
    return { success: false, error };
  }
}

export async function listRepositories(org?: string) {
  try {
    const { data } = org
      ? await octokit.repos.listForOrg({ org, per_page: 100 })
      : await octokit.repos.listForAuthenticatedUser({ per_page: 100 });

    return data;
  } catch (error) {
    console.error('Repository list failed:', error);
    return [];
  }
}

export async function getRepository(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  } catch (error) {
    console.error('Repository fetch failed:', error);
    return null;
  }
}

export async function updateRepository(
  owner: string,
  repo: string,
  updates: {
    description?: string;
    homepage?: string;
    private?: boolean;
    has_issues?: boolean;
    has_wiki?: boolean;
  }
) {
  try {
    const { data } = await octokit.repos.update({
      owner,
      repo,
      ...updates,
    });

    return { success: true, repo: data };
  } catch (error) {
    console.error('Repository update failed:', error);
    return { success: false, error };
  }
}
```

**Branch Management:**

```typescript
// lib/github-branches.ts
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string = 'main'
) {
  try {
    // Get the SHA of the source branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromBranch}`,
    });

    // Create new branch
    const { data } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    return { success: true, branch: data };
  } catch (error) {
    console.error('Branch creation failed:', error);
    return { success: false, error };
  }
}

export async function deleteBranch(owner: string, repo: string, branchName: string) {
  try {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Branch deletion failed:', error);
    return { success: false, error };
  }
}

export async function listBranches(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    return data;
  } catch (error) {
    console.error('Branch list failed:', error);
    return [];
  }
}
```

**Branch Protection:**

```typescript
// lib/github-protection.ts
export async function setBranchProtection(
  owner: string,
  repo: string,
  branch: string = 'main'
) {
  try {
    await octokit.repos.updateBranchProtection({
      owner,
      repo,
      branch,
      required_status_checks: {
        strict: true,
        contexts: ['ci/test', 'ci/lint'],
      },
      enforce_admins: true,
      required_pull_request_reviews: {
        dismissal_restrictions: {},
        dismiss_stale_reviews: true,
        require_code_owner_reviews: true,
        required_approving_review_count: 2,
      },
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: false,
      allow_deletions: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Branch protection failed:', error);
    return { success: false, error };
  }
}
```

**Best Practices:**
- Use GitHub Apps for better rate limits and permissions
- Implement token rotation for security
- Use fine-grained personal access tokens
- Cache repository data to reduce API calls
- Handle rate limiting with exponential backoff
- Use GraphQL API for complex queries

**Gotchas:**
- Rate limit is 5000 requests/hour for authenticated requests
- Secondary rate limit kicks in at 60-100 requests/minute
- Some operations require admin permissions
- Branch protection requires push access

### 2. Pull Request Management

**Creating Pull Requests:**

```typescript
// lib/github-pr.ts
interface CreatePROptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string; // branch name
  base: string; // target branch
  draft?: boolean;
}

export async function createPullRequest({
  owner,
  repo,
  title,
  body,
  head,
  base = 'main',
  draft = false,
}: CreatePROptions) {
  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
      draft,
    });

    return { success: true, pr: data };
  } catch (error) {
    console.error('PR creation failed:', error);
    return { success: false, error };
  }
}

export async function updatePullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
  }
) {
  try {
    const { data } = await octokit.pulls.update({
      owner,
      repo,
      pull_number: pullNumber,
      ...updates,
    });

    return { success: true, pr: data };
  } catch (error) {
    console.error('PR update failed:', error);
    return { success: false, error };
  }
}

export async function mergePullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
) {
  try {
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: mergeMethod,
    });

    return { success: true, merge: data };
  } catch (error) {
    console.error('PR merge failed:', error);
    return { success: false, error };
  }
}
```

**PR Reviews:**

```typescript
// lib/github-reviews.ts
export async function createReview(
  owner: string,
  repo: string,
  pullNumber: number,
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
  body: string,
  comments?: {
    path: string;
    position: number;
    body: string;
  }[]
) {
  try {
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event,
      body,
      comments,
    });

    return { success: true, review: data };
  } catch (error) {
    console.error('Review creation failed:', error);
    return { success: false, error };
  }
}

export async function requestReviewers(
  owner: string,
  repo: string,
  pullNumber: number,
  reviewers: string[],
  teamReviewers: string[] = []
) {
  try {
    const { data } = await octokit.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pullNumber,
      reviewers,
      team_reviewers: teamReviewers,
    });

    return { success: true, pr: data };
  } catch (error) {
    console.error('Reviewer request failed:', error);
    return { success: false, error };
  }
}
```

**PR Template:**

```markdown
<!-- .github/pull_request_template.md -->
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
<!-- Describe the tests you ran -->

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

**Automated PR Checks:**

```typescript
// lib/github-checks.ts
export async function createCheckRun(
  owner: string,
  repo: string,
  name: string,
  headSha: string,
  status: 'queued' | 'in_progress' | 'completed',
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out',
  output?: {
    title: string;
    summary: string;
    text?: string;
  }
) {
  try {
    const { data } = await octokit.checks.create({
      owner,
      repo,
      name,
      head_sha: headSha,
      status,
      conclusion,
      output,
    });

    return { success: true, check: data };
  } catch (error) {
    console.error('Check run creation failed:', error);
    return { success: false, error };
  }
}
```

**Best Practices:**
- Use PR templates for consistency
- Require status checks before merge
- Enable auto-merge for approved PRs
- Use CODEOWNERS for automatic reviewer assignment
- Link PRs to issues with keywords (fixes, closes)
- Use draft PRs for work in progress

**Gotchas:**
- Can't merge with failing required checks
- Branch must be up to date if required
- Some merge methods require specific permissions
- Reviews are dismissed on new commits if configured

### 3. Issue Tracking

**Creating and Managing Issues:**

```typescript
// lib/github-issues.ts
export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = [],
  assignees: string[] = []
) {
  try {
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees,
    });

    return { success: true, issue: data };
  } catch (error) {
    console.error('Issue creation failed:', error);
    return { success: false, error };
  }
}

export async function updateIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];
  }
) {
  try {
    const { data } = await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...updates,
    });

    return { success: true, issue: data };
  } catch (error) {
    console.error('Issue update failed:', error);
    return { success: false, error };
  }
}

export async function addComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  try {
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });

    return { success: true, comment: data };
  } catch (error) {
    console.error('Comment creation failed:', error);
    return { success: false, error };
  }
}
```

**Issue Templates:**

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: File a bug report
title: "[Bug]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction steps
      description: How can we reproduce this?
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. See error
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Critical (blocks usage)
        - High (major functionality affected)
        - Medium (minor functionality affected)
        - Low (cosmetic issue)
    validations:
      required: true
```

**Label Management:**

```typescript
// lib/github-labels.ts
export async function createLabel(
  owner: string,
  repo: string,
  name: string,
  color: string,
  description?: string
) {
  try {
    const { data } = await octokit.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description,
    });

    return { success: true, label: data };
  } catch (error) {
    console.error('Label creation failed:', error);
    return { success: false, error };
  }
}

export async function bulkCreateLabels(owner: string, repo: string) {
  const labels = [
    { name: 'bug', color: 'd73a4a', description: 'Something is not working' },
    { name: 'feature', color: '0075ca', description: 'New feature request' },
    { name: 'documentation', color: '0075ca', description: 'Documentation improvements' },
    { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
    { name: 'help wanted', color: '008672', description: 'Extra attention is needed' },
    { name: 'priority: high', color: 'b60205', description: 'High priority' },
    { name: 'status: in progress', color: 'fbca04', description: 'Currently being worked on' },
  ];

  const results = await Promise.allSettled(
    labels.map((label) => createLabel(owner, repo, label.name, label.color, label.description))
  );

  return results;
}
```

**Best Practices:**
- Use issue templates for consistency
- Implement triage labels for new issues
- Automate issue assignment based on labels
- Link issues to PRs for tracking
- Close stale issues automatically
- Use milestones for release planning

**Gotchas:**
- Issues and PRs share the same number space
- Labels must be created before use
- Can't reopen issues closed by bots without permissions
- Issue templates require specific YAML format

### 4. Code Review Automation

**Automated Review Comments:**

```typescript
// lib/github-auto-review.ts
export async function reviewPullRequestFiles(
  owner: string,
  repo: string,
  pullNumber: number
) {
  try {
    // Get PR files
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const comments: any[] = [];

    for (const file of files) {
      // Check for common issues
      if (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx')) {
        const content = await getFileContent(owner, repo, file.sha);

        // Example: Check for console.log
        if (content.includes('console.log')) {
          comments.push({
            path: file.filename,
            position: findPosition(content, 'console.log'),
            body: '⚠️ Consider removing `console.log` before merging to production.',
          });
        }

        // Example: Check for TODO comments
        if (content.includes('TODO')) {
          comments.push({
            path: file.filename,
            position: findPosition(content, 'TODO'),
            body: '📝 TODO comment found. Consider creating an issue to track this.',
          });
        }
      }

      // Check for large files
      if (file.changes > 500) {
        comments.push({
          path: file.filename,
          position: 1,
          body: '📦 This file has many changes. Consider splitting into smaller PRs.',
        });
      }
    }

    if (comments.length > 0) {
      await createReview(owner, repo, pullNumber, 'COMMENT', 'Automated review feedback', comments);
    }

    return { success: true, comments: comments.length };
  } catch (error) {
    console.error('Auto-review failed:', error);
    return { success: false, error };
  }
}

async function getFileContent(owner: string, repo: string, sha: string): Promise<string> {
  const { data } = await octokit.git.getBlob({ owner, repo, file_sha: sha });
  return Buffer.from(data.content, 'base64').toString();
}

function findPosition(content: string, search: string): number {
  const lines = content.split('\n');
  const lineIndex = lines.findIndex((line) => line.includes(search));
  return lineIndex + 1;
}
```

**Code Coverage Check:**

```typescript
// lib/github-coverage.ts
export async function postCoverageComment(
  owner: string,
  repo: string,
  pullNumber: number,
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  }
) {
  const body = `
## Code Coverage Report

| Metric | Coverage |
|--------|----------|
| Statements | ${coverage.statements}% |
| Branches | ${coverage.branches}% |
| Functions | ${coverage.functions}% |
| Lines | ${coverage.lines}% |

${coverage.statements < 80 ? '⚠️ Coverage is below 80% threshold' : '✅ Coverage looks good!'}
`;

  await addComment(owner, repo, pullNumber, body);
}
```

**Best Practices:**
- Run automated checks on every PR
- Provide constructive feedback in comments
- Use bots for repetitive review tasks
- Implement custom GitHub Actions for checks
- Review security vulnerabilities automatically
- Track code coverage trends

**Gotchas:**
- Review comments must reference specific lines
- Position is relative to the diff, not the file
- Can't comment on unchanged lines
- Rate limits apply to automated reviews

## 💡 Real-World Examples

### Example 1: Automated Release Management

```typescript
// scripts/create-release.ts
import { createRelease, uploadReleaseAsset } from './lib/github-releases';

async function createGitHubRelease(version: string, changelog: string) {
  const owner = 'your-org';
  const repo = 'your-repo';

  // Create release
  const { success, release } = await createRelease(owner, repo, {
    tag_name: `v${version}`,
    name: `Release v${version}`,
    body: changelog,
    draft: false,
    prerelease: version.includes('beta'),
  });

  if (!success) {
    throw new Error('Release creation failed');
  }

  // Upload assets
  const assets = ['dist/bundle.js', 'dist/bundle.js.map'];
  for (const asset of assets) {
    await uploadReleaseAsset(owner, repo, release!.id, asset);
  }

  console.log(`Release v${version} created successfully!`);
}
```

### Example 2: PR Automation Workflow

```yaml
# .github/workflows/pr-automation.yml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-label:
    runs-on: ubuntu-latest
    steps:
      - name: Label PR
        uses: actions/github-script@v7
        with:
          script: |
            const labels = [];
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number
            });

            // Auto-label based on files changed
            if (files.some(f => f.filename.includes('test'))) {
              labels.push('tests');
            }
            if (files.some(f => f.filename.includes('.md'))) {
              labels.push('documentation');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                labels
              });
            }
```

### Example 3: Stale Issue Bot

```typescript
// lib/cron/close-stale-issues.ts
export async function closeStaleIssues() {
  const owner = 'your-org';
  const repo = 'your-repo';
  const staleAfterDays = 30;

  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'waiting-for-response',
    per_page: 100,
  });

  const staleDate = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000);

  for (const issue of issues) {
    const updatedAt = new Date(issue.updated_at);

    if (updatedAt < staleDate) {
      // Add stale comment
      await addComment(
        owner,
        repo,
        issue.number,
        'This issue has been automatically closed due to inactivity. Please reopen if you believe this is still relevant.'
      );

      // Close issue
      await updateIssue(owner, repo, issue.number, {
        state: 'closed',
        labels: [...issue.labels.map((l) => l.name), 'stale'],
      });
    }
  }
}
```

## 🔗 Related Skills

- **git-expert** - Local git operations and workflows
- **devops-engineer** - CI/CD pipeline integration
- **docker-containers** - GitHub Container Registry
- **monorepo-expert** - Monorepo automation with GitHub

## 📖 Further Reading

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Complete GitHub automation with production examples*
