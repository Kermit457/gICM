# Quick Start Guide - ICM Motion Orchestration

**TL;DR:** Copy-paste the bootstrap prompt from `UNIVERSAL_BOOTSTRAP_TEMPLATE.md` into a new project to initialize the orchestration system.

---

## 🚀 5-Minute Setup

### 1. Copy Bootstrap Prompt
Open `UNIVERSAL_BOOTSTRAP_TEMPLATE.md` and copy everything from **"BOOTSTRAP PROMPT"** section.

### 2. Paste Into New Project
Start Claude Code in your new project directory and paste the bootstrap prompt.

### 3. Fill Variables
```markdown
PROJECT_NAME: "YourProjectName"
PROJECT_TYPE: "Solana DeFi AMM" | "Next.js SaaS" | "Mobile App"
TECH_STACK: "Rust/Anchor, Next.js 14, TypeScript, Supabase"
PRIMARY_GOAL: "Implement constant-product swap with 0.3% fees"
```

### 4. Claude Creates Everything
Claude will automatically create:
- ✅ 3-layer folder structure
- ✅ 20+ core files
- ✅ Templates for agents/skills/commands
- ✅ Memory system
- ✅ Documentation framework

---

## 📂 What Gets Created

### Layer 1: Project Knowledge (`.agent/`)
```
.agent/
├── README.md              # 🌟 Master navigation - START HERE every session
├── SOP.md                 # Standard operating procedures
├── SYSTEM.md              # Architecture snapshot
├── PLAN.md                # Active work plan
└── context/               # Memory system
    ├── successful-patterns.md
    ├── lessons-learned.md
    └── deployment-history.md
```

### Layer 2: Technical Orchestration (`.claude/`)
```
.claude/
├── agents/                # Create specialized agents on-demand
├── skills/                # Progressive disclosure guides (30-50 tokens)
├── commands/              # Slash commands for workflows
├── AGENT_MANAGEMENT_RULES.md  # Coordination protocol
└── settings.json          # MCP server configuration
```

### Layer 3: Documentation (`docs/`)
```
docs/
├── adr/                   # Architecture Decision Records
├── ssot/                  # Single Source of Truth catalogs
└── SSOT.md                # Frozen architectural decisions
```

### Root Level State Files
```
CLAUDE.md                  # Project-specific instructions
SPRINT.md                  # Current priorities
DEPLOYMENT_STATUS.md       # Live deployment info
```

---

## 🎯 Session Start Protocol

**Every session, follow this order:**

1. **Read `.agent/README.md`** - Master navigation
2. **Check `DEPLOYMENT_STATUS.md`** - What's live?
3. **Check `SPRINT.md`** - What's the priority?
4. **Review `.agent/context/successful-patterns.md`** - Reuse what works
5. **Review `.agent/context/lessons-learned.md`** - Avoid mistakes

---

## 🤖 Creating Agents

### When to Create an Agent
- Need specialized expertise repeatedly
- Quality gates need enforcement
- Coordination workflows emerge

### How to Create
1. Copy `.claude/agents/_template.md`
2. Rename to `{domain}-{role}.md` (e.g., `ui-ux-designer.md`)
3. Fill in:
   - Domain (expertise area)
   - Capabilities (what it does)
   - Input/Output format
   - Quality standards
4. Document workflow integration

### Minimum Viable Agents
Start with 3-5:
- **fullstack-developer** - General implementation
- **security-auditor** - Security reviews
- **code-reviewer** - Code quality
- **ui-ux-designer** - Design work (if user-facing)
- **{domain}-expert** - Your primary domain (e.g., `anchor-expert`)

### Example Agent Usage
```markdown
@ui-ux-designer: Design token launch card

**Objective:** Create card component for token listings
**Input:** Brand colors, required data fields
**Expected Output:** Complete design spec with exact spacing/colors
**Quality Gates:** WCAG 2.1 AA, mobile responsive
```

---

## 📚 Creating Skills

### When to Create a Skill
- Technical reference needed repeatedly
- Framework/library patterns to document
- Documentation exists but is verbose

