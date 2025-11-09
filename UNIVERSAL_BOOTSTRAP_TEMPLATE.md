# UNIVERSAL PROJECT BOOTSTRAP TEMPLATE
**ICM Motion Multi-Agent Orchestration System**

---

## 🎯 What This Is

A **copy-paste template** to initialize the ICM Motion orchestration system in any new project. Based on production patterns from widgets-for-launch achieving **88-92% token optimization** through:
- **Agent-on-demand creation** (create whatever agents you need)
- **Progressive disclosure skills** (30-50 tokens → expand when needed)
- **3-layer architecture** (Knowledge + Technical + Documentation)
- **Self-improving memory system**
- **MCP integration ready**

---

## 📋 How to Use

1. **Copy the entire "BOOTSTRAP PROMPT" section below**
2. **Paste into a new Claude Code session**
3. **Fill in the variables** (PROJECT_NAME, TECH_STACK, etc.)
4. **Claude will create the complete orchestration system**
5. **Start creating agents and skills as needed**

---

# 🚀 BOOTSTRAP PROMPT

> **Copy everything below this line and paste into your new project:**

---

# PROJECT INITIALIZATION: {PROJECT_NAME}

## CONTEXT
**Project Type:** {describe: e.g., "Solana DeFi AMM", "Next.js SaaS", "Mobile fitness app"}
**Tech Stack:** {list: e.g., "Rust/Anchor, Next.js 14, TypeScript, Supabase, Vercel"}
**Primary Goal:** {brief: e.g., "Implement constant-product swap with 0.3% fees"}

## EXECUTE: BOOTSTRAP ICM MOTION ORCHESTRATION SYSTEM

### PHASE 1: CREATE 3-LAYER ARCHITECTURE

```
/{PROJECT_ROOT}/
│
├── .agent/                           # LAYER 1: PROJECT KNOWLEDGE & LEARNING
│   ├── context/                      # Memory system
│   │   ├── successful-patterns.md   # Reusable solutions
│   │   ├── lessons-learned.md       # Mistakes to avoid
│   │   └── deployment-history.md    # Deployment audit trail
│   │
│   ├── logs/                         # Data flywheel (optional)
│   │   ├── interactions/            # Interaction logs (JSONL)
│   │   └── README.md
│   │
│   ├── metrics/                      # Performance tracking
│   │   └── dashboard.md
│   │
│   ├── sop/                          # Standard Operating Procedures
│   │   ├── SSOT.md                  # Single Source of Truth
│   │   └── SSOT-QUICK-REFERENCE.md
│   │
│   ├── README.md                     # 🌟 MASTER NAVIGATION HUB
│   ├── SOP.md                        # Processes & common mistakes
│   ├── SYSTEM.md                     # Architecture snapshot
│   ├── TASKS.md                      # Links to SPRINT.md
│   └── PLAN.md                       # Active work plan
│
├── .claude/                          # LAYER 2: TECHNICAL ORCHESTRATION
│   ├── agents/                       # Specialized agents (create on-demand)
│   │   ├── README.md                # Agent creation guide
│   │   └── _template.md             # Agent template
│   │
│   ├── commands/                     # Slash commands for workflows
│   │   ├── README.md                # Command creation guide
│   │   └── _template.md             # Command template
│   │
│   ├── skills/                       # Progressive disclosure skills
│   │   ├── README.md                # Skill creation guide
│   │   └── _template/               # Skill template
│   │       └── SKILL.md
│   │
│   ├── hooks/                        # Git hooks (optional)
│   │   └── conventional-commits.py
│   │
│   ├── templates/
│   │   └── PLAN_TEMPLATE.md
│   │
│   ├── AGENT_MANAGEMENT_RULES.md     # Coordination protocol
│   ├── CONTEXT_REFRESH_CHECKLIST.md  # Context cleanup guide
│   └── settings.json                 # MCP server configuration
│
├── docs/                             # LAYER 3: DOCUMENTATION
│   ├── adr/                          # Architecture Decision Records
│   │   └── README.md
│   │
│   ├── ssot/                         # Single Source of Truth
│   │   ├── README.md
│   │   ├── page.catalog.json        # Route specifications
│   │   ├── component.catalog.json   # Component contracts
│   │   ├── events.catalog.json      # Event taxonomy
│   │   └── data-models.yaml         # Canonical data models
│   │
│   └── SSOT.md                       # Frozen architectural decisions
│
├── CLAUDE.md                         # Project-specific instructions
├── SPRINT.md                         # Current priorities & completed work
├── DEPLOYMENT_STATUS.md              # Live deployment information
└── [your application code...]
```

### PHASE 2: INITIALIZE CORE FILES

#### 1. .agent/README.md (Master Navigation Hub)
```markdown
# {PROJECT_NAME} - Agent Navigation Hub

## 🎯 Quick Start Protocol

**Every session starts here:**
1. Read this file (you're doing it!)
2. Check `DEPLOYMENT_STATUS.md` - What's live?
3. Check `SPRINT.md` - What's the priority?
4. Review `.agent/context/successful-patterns.md` - What works?
5. Review `.agent/context/lessons-learned.md` - What to avoid?
6. Check `.agent/PLAN.md` - Active work plan

## 📂 File Directory

### Project State (Root Level)
- **CLAUDE.md** - Project-specific instructions and context
- **SPRINT.md** - Current sprint priorities and completed tasks
- **DEPLOYMENT_STATUS.md** - Live deployment info, env vars, program IDs

### Knowledge Layer (.agent/)
- **README.md** - This file (master navigation)
- **SOP.md** - Standard operating procedures
- **SYSTEM.md** - Current system architecture snapshot
- **PLAN.md** - Active work plan for current task
- **TASKS.md** - Task tracking (links to SPRINT.md)

### Memory System (.agent/context/)
- **successful-patterns.md** - Reusable solutions and patterns that worked
- **lessons-learned.md** - Mistakes to avoid, what didn't work
- **deployment-history.md** - Deployment audit trail
- Session summaries (dated .md files)

### Technical Layer (.claude/)
- **agents/** - Specialized agents (create on-demand)
- **skills/** - Progressive disclosure skills
- **commands/** - Slash commands for common workflows
- **AGENT_MANAGEMENT_RULES.md** - Agent coordination protocol

### Documentation (.docs/)
- **adr/** - Architecture Decision Records (immutable)
- **ssot/** - Single Source of Truth catalogs
- **SSOT.md** - Frozen architectural decisions

## 🔄 Standard Operating Procedures

### When Starting a Task
1. **Explore first** - Read relevant files WITHOUT coding
2. **Plan** - Use "think hard" mode for complex tasks
3. **TodoWrite** - Create plan for 3+ step tasks
4. **Execute** - Implement incrementally
5. **Verify** - Test, review, iterate
6. **Document** - Update memory files after major tasks

### When to Use Agents
- **Always** for UI/design work (mandatory)
- For specialized domains (security, performance, DevOps)
- For large-scale operations (100k+ tokens)
- Never for simple single-file edits

### When to Use Skills
- When you need technical guidance (loads 30-50 tokens initially)
- Progressive disclosure - expands only when needed
- Check `.claude/skills/` for available skills

### When to Update Memory
- After completing major features
- After fixing complex bugs
- After deployments
- After learning something important
- Weekly review recommended

## 🚨 Critical Rules
- **NO direct coding on UI tasks** - Use UI/UX agent → Frontend developer workflow
- **Read before writing** - Always explore codebase first
- **Update SPRINT.md** - Keep current priorities visible
- **Respect SSOT** - Don't contradict frozen decisions
- **Document decisions** - Create ADRs for major choices

## 🎓 Learning System
- **Successful patterns** - Copy what works
- **Lessons learned** - Avoid repeating mistakes
- **Data flywheel** - Continuous improvement through logging
- **Metrics** - Track performance in `.agent/metrics/dashboard.md`

## 📞 Quick Commands
- `/feature` - Start new Git Flow feature branch
- `/code-review` - Comprehensive code review
- `/security-audit` - Security vulnerability scan
- `/architecture-review` - Architecture evaluation
- Check `.claude/commands/` for all available commands

---

**Remember:** This system optimizes for **action over discussion**. Ship with precision.
```

