# Linear MCP

Project management and issue tracking integration for Linear.

## Overview

The Linear MCP provides seamless integration with Linear's project management platform. Create issues, manage projects, track sprints, and automate workflows directly from your development environment.

## Installation

```bash
npx -y @linear/mcp-server
```

## Environment Variables

```bash
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxx
LINEAR_TEAM_ID=your-team-id  # Optional: default team
```

Get your API key from: https://linear.app/settings/api

## Features

- **Issue Management**: Create, update, search, and close issues
- **Project Tracking**: Manage projects, milestones, and roadmaps
- **Sprint Operations**: Create cycles, assign issues, track velocity
- **Team Collaboration**: Comments, mentions, notifications
- **Workflow Automation**: Status updates, auto-assignment, triage rules
- **GraphQL Queries**: Advanced queries for custom workflows

## Usage Examples

### Create Issue from Code Context

```typescript
// During development - create issue directly
const issue = await linear.createIssue({
  title: "Implement bonding curve pricing",
  description: "Add constant product AMM formula",
  priority: 1,
  teamId: "YOUR_TEAM_ID",
  labels: ["feature", "blockchain"]
});
```

### Auto-triage Bugs

```typescript
// Automatically create issues from errors
try {
  await launchToken(params);
} catch (error) {
  await linear.createIssue({
    title: `Token launch failed: ${error.message}`,
    description: error.stack,
    priority: 0, // Urgent
    labels: ["bug", "production"]
  });
}
```

### Sprint Planning

```typescript
// Query issues for current cycle
const issues = await linear.getIssues({
  filter: {
    cycle: { number: { eq: 12 } },
    state: { type: { in: ["started", "unstarted"] } }
  }
});
```

## Tools Provided

- `linear_create_issue` - Create new issue
- `linear_update_issue` - Update issue status/priority
- `linear_search_issues` - Search with filters
- `linear_add_comment` - Add comment to issue
- `linear_create_project` - Create new project
- `linear_list_cycles` - List sprint cycles
- `linear_assign_issue` - Assign issue to team member

## Integration with Development

**GitHub Integration:**
- Auto-link PRs to Linear issues
- Update issue status on PR merge
- Create issues from PR comments

**Slack Integration:**
- Notifications for issue updates
- Quick issue creation from Slack
- Daily standup reports

**Web3 Use Cases:**
- Track smart contract audit findings
- Manage deployment checklists
- Bug bounty issue tracking
- Feature requests from community

## Repository

https://github.com/linear/mcp-server

---

**Version:** 1.0.0
**Category:** Project Management
**Last Updated:** 2025-01-08