### How to Create
1. Create folder: `.claude/skills/{skill-name}/`
2. Create `SKILL.md` with:
   - **Quick Reference** (30-50 tokens) - Use cases, key concepts, quick start
   - **Detailed Guide** - Full patterns, examples, best practices
3. Optional: Add `references/` subfolder for supplementary docs

### Minimum Viable Skills
Start with 3-5 based on your stack:
- `{frontend-framework}` - E.g., `nextjs-web3`
- `{backend-framework}` - E.g., `solana-anchor`
- `{database}` - E.g., `supabase-postgres`
- `git-workflow` - Branching and commits
- `integration-testing` - Test patterns

### Progressive Disclosure Pattern
```markdown
# {Skill Name}

## Quick Reference (30-50 tokens)
**Use when:** {scenarios}
**Key concepts:** {brief definitions}
**Quick start:** {minimal example}

---

## Detailed Guide
{Expands only when needed}
```

---

## ⚡ Creating Commands

### When to Create a Command
- Repetitive workflow exists
- Operation is standardized
- < 10k token output expected

### How to Create
1. Copy `.claude/commands/_template.md`
2. Rename to `{action}-{target}.md` (e.g., `security-audit.md`)
3. Define workflow steps
4. Set output format

### Common Commands
- `/feature` - Start Git Flow feature branch
- `/code-review` - Comprehensive code review
- `/security-audit` - Security scan
- `/architecture-review` - Architecture evaluation

---

## 🔄 Standard Workflow

### For Every Task
```
EXPLORE → PLAN → EXECUTE → VERIFY → DOCUMENT
```

### 1. EXPLORE (Mandatory)
- Read relevant files
- Search for similar patterns
- Check successful-patterns.md
- Review lessons-learned.md

### 2. PLAN (If Complex)
- Use TodoWrite for 3+ step tasks
- Define agent coordination if needed
- Set quality gates

### 3. EXECUTE
- Smallest diff that ships
- Test as you go
- Follow SSOT standards

### 4. VERIFY
- Tests pass
- No errors
- Quality gates met
- Documentation updated

### 5. DOCUMENT
- Update SPRINT.md
- Update memory files (if significant)
- Create ADR (if architectural)

---

## 🧠 Memory System Usage

### successful-patterns.md
**Update after:**
- Solving complex bugs elegantly
- Creating reusable components
- Discovering efficient workflows
- Implementing optimizations

**Format:**
```markdown
### Pattern: {Name}
**Context:** {When needed}
**Solution:** {Code/approach}
**Why it worked:** {Explanation}
**Reuse for:** {Similar scenarios}
**Date:** {YYYY-MM-DD}
```

### lessons-learned.md
**Update after:**
- Making mistakes
- Discovering anti-patterns
- Deployment failures
- Architecture rework

**Format:**
```markdown
### Mistake: {What went wrong}
**Context:** {Situation}
**What happened:** {Outcome}
**Why it failed:** {Root cause}
**Correct approach:** {How to do it right}
**Date:** {YYYY-MM-DD}
```

### deployment-history.md
**Update after:**
- Every production deploy
- Hotfixes
- Rollbacks
- Major config changes

---

## 📋 Agent Coordination Workflows

### UI/UX → Frontend (MANDATORY)
```
User request
    ↓
UI/UX Agent: Complete design spec
    ↓
User approval
    ↓
Frontend Developer: Implement from spec
    ↓
UI/UX Agent: Review compliance
    ↓
User acceptance
```

### Backend → Security → DevOps
```
Backend: Implement + tests
    ↓
Security: Audit + fixes
    ↓
DevOps: Deploy
```

### Multi-Agent TodoWrite
```markdown
- Design feature (UI/UX) - completed
- User approval - completed
- Implement (Frontend) - in_progress
- Security audit - pending
- Deploy - pending
```

---

## 🎓 Token Optimization

### Progressive Disclosure (Skills)
- Load skill → 30-50 tokens initially
- Expand when needed → full guide
- **Result:** 88-92% reduction