#### 2. .agent/SOP.md (Standard Operating Procedures)
```markdown
# Standard Operating Procedures

## 🎯 Prime Directive
**Action > Discussion.** Protect funds & time. Ship with precision.

## Workflow: EXPLORE → PLAN → EXECUTE → VERIFY

### 1. EXPLORE (Mandatory First Step)
**Before writing ANY code:**
- Read relevant files to understand current implementation
- Search codebase for similar patterns
- Check `.agent/context/successful-patterns.md` for reusable solutions
- Review `.agent/context/lessons-learned.md` to avoid mistakes
- Check `docs/adr/` for architectural context

**Tools:**
- Grep/Glob for finding files and patterns
- Read for understanding existing code
- Task tool with Explore agent for broad searches

### 2. PLAN (For Complex Tasks)
**Use "think hard" mode when:**
- Task has 3+ steps
- Multiple files affected
- Architectural implications
- Security/fund handling involved
- Multi-agent coordination needed

**Planning tools:**
- TodoWrite for tracking steps
- PLAN_TEMPLATE.md for structure
- Agent coordination via AGENT_MANAGEMENT_RULES.md

### 3. EXECUTE (Incremental Implementation)
**Execution principles:**
- Smallest diff that ships
- One logical change per commit
- Test as you go
- TypeScript strict mode (if applicable)
- Security audit on fund-handling code

**Code quality gates:**
- No console errors
- All functions typed/documented
- Tests exist for new features
- Security review for sensitive code

### 4. VERIFY (Before Marking Complete)
**Verification checklist:**
- [ ] Code runs without errors
- [ ] Tests pass
- [ ] TypeScript compiles (if applicable)
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated
- [ ] SPRINT.md updated

## Common Mistakes to Avoid

### ❌ Don't Skip Exploration
**Bad:** User asks for feature → immediately start coding
**Good:** Read existing code → understand patterns → plan → code

### ❌ Don't Make Design Decisions in Code
**Bad:** Frontend developer chooses colors/spacing/layout
**Good:** UI/UX agent creates design spec → Frontend implements

### ❌ Don't Pollute Context
**Bad:** Load entire 100k line log file into main thread
**Good:** Use subagent with Task tool to analyze logs

### ❌ Don't Forget Memory Updates
**Bad:** Complete major feature → move to next task
**Good:** Complete feature → update successful-patterns.md → next task

### ❌ Don't Ignore Quality Gates
**Bad:** "Tests failing but feature works, shipping it"
**Good:** Fix tests → verify all checks pass → then ship

## Agent Coordination Protocol

### UI/UX Workflow (MANDATORY)
```
User request for UI change
    ↓
UI/UX Agent creates design spec (exact colors, spacing, WCAG compliance)
    ↓
User approves design
    ↓
Frontend Agent implements from spec
    ↓
UI/UX Agent reviews implementation
    ↓
Iterate if needed → User accepts
```

### Security Workflow (MANDATORY for sensitive code)
```
Implement feature with fund handling / authentication / encryption
    ↓
Security Auditor reviews code
    ↓
Fix vulnerabilities
    ↓
Re-audit
    ↓