### MCP Integration (Optional)
Install servers for massive savings:
- **Filesystem:** 80-90% reduction
- **Context7:** 60-80% reduction (SDK docs)
- **GitHub:** 60-90% reduction (PRs, issues)
- **Vercel/Railway/etc.:** 70-95% reduction (deployments)

**Combined:** ~91% token reduction on common operations

### Context Cleanup
Use `.claude/CONTEXT_REFRESH_CHECKLIST.md` regularly to prune stale context.

---

## 🚨 Critical Rules

### Always Required
- ✅ Read `.agent/README.md` at session start
- ✅ Update `SPRINT.md` with completed tasks
- ✅ Use UI/UX agent for design decisions
- ✅ Security audit for sensitive code
- ✅ TodoWrite for 3+ step tasks

### Never Allowed
- ❌ Skip exploration before coding
- ❌ Frontend making design decisions
- ❌ Bypass quality gates
- ❌ Forget memory updates after major work
- ❌ Contradict SSOT without formal process

---

## 📊 Scaling Tiers

### Tier 1: Solo Developer
- 3-5 agents
- 3-5 skills
- Basic memory
- 1-2 MCP servers

### Tier 2: Small Team
- 10-15 agents
- 10-15 skills
- Full memory + SSOT
- 3-4 MCP servers
- Git hooks

### Tier 3: Production Team
- 20-30 agents
- 20-30 skills
- Data flywheel enabled
- 5+ MCP servers
- Full automation

---

## 🔧 Maintenance

### Daily
- Update SPRINT.md
- Update DEPLOYMENT_STATUS.md after deploys

### Weekly
- Update memory files
- Clean up completed todos
- Review metrics

### Monthly
- Audit agent effectiveness
- Update skills based on patterns
- ADR review

---

## 📞 Example Usage

### Starting a New Feature
```
1. Read .agent/README.md (session start)
2. Check SPRINT.md (is this prioritized?)
3. Use /feature my-feature-name
4. Create TodoWrite plan
5. Delegate to appropriate agents
6. Execute incrementally
7. Update SPRINT.md when complete
8. Update memory files if significant
```

### Creating First Agent
```
1. Copy .claude/agents/_template.md
2. Rename to ui-ux-designer.md
3. Fill in domain: "User interface and experience design"
4. List capabilities: Design specs, WCAG compliance, etc.
5. Define quality standards: Exact colors, spacing in 4px increments
6. Document workflow: Creates spec → Frontend implements → Reviews
7. Save and use: @ui-ux-designer: {task}
```

### Creating First Skill
```
1. Create .claude/skills/nextjs-web3/
2. Create SKILL.md
3. Add Quick Reference (30-50 tokens):
   - Use when: Building Next.js + Web3 apps
   - Key concepts: Wallet connection, transaction signing
   - Quick start: {minimal code example}
4. Add Detailed Guide below:
   - Patterns, examples, best practices
5. Save and reference when needed
```

---

## 📖 Full Documentation

For complete details, see:
- **`UNIVERSAL_BOOTSTRAP_TEMPLATE.md`** - Full bootstrap prompt + all templates
- **`.agent/README.md`** - Master navigation (after bootstrap)
- **`.agent/SOP.md`** - Standard operating procedures
- **`.claude/AGENT_MANAGEMENT_RULES.md`** - Agent coordination

---

## ✅ Checklist: First Session

After bootstrapping, complete these tasks:

- [ ] Create 3-5 core agents (fullstack, security, UI/UX, domain expert)
- [ ] Create 3-5 essential skills (frameworks, database, git)
- [ ] Update `.agent/SYSTEM.md` with architecture
- [ ] Create `docs/adr/ADR-001-{primary-tech}.md`
- [ ] Set first sprint goal in `SPRINT.md`
- [ ] Configure `DEPLOYMENT_STATUS.md` with env setup
- [ ] Install MCP servers (optional but recommended)
- [ ] Read all created files to understand structure

---

**You're ready to build.** The orchestration system will guide you through every task with optimal quality and token efficiency.

**Version:** 1.0
**Last Updated:** 2025-11-06
**Source:** ICM Motion (widgets-for-launch production system)