Deploy only when audit passes
```

### Multi-Agent Task Tracking
**Use TodoWrite with agent assignments:**
```markdown
- Design login form (UI/UX) - completed
- Implement login component (Frontend) - in_progress
- Review design compliance (UI/UX) - pending
- Security audit (Security) - pending
- Deploy to staging (DevOps) - pending
```

## Memory Management

### When to Update successful-patterns.md
- Solved a complex bug with elegant solution
- Discovered efficient workflow
- Created reusable component/function
- Implemented performance optimization

### When to Update lessons-learned.md
- Made a mistake that caused issues
- Discovered anti-pattern
- Hit edge case or gotcha
- Deployment failure or incident

### When to Update deployment-history.md
- Every deployment to production
- Rollbacks
- Configuration changes
- Migration events

## File Modification Rules

### Immutable Files (Never Edit)
- `docs/adr/*.md` - Architecture Decision Records are frozen
- `docs/SSOT.md` - Only update through formal process
- `.agent/context/session-*.md` - Historical records

### Dynamic Files (Update Frequently)
- `SPRINT.md` - Current priorities
- `DEPLOYMENT_STATUS.md` - Live state
- `.agent/PLAN.md` - Active work
- `.agent/context/successful-patterns.md` - Ongoing learning

### Versioned Files (Git Flow)
- All application code
- Tests
- Configuration (track changes via ADRs)

## Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation only

### Commit Format
```
[AGENT-NAME] brief description

Detailed explanation if needed.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Quality Gates Before PR
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Linting passes
- [ ] Security audit (if sensitive code)
- [ ] Code review
- [ ] Documentation updated

## Tool Usage Guidelines

### Use Task Tool When:
- Open-ended codebase exploration
- Operations likely to exceed 10k tokens output
- Need specialized agent (UI/UX, Security, etc.)
- Multi-step research required

### Use Skills When:
- Need technical guidance on specific topic
- Want progressive disclosure (light initial load)
- Reference implementation patterns

### Use Slash Commands When:
- Quick focused operations
- Standard workflows (feature branch, code review)
- < 10k token expected output

### Use Direct Tools When:
- Reading specific files
- Editing specific functions
- Running tests/builds
- Quick grep/glob searches

## Context Optimization

### Progressive Disclosure Strategy
1. Start with summaries (SSOT.md, README.md)
2. Load detailed files only when needed
3. Use skills for technical deep-dives
4. Delegate heavy operations to subagents

### Token Budget Management
- Aim for < 30k tokens per session
- Offload large operations to agents
- Use MCP servers (90%+ savings on common ops)
- Clean context regularly (CONTEXT_REFRESH_CHECKLIST.md)

---

**Remember:** These procedures exist to maintain quality while moving fast. Follow them.
```

#### 3. .agent/SYSTEM.md
```markdown
# {PROJECT_NAME} System Architecture

## Tech Stack

### Frontend
- **Framework:** {e.g., Next.js 14, React Native, Vue 3}
- **Language:** {e.g., TypeScript}
- **Styling:** {e.g., Tailwind CSS, btdemo design system}
- **State:** {e.g., Zustand, Redux}

### Backend
- **Framework:** {e.g., Express, FastAPI, Anchor}
- **Language:** {e.g., TypeScript, Python, Rust}
- **Database:** {e.g., PostgreSQL via Supabase, MongoDB}
- **Auth:** {e.g., Privy, Auth0, NextAuth}

### Infrastructure
- **Hosting:** {e.g., Vercel, AWS, Railway}
- **Database:** {e.g., Supabase, PlanetScale}
- **Storage:** {e.g., S3, Cloudinary}
- **Monitoring:** {e.g., Sentry, Datadog}

### Blockchain (if applicable)
- **Chain:** {e.g., Solana, Ethereum}
- **Framework:** {e.g., Anchor, Hardhat}
- **RPC:** {e.g., Helius, Alchemy}

## High-Level Architecture

{Describe core components and how they interact}

Example:
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ───> │   Backend   │ ───> │  Database   │
│  (Next.js)  │ <─── │  (Anchor)   │ <─── │ (Supabase)  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │
       │                     ↓
       │              ┌─────────────┐
       └─────────────>│  Blockchain │
                      │  (Solana)   │
                      └─────────────┘
```

## Data Flow

{Describe how data moves through the system}

## Key Design Decisions

### Decision 1: {Technology Choice}
- **What:** {Brief description}
- **Why:** {Rationale}
- **ADR:** See `docs/adr/ADR-XXX.md`

### Decision 2: {Architecture Pattern}
- **What:** {Brief description}
- **Why:** {Rationale}
- **ADR:** See `docs/adr/ADR-YYY.md`

## Security Model

### Authentication
{Describe auth approach}

### Authorization
{Describe access control}

### Data Protection
{Describe encryption, secret management}

## Performance Targets

- **Page Load:** {e.g., < 1s}
- **API Response:** {e.g., < 200ms p95}
- **Transaction Finality:** {e.g., < 5s}

## Deployment Pipeline

{Describe CI/CD flow}

Example:
```
GitHub push → Tests → Build → Preview Deploy → Staging → Production
```

## Monitoring & Observability

- **Errors:** {e.g., Sentry}
- **Logs:** {e.g., Vercel logs, CloudWatch}
- **Metrics:** {e.g., Custom dashboard}
- **Alerts:** {e.g., PagerDuty, Slack}

---

**Last Updated:** {DATE}
```

#### 4. SPRINT.md
```markdown
# Sprint: {SPRINT_NAME}
**Dates:** {START_DATE} - {END_DATE}

## 🎯 Sprint Goal
{One sentence describing the primary objective}

## 🔥 Current Priorities
1. {Top priority task}
2. {Second priority task}
3. {Third priority task}

## 📋 Sprint Backlog

### In Progress
- [ ] {Task description} - Owner: {Name/Agent} - Started: {DATE}

### To Do
- [ ] {Task description}
- [ ] {Task description}

### Blocked
- [ ] {Task description} - **Blocker:** {Description}

## ✅ Completed This Sprint

### {DATE}
- [x] {Task description} - Completed by {Agent/Person}
- [x] {Task description} - Completed by {Agent/Person}

### {DATE}
- [x] {Task description} - Completed by {Agent/Person}

## 📊 Sprint Metrics
- **Completed:** {X} tasks
- **In Progress:** {Y} tasks
- **Blocked:** {Z} tasks
- **Velocity:** {Tasks per day}

## 🎓 Lessons Learned
{Update at sprint end - what went well, what didn't}

## 🚀 Next Sprint Preview
{Planned priorities for next sprint}

---

**Remember:** Update this file daily. It drives the entire project.
```

#### 5. DEPLOYMENT_STATUS.md
```markdown
# Deployment Status

## 🌍 Live Environments

### Production
- **URL:** {https://...}
- **Status:** {🟢 Live | 🟡 Degraded | 🔴 Down}
- **Last Deploy:** {DATE & TIME}
- **Version:** {e.g., v1.2.3}
- **Deployed By:** {Name/Agent}

### Staging
- **URL:** {https://...}
- **Status:** {🟢 Live | 🟡 Degraded | 🔴 Down}
- **Last Deploy:** {DATE & TIME}
- **Version:** {e.g., v1.2.3-rc.1}

### Development
- **URL:** {https://... or localhost:3000}
- **Status:** {🟢 Running | 🔴 Stopped}

## 🔑 Environment Variables

### Production
```bash
# Add non-sensitive vars here
NEXT_PUBLIC_API_URL=https://api.production.com
NEXT_PUBLIC_CHAIN=mainnet
# Sensitive vars stored in: {Vercel/AWS Secrets Manager/etc.}
```

### Staging
```bash
NEXT_PUBLIC_API_URL=https://api.staging.com
NEXT_PUBLIC_CHAIN=devnet
```

## 🔗 Critical Resources

### Smart Contracts (if applicable)
- **Program ID (mainnet):** {xxxxx}
- **Program ID (devnet):** {xxxxx}
- **Explorer:** {https://...}

### API Endpoints
- **Production:** {https://api.production.com}
- **Staging:** {https://api.staging.com}

### External Services
- **Database:** {Supabase project URL}
- **CDN:** {Cloudflare/CloudFront URL}
- **Monitoring:** {Sentry project}

## 📞 Incident Contacts
- **On-Call:** {Name/Role}
- **Slack Channel:** {#incidents}
- **Escalation:** {Email/Phone}

## 🚨 Known Issues
- {Issue description} - **Status:** {Investigating/Fixing/Monitoring}

## 📅 Deployment Schedule
- **Production Deploys:** {e.g., Tuesdays & Thursdays, 10am PST}
- **Emergency Hotfixes:** {Process description}

---

**Last Updated:** {TIMESTAMP}
```

#### 6. CLAUDE.md
```markdown
# {PROJECT_NAME} - Project Context

## Overview
{Brief project description - 2-3 sentences}

## Prime Directive
**Action > Discussion.** Protect funds & time. Ship with precision.

## Session Start Protocol
1. Read `.agent/README.md` - Master navigation
2. Check `DEPLOYMENT_STATUS.md` - What's live?
3. Check `SPRINT.md` - What's the priority?
4. Review `.agent/context/successful-patterns.md` - What works?
5. Review `.agent/context/lessons-learned.md` - What to avoid?

## Tech Stack Quick Reference
- **Frontend:** {Next.js 14 + TypeScript + Tailwind}
- **Backend:** {Rust/Anchor on Solana}
- **Database:** {Supabase PostgreSQL}
- **Deployment:** {Vercel}

## Critical Rules

### Code Quality
- TypeScript strict mode enforced
- Zod validation on all API boundaries
- Security audit required for fund-handling code
- Smallest diff that ships

### Workflow
- **PLAN** (if complex) → **EXECUTE** (minimal diffs) → **VERIFY** → **DOCUMENT**

### Agent Usage
- **MANDATORY:** Use UI/UX agent for all design decisions
- **REQUIRED:** Security auditor for smart contracts
- **RECOMMENDED:** Specialized agents for domain expertise

### Documentation
- Architecture decisions → Create ADR
- Major changes → Update SSOT
- Completed tasks → Update SPRINT.md
- Learnings → Update memory files

## Project-Specific Context

### Domain Knowledge
{Add project-specific domain knowledge, business rules, etc.}

### Special Considerations
{Add any unique constraints, requirements, or context}

### Common Workflows
1. **New Feature:** `/feature` → design → implement → review → deploy
2. **Bug Fix:** Diagnose → fix → test → hotfix (if urgent)
3. **Deployment:** Tests pass → staging → prod (Tues/Thurs 10am)

## File Organization
- **Application code:** `/src`, `/app`, `/programs`, etc.
- **Tests:** `/tests`, `/__tests__`, `*.test.ts`
- **Documentation:** `/docs`
- **Orchestration:** `/.claude`, `/.agent`

## Quick Links
- **Repo:** {GitHub URL}
- **Production:** {Live URL}
- **Docs:** {Documentation URL}
- **Figma:** {Design URL}

---

**Role:** Elite full-stack {domain} engineer for {Your Name}
```

#### 7. .claude/AGENT_MANAGEMENT_RULES.md
```markdown
# Agent Management Rules

## Core Principle
**Agents are specialists.** Use them for their domain expertise, not as general-purpose workers.

## When to Use Agents

### MANDATORY Agent Usage
1. **UI/UX Work** - All design decisions require UI/UX agent
2. **Security Audits** - All sensitive code requires Security Auditor
3. **Smart Contract Code** - Blockchain development requires specialized agent
4. **Performance Optimization** - Performance issues require Performance Engineer

### RECOMMENDED Agent Usage
- Complex database schemas → Database Architect
- API design → Backend Architect
- DevOps/deployment → DevOps Specialist
- Documentation → Technical Writer
- Code review → Code Reviewer

### DON'T Use Agents For
- Simple file edits
- Typo fixes
- Reading/exploring code
- Quick grep/glob searches

## Agent Coordination Workflows

### UI/UX → Frontend Developer (MANDATORY)
```
User Request: "Add dark mode toggle"
    ↓
UI/UX Agent:
  - Creates complete design spec
  - Exact colors, spacing, states
  - WCAG 2.1 AA compliance check
  - Interaction patterns defined
    ↓
User Approval Required
    ↓
Frontend Developer:
  - Implements from spec (NO design decisions)
  - Follows exact specifications
  - Preserves brand consistency
    ↓
UI/UX Agent Review:
  - Validates implementation matches spec
  - Checks accessibility
  - Verifies responsive behavior
    ↓
Iterate if needed → User Acceptance
```

### Backend → Security → DevOps (Sequential)
```
Backend Architect:
  - Designs API structure
  - Implements endpoints
  - Writes tests
    ↓
Security Auditor:
  - Reviews authentication
  - Checks authorization
  - Validates input sanitization
  - Scans for OWASP Top 10
    ↓
Fix vulnerabilities → Re-audit
    ↓
DevOps Specialist:
  - Deploys to staging
  - Configures monitoring
  - Deploys to production
```

### Parallel Agent Workflow (Efficiency)
```
UI/UX Agent:     Design Component A → Review Implementation A
                       ↓                           ↑
Frontend Dev:    Implement Component B ────────────┘
                       ↑
                 (B already designed)
```

## Agent Communication Protocol

### Task Handoff Format
```markdown
@{AGENT-NAME}: {Brief task description}

**Objective:** {Clear, specific goal}
**Context:** {Relevant background}
**Input:** {What you're providing}
**Expected Output:** {What you need back}
**Dependencies:** {Other agents or resources needed}
**Quality Gates:** {Acceptance criteria}

{Additional details, links, or references}
```

### Example Handoff
```markdown
@ui-ux-designer: Design token launch card component

**Objective:** Create visually striking card to display token launches
**Context:** Part of token discovery feed, displaying 3-4 cards per row
**Input:**
  - Brand colors: #FF6B00 (primary), #000000 (bg)
  - Required data: Token logo, name, ticker, price, 24h change
**Expected Output:**
  - Exact design spec (Figma or detailed markdown)
  - Hover/active states
  - Mobile responsive behavior
  - WCAG 2.1 AA compliance
**Dependencies:** btdemo-design-system skill
**Quality Gates:**
  - All spacing in 4px increments
  - Color contrast ratio ≥ 4.5:1
  - Touch targets ≥ 44px

Reference: See existing "NFT Card" component in `/components/NFTCard.tsx`
```

## Agent Output Requirements

### UI/UX Agent Must Provide
- Exact hex codes (not "dark blue")
- Precise spacing (16px, not "medium padding")
- Font sizes and weights
- Hover/focus/active states
- Mobile breakpoint behavior
- Accessibility compliance checklist

### Security Auditor Must Provide
- Specific vulnerabilities found (with line numbers)
- Severity ratings (Critical/High/Medium/Low)
- Remediation steps
- Re-audit after fixes

### Performance Engineer Must Provide
- Benchmark results (before/after)
- Specific bottlenecks identified
- Optimization recommendations
- Expected improvements (with metrics)

## Quality Gates

### Before Agent Handoff
- [ ] Clear objective defined
- [ ] Context provided
- [ ] Expected output format specified
- [ ] Quality criteria established

### Before Accepting Agent Output
- [ ] Output meets specified format
- [ ] Quality gates passed
- [ ] No missing requirements
- [ ] Ready for next step

### Before Marking Task Complete
- [ ] Final review by appropriate agent
- [ ] User acceptance (if design/UX)
- [ ] Documentation updated
- [ ] SPRINT.md updated

## Agent Creation Guidelines

### When to Create a New Agent
- You need specialized expertise repeatedly
- Domain requires specific knowledge
- Quality gates need enforcement
- Coordination pattern is reusable

### Agent Definition Template
See `.claude/agents/_template.md`

### Agent Naming Convention
`{domain}-{role}.md`
- ui-ux-designer (not "designer")
- security-auditor (not "security")
- performance-engineer (not "perf")

## Common Anti-Patterns

### ❌ DON'T: Skip Agent for Speed
**Bad:** User wants UI change → Frontend dev makes design decisions
**Why Bad:** Inconsistent design, accessibility issues, brand violations
**Correct:** UI/UX agent → design spec → frontend implements

### ❌ DON'T: Vague Agent Briefings
**Bad:** "@security-auditor: Review the code"
**Why Bad:** Unclear scope, missing context, undefined output
**Correct:** Specific objective, files to review, expected vulnerability report format

### ❌ DON'T: Agent for Simple Tasks
**Bad:** "@code-reviewer: Fix typo in README"
**Why Bad:** Overhead, unnecessary delegation, slower execution
**Correct:** Just fix the typo directly

### ❌ DON'T: Bypass Quality Gates
**Bad:** UI/UX spec incomplete → frontend proceeds anyway
**Why Bad:** Rework, design debt, user experience issues
**Correct:** Wait for complete spec → then implement

## TodoWrite for Multi-Agent Tasks

**Always use TodoWrite to track agent coordination:**

```markdown
- Design feature (UI/UX Agent) - completed
- User approval - completed
- Implement frontend (Frontend Developer) - in_progress
- Security review (Security Auditor) - pending
- Performance check (Performance Engineer) - pending
- Deploy to staging (DevOps Specialist) - pending
- User testing - pending
```

**Benefits:**
- Visibility into workflow progress
- Clear handoff points
- Nothing falls through cracks
- User sees coordination in action

---

**Remember:** Agents ensure quality. Don't skip them to save time - you'll lose more time fixing issues later.
```

#### 8. .claude/agents/_template.md (Agent Creation Template)
```markdown
# {AGENT_NAME}

## Domain
{Specific area of expertise - be precise}

## Capabilities
- {Primary skill 1 - what this agent excels at}
- {Primary skill 2}
- {Primary skill 3}
- {Primary skill 4}

## Model Recommendation
{sonnet | opus | haiku}

**Rationale:** {Why this model? Consider complexity, context needs, speed}

## Tools
{List tools this agent needs access to}
- Read, Write, Edit (most agents)
- Bash (for testing, running tools)
- WebFetch (for documentation)
- Grep, Glob (for exploration)

## Input Format

**Required information:**
- {What must be provided to this agent}
- {Context needed}
- {Expected output format}

**Optional information:**
- {What can help but isn't required}

**Example briefing:**
```markdown
@{agent-name}: {Brief task description}

**Objective:** {Clear goal}
**Context:** {Background}
**Input:** {What you're providing}
**Expected Output:** {What you need}
**Quality Gates:** {Acceptance criteria}
```

## Output Format

**This agent produces:**
- {Output type 1 - e.g., "Design specifications in markdown"}
- {Output type 2 - e.g., "Figma links"}
- {Output type 3 - e.g., "Accessibility checklist"}

**Output must include:**
- {Required element 1}
- {Required element 2}
- {Required element 3}

**Example output:**
{Provide example of well-formed output}

## Dependencies

**Skills this agent uses:**
- {skill-name} - {why needed}

**Other agents this agent coordinates with:**
- {agent-name} - {how they interact}

**External resources:**
- {Documentation, APIs, tools needed}

## Quality Standards

**This agent enforces:**
- {Standard 1 - e.g., "WCAG 2.1 AA compliance"}
- {Standard 2 - e.g., "TypeScript strict mode"}
- {Standard 3 - e.g., "Test coverage > 80%"}

**Acceptance criteria:**
- [ ] {Checkpoint 1}
- [ ] {Checkpoint 2}
- [ ] {Checkpoint 3}

## Workflow Integration

**When this agent is invoked:**
1. {Step 1 of typical workflow}
2. {Step 2}
3. {Step 3}

**Hands off to:** {Next agent in workflow, or "User" for final approval}

## Common Tasks

### Task 1: {Common task name}
**Input:** {What's provided}
**Process:** {How agent handles it}
**Output:** {What's produced}

### Task 2: {Common task name}
**Input:** {What's provided}
**Process:** {How agent handles it}
**Output:** {What's produced}

## Examples

### Example 1: {Scenario}
```
User Request: {What user asked for}

Agent Briefing:
@{agent-name}: {How task was delegated}
**Objective:** {Goal}
**Input:** {Provided context}
**Expected Output:** {Desired result}

Agent Output:
{What agent produced}

Result: {Outcome - success/iteration needed/etc.}
```

### Example 2: {Scenario}
{Another complete example}

## Anti-Patterns

### ❌ DON'T: {Anti-pattern 1}
**Why:** {Explanation}
**Instead:** {Correct approach}

### ❌ DON'T: {Anti-pattern 2}
**Why:** {Explanation}
**Instead:** {Correct approach}

## Notes
{Any additional context, gotchas, or tips for using this agent effectively}

---

**Created:** {DATE}
**Last Updated:** {DATE}
**Version:** {1.0}
```

#### 9. .claude/skills/_template/SKILL.md (Skill Template)
```markdown
# {SKILL_NAME}

> {One-sentence description of what this skill provides}

## Quick Reference (30-50 tokens)

**Use this skill when:**
- {Scenario 1}
- {Scenario 2}
- {Scenario 3}

**Key concepts:**
- **{Concept 1}**: {Brief definition}
- **{Concept 2}**: {Brief definition}
- **{Concept 3}**: {Brief definition}

**Quick start:**
```{language}
{Minimal working example - 5-10 lines}
```

---

## Detailed Guide

{The rest of this file expands progressively when needed}

### Core Concepts

#### {Concept 1}
{Detailed explanation}

**Example:**
```{language}
{Code example}
```

#### {Concept 2}
{Detailed explanation}

**Example:**
```{language}
{Code example}
```

### Common Patterns

#### Pattern 1: {Pattern Name}
**Use case:** {When to use this}

**Implementation:**
```{language}
{Code example}
```

**Gotchas:**
- {Potential issue 1}
- {Potential issue 2}

#### Pattern 2: {Pattern Name}
{Same structure}

### Best Practices
1. {Best practice 1}
2. {Best practice 2}
3. {Best practice 3}

### Security Considerations
- {Security concern 1}
- {Security concern 2}

### Performance Optimization
- {Optimization tip 1}
- {Optimization tip 2}

### Troubleshooting

#### Issue: {Common problem}
**Symptoms:** {How you know you have this problem}
**Cause:** {Why it happens}
**Solution:** {How to fix}

#### Issue: {Common problem}
{Same structure}

### References
- [Official Docs]({URL})
- [Tutorial]({URL})
- [GitHub Examples]({URL})

---

**Tags:** {tag1, tag2, tag3}
**Related Skills:** {other-skill-1, other-skill-2}
**Last Updated:** {DATE}
```

#### 10. .claude/settings.json (MCP Configuration)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "{PROJECT_ROOT}"],
      "description": "Local file operations (80-90% token savings)"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upwith/context7"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      },
      "description": "Latest SDK docs & API patterns (60-80% savings)"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "description": "GitHub PRs, issues, code search (60-90% savings)"
    }
  }
}
```

{Add deployment-specific MCP servers: vercel, railway, aws, etc.}

#### 11. docs/SSOT.md (Single Source of Truth)
```markdown
# Single Source of Truth

## Purpose
This file contains **frozen architectural decisions** that must not be contradicted.

**Rules:**
1. Once added, decisions are immutable
2. Changes require formal review process
3. ADRs document the "why" behind decisions
4. This file is the "what"

## Frozen Decisions

### Technology Stack
- **Frontend Framework:** {Next.js 14 - ADR-001}
- **Backend Framework:** {Rust/Anchor - ADR-002}
- **Database:** {PostgreSQL via Supabase - ADR-003}
- **Authentication:** {Privy - ADR-004}
- **Deployment:** {Vercel - ADR-005}

### Architecture Patterns
- **Routing:** {App Router - ADR-001}
- **State Management:** {Zustand - ADR-006}
- **API Design:** {RESTful with tRPC - ADR-007}
- **Smart Contract Pattern:** {Anchor programs - ADR-002}

### Design System
- **Component Library:** {btdemo design system - ADR-008}
- **Styling:** {Tailwind CSS - ADR-001}
- **Accessibility:** {WCAG 2.1 AA mandatory}

### Security
- **Authentication:** {Privy wallet auth - ADR-004}
- **Authorization:** {Row Level Security - ADR-003}
- **Secrets Management:** {Vercel env vars - ADR-005}

### Data Models
See `docs/ssot/data-models.yaml` for canonical data structures

### API Contracts
See `docs/ssot/page.catalog.json` and `docs/ssot/component.catalog.json`

### Event Taxonomy
See `docs/ssot/events.catalog.json`

## Change Process

**To modify a frozen decision:**
1. Create ADR proposing change
2. Document rationale and alternatives
3. Get stakeholder approval
4. Update this file
5. Create migration plan
6. Execute migration
7. Update documentation

**Minor clarifications** can be made inline with notation:
```markdown
- **{Technology}:** {Choice} - ADR-XXX [CLARIFIED {DATE}: {Clarification}]
```

---

**Last Updated:** {DATE}
**Version:** {1.0}
```

#### 12. .agent/context/successful-patterns.md
```markdown
# Successful Patterns

> Reusable solutions and approaches that worked well

## Purpose
Document patterns, solutions, and workflows that proved effective. **Reuse these.**

---

## Code Patterns

### Pattern: {Pattern Name}
**Context:** {When/why this pattern was needed}
**Solution:**
```{language}
{Code example}
```
**Why it worked:** {Explanation}
**Reuse for:** {Similar scenarios}
**Date:** {YYYY-MM-DD}

---

## Workflow Patterns

### Workflow: {Workflow Name}
**Context:** {What we were trying to accomplish}
**Steps:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Why it worked:** {Explanation}
**Reuse for:** {Similar scenarios}
**Date:** {YYYY-MM-DD}

---

## Agent Coordination Patterns

### Pattern: {Agent coordination approach}
**Context:** {Type of task requiring multi-agent work}
**Agents involved:**
- {Agent 1 - role}
- {Agent 2 - role}

**Workflow:**
```
{Step-by-step coordination}
```

**Why it worked:** {Explanation}
**Reuse for:** {Similar tasks}
**Date:** {YYYY-MM-DD}

---

## Problem-Solving Patterns

### Problem: {What was the challenge}
**Solution:** {How we solved it}
**Why it worked:** {Explanation}
**Reuse for:** {Similar problems}
**Date:** {YYYY-MM-DD}

---

## Update Protocol
- Add new patterns after completing significant features
- Include enough context for future reuse
- Link to relevant code/docs
- Date all entries
```

#### 13. .agent/context/lessons-learned.md
```markdown
# Lessons Learned

> Mistakes made and how to avoid them

## Purpose
Document what **didn't work** so we don't repeat mistakes.

---

## Code Anti-Patterns

### Mistake: {What we did wrong}
**Context:** {What we were trying to accomplish}
**What happened:** {Negative outcome}
**Why it failed:** {Root cause}
**Correct approach:** {How to do it right}
**Date:** {YYYY-MM-DD}

---

## Workflow Mistakes

### Mistake: {Process error}
**Context:** {Situation}
**What happened:** {Negative outcome}
**Why it failed:** {Root cause}
**Correct approach:** {How to do it right}
**Date:** {YYYY-MM-DD}

---

## Agent Coordination Failures

### Mistake: {Coordination error}
**Context:** {What we were trying to do}
**What happened:** {Confusion, rework, quality issues}
**Why it failed:** {Root cause - vague briefing, skipped review, etc.}
**Correct approach:** {Proper coordination pattern}
**Date:** {YYYY-MM-DD}

---

## Architecture Mistakes

### Mistake: {Design decision that backfired}
**Context:** {Why we made this choice}
**What happened:** {Technical debt, performance issues, etc.}
**Why it failed:** {Root cause}
**How we fixed it:** {Solution or migration}
**Prevent by:** {What to do instead}
**Date:** {YYYY-MM-DD}

---

## Deployment Incidents

### Incident: {What went wrong in deployment}
**Context:** {What we were deploying}
**What happened:** {Downtime, data loss, etc.}
**Root cause:** {Why it happened}
**Resolution:** {How we fixed it}
**Prevent by:** {Process change, check added, etc.}
**Date:** {YYYY-MM-DD}

---

## Update Protocol
- Add lessons immediately after incidents or mistakes
- Be honest - no blame, just learning
- Focus on prevention
- Link to ADRs if architectural decision changed
```

#### 14. .agent/context/deployment-history.md
```markdown
# Deployment History

> Audit trail of all deployments

## Purpose
Track every deployment for debugging, rollback, and compliance.

---

## {YYYY-MM-DD HH:MM} - Production Deploy

**Version:** {v1.2.3}
**Deployed By:** {Name/Agent}
**Environment:** Production
**Commit:** {git hash}
**Branch:** {main}

**Changes:**
- {Change 1}
- {Change 2}
- {Change 3}

**Migration Required:** {Yes/No}
**Migration Details:** {If yes, describe}

**Rollback Plan:** {How to rollback if issues}

**Post-Deploy Checklist:**
- [ ] Health checks pass
- [ ] No error spikes in Sentry
- [ ] Key user flows tested
- [ ] Performance metrics stable

**Issues:** {Any issues encountered}
**Resolution:** {How resolved}

---

## {YYYY-MM-DD HH:MM} - Staging Deploy

{Same format}

---

## {YYYY-MM-DD HH:MM} - Emergency Hotfix

**Version:** {v1.2.4}
**Deployed By:** {Name}
**Environment:** Production
**Incident:** {Link to incident report}
**Urgency:** Critical

**Issue:** {What broke}
**Fix:** {What was changed}
**Testing:** {How tested before deploy}

**Post-Deploy:**
- [ ] Issue resolved
- [ ] No regressions
- [ ] Monitoring confirms stability

---

## Update Protocol
- Log every production deploy (no exceptions)
- Log staging deploys for major changes
- Log all hotfixes
- Include rollback plan
```

### PHASE 3: CREATE DOCUMENTATION STRUCTURE

#### 15. docs/adr/README.md
```markdown
# Architecture Decision Records (ADRs)

## Purpose
Document **why** we made significant architectural decisions.

## Format
Each ADR follows this structure:
- **Status:** {Proposed | Accepted | Deprecated | Superseded}
- **Context:** What's the issue we're addressing?
- **Decision:** What did we decide?
- **Consequences:** What are the implications (positive and negative)?

## ADR Index

### ADR-001: {Decision Title}
**Status:** Accepted
**Date:** {YYYY-MM-DD}
**Context:** {Brief summary}
**File:** `ADR-001-{slug}.md`

### ADR-002: {Decision Title}
**Status:** Accepted
**Date:** {YYYY-MM-DD}
**Context:** {Brief summary}
**File:** `ADR-002-{slug}.md`

---

## Creating a New ADR

1. Copy template: `cp docs/adr/_template.md docs/adr/ADR-XXX-{slug}.md`
2. Fill in all sections
3. Get stakeholder review
4. Update this index
5. Reference in SSOT.md if it freezes a decision
```

#### 16. docs/adr/_template.md
```markdown
# ADR-{XXX}: {Decision Title}

**Status:** {Proposed | Accepted | Deprecated | Superseded by ADR-YYY}
**Date:** {YYYY-MM-DD}
**Decision Makers:** {Who was involved}

## Context
{What's the issue we're addressing? What forces are at play? What's driving this decision?}

## Decision
{What did we decide to do? Be specific and concrete.}

## Rationale
{Why did we make this decision? What are the key factors?}

## Alternatives Considered

### Alternative 1: {Name}
**Pros:**
- {Pro 1}
- {Pro 2}

**Cons:**
- {Con 1}
- {Con 2}

**Why rejected:** {Explanation}

### Alternative 2: {Name}
{Same structure}

## Consequences

### Positive
- {Positive outcome 1}
- {Positive outcome 2}

### Negative
- {Negative outcome 1 - might be technical debt, complexity, cost}
- {Negative outcome 2}

### Neutral
- {Neutral change 1}

## Implementation Plan
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Timeline:** {Estimated time}
**Responsible:** {Who's implementing}

## Success Metrics
- {How we'll measure if this was the right decision}

## Review Date
{When we'll review if this decision still makes sense - e.g., 6 months}

## References
- [Link to related docs]
- [Link to research]
- [Link to discussion]

---

**Related ADRs:** {Links to related ADRs}
**Updates SSOT:** {Yes/No - if yes, which section}
```

#### 17. docs/ssot/README.md
```markdown
# Single Source of Truth Catalogs

## Purpose
Machine-readable contracts that enforce consistency across the codebase.

## Catalogs

### page.catalog.json
**What:** All application routes and their specifications
**Format:** JSON
**Usage:** Validate new routes match defined patterns

### component.catalog.json
**What:** All shared components and their props contracts
**Format:** JSON
**Usage:** Ensure consistent component usage

### events.catalog.json
**What:** All analytics events and their properties
**Format:** JSON
**Usage:** Enforce consistent event tracking

### data-models.yaml
**What:** Canonical data structures and schemas
**Format:** YAML
**Usage:** Database migrations, API contracts, type generation

## Validation

**When to validate:**
- Before creating new route
- Before creating new component
- Before adding analytics event
- Before schema changes

**How to validate:**
{Add validation script/process}

## Update Process

1. **Propose change** - Create PR with catalog update
2. **Review** - Ensure no conflicts with existing entries
3. **Approve** - Get stakeholder sign-off
4. **Merge** - Update catalog
5. **Migrate** - Update code to match catalog
6. **Verify** - Run validation to ensure compliance

---

**Last Updated:** {DATE}
```

### PHASE 4: INITIALIZE AGENT, SKILL, AND COMMAND DIRECTORIES

#### 18. .claude/agents/README.md
```markdown
# Agent Directory

## What Are Agents?
Specialized AI assistants with domain expertise, invoked via the Task tool.

## When to Create an Agent
- You need specialized knowledge repeatedly
- Quality gates need enforcement (e.g., security, design)
- Workflow requires coordination (e.g., UI/UX → Frontend)

## How to Create an Agent

1. **Copy template:** `_template.md` → `{domain}-{role}.md`
2. **Define domain:** What's the agent's specialty?
3. **List capabilities:** What can it do?
4. **Set standards:** What quality gates does it enforce?
5. **Document workflow:** How does it integrate with other agents?

## Agent Naming Convention
`{domain}-{role}.md`

**Examples:**
- `ui-ux-designer.md` (not "designer")
- `security-auditor.md` (not "security")
- `frontend-developer.md` (not "react-dev")

## Existing Agents

### Design & Frontend
- {List agents as you create them}

### Backend & Data
- {List agents}

### Security & Quality
- {List agents}

### DevOps & Infrastructure
- {List agents}

---

**Refer to:** `.claude/AGENT_MANAGEMENT_RULES.md` for coordination workflows
```

#### 19. .claude/skills/README.md
```markdown
# Skills Directory

## What Are Skills?
Progressive disclosure technical guides that load light (30-50 tokens) and expand when needed.

## When to Create a Skill
- You need technical reference repeatedly (API patterns, framework conventions)
- Documentation is available but verbose
- Pattern is reusable across features

## Skill Structure
```
{skill-name}/
├── SKILL.md                  # Main file (30-50 token summary + detailed guide)
├── references/               # Additional documentation (optional)
│   ├── advanced-patterns.md
│   └── troubleshooting.md
└── tools/                    # Scripts or utilities (optional)
    └── helper.sh
```

## How to Create a Skill

1. **Copy template:** `_template/SKILL.md` → `{skill-name}/SKILL.md`
2. **Write 30-50 token summary** at the top (key concepts, quick start)
3. **Add detailed guide** below (patterns, examples, best practices)
4. **Add references** if needed (supplementary docs in `references/`)
5. **Test progressive disclosure** - Load skill, verify summary is useful

## Skill Naming Convention
`{technology}-{specialty}` or `{domain}`

**Examples:**
- `solana-anchor/` (Solana + Anchor framework)
- `nextjs-web3/` (Next.js + Web3 integration)
- `git-workflow/` (Git branching and commits)

## Existing Skills

### Blockchain & Web3
- {List skills as you create them}

### Frontend
- {List skills}

### Backend
- {List skills}

### DevOps
- {List skills}

### Documentation & Tools
- {List skills}

---

**Token optimization target:** 88-92% reduction vs. loading full documentation
```

#### 20. .claude/commands/README.md
```markdown
# Commands Directory

## What Are Commands?
Slash commands for quick, focused workflows (< 10k token operations).

## When to Create a Command
- You have a repetitive workflow
- Operation is standardized (e.g., code review process)
- Output is focused and predictable

## How to Create a Command

1. **Copy template:** `_template.md` → `{command-name}.md`
2. **Define trigger:** What should invoke this? (`/command-name`)
3. **Write workflow:** Step-by-step process
4. **Set output format:** What's produced?
5. **Test:** Run command, verify output

## Command Naming Convention
`{action}-{target}.md`

**Examples:**
- `code-review.md` → `/code-review`
- `security-audit.md` → `/security-audit`
- `feature.md` → `/feature` (Git Flow)

## Existing Commands

### Git Flow
- {List commands as you create them}

### Quality & Review
- {List commands}

### Documentation
- {List commands}

### Deployment
- {List commands}

---

**Refer to:** `.claude/AGENT_MANAGEMENT_RULES.md` for when to use commands vs. agents
```

### PHASE 5: SET UP MCP SERVERS (Optional)

**Install essential MCP servers:**

```bash
# Filesystem (essential - 80-90% token savings)
npm install -g @modelcontextprotocol/server-filesystem

# Context7 (for latest SDK docs - 60-80% savings)
npm install -g @upwith/context7

# GitHub (if using GitHub - 60-90% savings)
npm install -g @modelcontextprotocol/server-github

# Add deployment-specific MCPs as needed
```

**Configure in `.claude/settings.json`** (already created above)

### PHASE 6: INITIALIZE GIT HOOKS (Optional)

**Create `.claude/hooks/conventional-commits.py`** if Git Flow enforcement needed.

---

## FIRST TASKS

Once the system is initialized, here's what happens next:

### 1. Create Core Agents (Start with 3-5)

**Minimum viable agent set:**
- **fullstack-developer** - General implementation
- **security-auditor** - Security reviews
- **code-reviewer** - Code quality

**Add domain-specific agents as needed:**
- UI/UX designer (if user-facing)
- Smart contract auditor (if blockchain)
- Performance engineer (if optimization critical)
- DevOps specialist (if deployment complex)

### 2. Create Essential Skills (Start with 3-5)

**Project-specific skills based on tech stack:**
- `{frontend-framework}` - E.g., `nextjs-web3`, `react-native`
- `{backend-framework}` - E.g., `solana-anchor`, `express-api`
- `{database}` - E.g., `supabase-postgres`, `mongodb`
- `git-workflow` - Branching, commits, PRs
- `integration-testing` - Test patterns

### 3. Document Initial Architecture

**Update `.agent/SYSTEM.md` with:**
- Complete tech stack
- High-level architecture diagram
- Data flow
- Key design decisions

**Create first ADR:**
- `docs/adr/ADR-001-{primary-tech-choice}.md`
- Document why you chose this stack

### 4. Set First Sprint Goals

**Update `SPRINT.md` with:**
- Sprint goal (what you're building this week/sprint)
- Top 3 priorities
- Initial backlog

### 5. Configure Development Environment

**Update `DEPLOYMENT_STATUS.md` with:**
- Local development setup
- Environment variables
- External service configuration

---

## READY TO BUILD

System is now initialized with:
- ✅ 3-layer architecture (.agent/ + .claude/ + docs/)
- ✅ Memory system (successful patterns, lessons learned)
- ✅ Agent creation framework
- ✅ Progressive disclosure skills
- ✅ Workflow commands
- ✅ SSOT documentation
- ✅ ADR system
- ✅ MCP integration (optional)
- ✅ Git hooks (optional)

**Next step:** Start implementing your first feature using the orchestration system!

---

**Template Variables Used:**
- `{PROJECT_NAME}` - Your project name
- `{PROJECT_ROOT}` - Absolute path to project directory
- `{TECH_STACK}` - Your technology choices
- `{SPRINT_NAME}` - Current sprint identifier
- `{START_DATE}` / `{END_DATE}` - Sprint dates
- `{DATE}` - Current date
- `{TIMESTAMP}` - Current timestamp

**Customization Notes:**
- Create agents as you need them (no limit)
- Create skills for your specific stack
- Add commands for your workflows
- Scale memory system based on project size
- Enable/disable data flywheel as needed
- Choose MCP servers based on deployment platform

---

# END OF BOOTSTRAP PROMPT

---

## 📚 Additional Resources

### Example Project Types

#### Solana DeFi Project
**Key Agents:**
- anchor-expert
- smart-contract-auditor
- rust-expert
- web3-integration-specialist
- security-auditor

**Key Skills:**
- solana-anchor
- rust-blockchain
- cross-program-invocations
- helius-rpc

#### Next.js SaaS
**Key Agents:**
- nextjs-architecture-expert
- ui-ux-designer
- frontend-developer
- backend-architect
- database-architect

**Key Skills:**
- nextjs-web3 (or nextjs-sass)
- supabase-postgres (or database of choice)
- stripe-payments-integration
- email-marketing-automation

#### Mobile App (React Native)
**Key Agents:**
- mobile-developer
- ui-ux-designer
- backend-architect
- performance-engineer

**Key Skills:**
- react-native-patterns
- mobile-testing
- app-store-deployment

### Scaling Guidance

**Solo Developer (Tier 1):**
- 3-5 agents (fullstack, security, code-review)
- 3-5 skills (framework, database, git)
- Basic memory system
- No data flywheel
- 1-2 MCP servers

**Small Team (Tier 2):**
- 10-15 agents (specialized domains)
- 10-15 skills (comprehensive stack)
- Full memory system
- SSOT framework
- 3-4 MCP servers
- Git hooks

**Production Team (Tier 3):**
- 20-30 agents (deep specialization)
- 20-30 skills (extensive library)
- Data flywheel enabled
- Full SSOT + ADR process
- 5+ MCP servers
- Complete automation

### Token Optimization Results

**From widgets-for-launch production system:**
- **Skills:** 88-92% reduction (30-50 tokens vs. 3000-5000)
- **MCP Filesystem:** 80-90% reduction
- **MCP Context7:** 60-80% reduction
- **MCP GitHub:** 60-90% reduction
- **MCP Vercel:** 70-95% reduction
- **Combined:** 91% reduction on common operations

### Maintenance Schedule

**Daily:**
- Update SPRINT.md with completed tasks
- Update DEPLOYMENT_STATUS.md after deploys

**Weekly:**
- Review and update memory files
- Run data flywheel (if enabled)
- Clean up stale tasks

**Monthly:**
- Review metrics dashboard
- Audit agent effectiveness
- Update skills based on patterns
- ADR review for major changes

**Quarterly:**
- Full system audit
- Archive old logs
- Update documentation
- Refine orchestration based on learnings

---

**Version:** 1.0 (based on widgets-for-launch production system)
**Last Updated:** 2025-11-06
**Maintained By:** Mirko Basil Dölger (ICM Motion)
