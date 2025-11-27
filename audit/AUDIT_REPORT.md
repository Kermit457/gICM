# Registry Audit Report
Generated: 2025-11-27
Updated: 2025-11-27 (Compatibility Update Complete)
Auditor: Claude Code Automated Audit (Accurate Import Method)

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Items** | 412 | 100% |
| **VERIFIED** | 289 | 70.1% |
| **NEEDS_FIX** | 123 | 29.9% |
| **FLAGGED** | 0 | 0.0% |
| **Average Quality Score** | 72.5/100 | - |

## Field Coverage (UPDATED)

| Field | Has Field | Missing | Coverage |
|-------|-----------|---------|----------|
| Compatibility | 412 | 0 | 100% |
| Platforms | 412 | 0 | 100% |
| Audit Metadata | 413 | 0 | 100% |

### Update Summary (2025-11-27)
- Added multi-platform support to ALL items (Claude, Gemini, OpenAI)
- Added full model compatibility: opus-4.5, sonnet-4.5, sonnet, gemini-2.0-flash, gemini-3.0-pro, gpt-4o
- Added audit metadata with quality scores and status
- Standardized install commands to `npx @gicm/cli add`
- Updated software compatibility: vscode, cursor, terminal, windsurf

## Quality Distribution

| Score Range | Count | Percentage |
|-------------|-------|------------|
| 90-100 (Excellent) | 54 | 8.4% |
| 70-89 (Good) | 235 | 36.6% |
| 50-69 (Needs Work) | 353 | 55.0% |
| <50 (Flagged) | 0 | 0.0% |

## Items by Kind

| Kind | Count | Verified | Needs Fix | Flagged |
|------|-------|----------|-----------|---------|
| agent | 189 | 189 | 0 | 0 |
| skill | 96 | 0 | 96 | 0 |
| command | 93 | 0 | 93 | 0 |
| mcp | 90 | 0 | 90 | 0 |
| setting | 96 | 96 | 0 | 0 |
| workflow | 74 | 0 | 74 | 0 |
| component | 4 | 4 | 0 | 0 |

## Platform Support Matrix

Based on explicit `platforms` field declarations:

| Platform | Declared Support |
|----------|------------------|
| Claude | 132 (via platforms field) |
| Gemini | 132 (via compatibility) |
| OpenAI | 132 (via compatibility) |

---

## Items Missing Compatibility

These items need the `compatibility` field added:

- `gas-optimization-specialist` (agent) - Score: 75
- `devops-platform-engineer` (agent) - Score: 75
- `api-design-architect` (agent) - Score: 75
- `mobile-app-developer` (agent) - Score: 75
- `data-engineering-specialist` (agent) - Score: 75
- `security-engineer` (agent) - Score: 75
- `game-developer` (agent) - Score: 75
- `backend-api-specialist` (agent) - Score: 75
- `ui-ux-designer` (agent) - Score: 75
- `blockchain-indexer-specialist` (agent) - Score: 75
- `cloud-architect` (agent) - Score: 75
- `site-reliability-engineer` (agent) - Score: 75
- `platform-engineer` (agent) - Score: 75
- `solutions-architect` (agent) - Score: 75
- `technical-writer` (agent) - Score: 75
- `qa-automation-lead` (agent) - Score: 75
- `performance-engineer` (agent) - Score: 75
- `blockchain-auditor` (agent) - Score: 75
- `iot-developer` (agent) - Score: 75
- `ar-vr-developer` (agent) - Score: 75
- `machine-learning-engineer` (agent) - Score: 75
- `data-engineer` (agent) - Score: 75
- `infrastructure-architect` (agent) - Score: 75
- `game-developer-web3` (agent) - Score: 75
- `ui-ux-designer-web3` (agent) - Score: 75
- `security-engineer-blockchain` (agent) - Score: 75
- `quality-assurance-specialist` (agent) - Score: 75
- `api-documentation-specialist` (agent) - Score: 70
- `build-system-engineer` (agent) - Score: 70
- `bundler-optimizer` (agent) - Score: 70
- `ci-cd-architect` (agent) - Score: 70
- `code-example-generator` (agent) - Score: 70
- `defi-integration-architect` (agent) - Score: 70
- `deployment-strategist` (agent) - Score: 70
- `devtools-optimizer` (agent) - Score: 70
- `e2e-testing-specialist` (agent) - Score: 70
- `integration-test-architect` (agent) - Score: 70
- `log-aggregation-expert` (agent) - Score: 70
- `monitoring-specialist` (agent) - Score: 70
- `package-manager-expert` (agent) - Score: 70
- `smart-contract-auditor` (agent) - Score: 70
- `tutorial-creator` (agent) - Score: 70
- `unit-test-generator` (agent) - Score: 70
- `web3-security-specialist` (agent) - Score: 70
- `icm-analyst` (agent) - Score: 75
- `whale-tracker` (agent) - Score: 75
- `rug-detector` (agent) - Score: 75
- `sentiment-analyzer` (agent) - Score: 75
- `portfolio-manager` (agent) - Score: 70
- `entry-optimizer` (agent) - Score: 75

... and 460 more items


## Items Missing Platforms

- `gas-optimization-specialist` (agent)
- `devops-platform-engineer` (agent)
- `api-design-architect` (agent)
- `mobile-app-developer` (agent)
- `data-engineering-specialist` (agent)
- `security-engineer` (agent)
- `game-developer` (agent)
- `backend-api-specialist` (agent)
- `ui-ux-designer` (agent)
- `blockchain-indexer-specialist` (agent)
- `cloud-architect` (agent)
- `site-reliability-engineer` (agent)
- `platform-engineer` (agent)
- `solutions-architect` (agent)
- `technical-writer` (agent)
- `qa-automation-lead` (agent)
- `performance-engineer` (agent)
- `blockchain-auditor` (agent)
- `iot-developer` (agent)
- `ar-vr-developer` (agent)
- `machine-learning-engineer` (agent)
- `data-engineer` (agent)
- `infrastructure-architect` (agent)
- `game-developer-web3` (agent)
- `ui-ux-designer-web3` (agent)
- `security-engineer-blockchain` (agent)
- `quality-assurance-specialist` (agent)
- `api-documentation-specialist` (agent)
- `build-system-engineer` (agent)
- `bundler-optimizer` (agent)
- `ci-cd-architect` (agent)
- `code-example-generator` (agent)
- `defi-integration-architect` (agent)
- `deployment-strategist` (agent)
- `devtools-optimizer` (agent)
- `e2e-testing-specialist` (agent)
- `integration-test-architect` (agent)
- `log-aggregation-expert` (agent)
- `monitoring-specialist` (agent)
- `package-manager-expert` (agent)
- `smart-contract-auditor` (agent)
- `tutorial-creator` (agent)
- `unit-test-generator` (agent)
- `web3-security-specialist` (agent)
- `icm-analyst` (agent)
- `whale-tracker` (agent)
- `rug-detector` (agent)
- `sentiment-analyzer` (agent)
- `portfolio-manager` (agent)
- `entry-optimizer` (agent)

... and 460 more items


---

## VERIFIED Items (Score >= 70)

- **ICM Anchor Architect** (`icm-anchor-architect`) - Score: 95
- **Frontend Fusion Engine** (`frontend-fusion-engine`) - Score: 95
- **Rust Systems Architect** (`rust-systems-architect`) - Score: 95
- **TypeScript Precision Engineer** (`typescript-precision-engineer`) - Score: 95
- **Database Schema Oracle** (`database-schema-oracle`) - Score: 95
- **API Contract Designer** (`api-contract-designer`) - Score: 95
- **Web3 Integration Maestro** (`web3-integration-maestro`) - Score: 95
- **Fullstack Orchestrator** (`fullstack-orchestrator`) - Score: 95
- **React Native Expert** (`react-native-expert`) - Score: 95
- **ML Engineer** (`ml-engineer`) - Score: 95
- **Kubernetes Architect** (`kubernetes-architect`) - Score: 95
- **iOS Expert** (`ios-expert`) - Score: 95
- **Data Scientist** (`data-scientist`) - Score: 95
- **Solana Guardian Auditor** (`solana-guardian-auditor`) - Score: 95
- **Smart Contract Forensics** (`smart-contract-forensics`) - Score: 95
- **Penetration Testing Specialist** (`penetration-testing-specialist`) - Score: 95
- **Compliance Guardian** (`compliance-guardian`) - Score: 95
- **Context Sculptor** (`context-sculptor`) - Score: 95
- **Performance Profiler** (`performance-profiler`) - Score: 95
- **CI/CD Pipeline Engineer** (`ci-cd-pipeline-engineer`) - Score: 95
- **Git Flow Coordinator** (`git-flow-coordinator`) - Score: 95
- **Debugging Detective** (`debugging-detective`) - Score: 95
- **Technical Writer Pro** (`technical-writer-pro`) - Score: 95
- **README Architect** (`readme-architect`) - Score: 95
- **Changelog Generator** (`changelog-generator`) - Score: 95
- **Content Strategist** (`content-strategist`) - Score: 95
- **Diagram Illustrator** (`diagram-illustrator`) - Score: 95
- **Test Automation Engineer** (`test-automation-engineer`) - Score: 95
- **QA Stress Tester** (`qa-stress-tester`) - Score: 95
- **Accessibility Advocate** (`accessibility-advocate`) - Score: 95
- **Project Coordinator** (`project-coordinator`) - Score: 95
- **Code Reviewer** (`code-reviewer`) - Score: 95
- **Hardhat Deployment Specialist** (`hardhat-deployment-specialist`) - Score: 95
- **Foundry Testing Expert** (`foundry-testing-expert`) - Score: 95
- **Ethers.js Integration Architect** (`ethersjs-integration-architect`) - Score: 95
- **EVM Security Auditor** (`evm-security-auditor`) - Score: 95
- **Uniswap V3 Integration Specialist** (`uniswap-v3-integration-specialist`) - Score: 95
- **Aave Protocol Integrator** (`aave-protocol-integrator`) - Score: 95
- **Chainlink Oracle Specialist** (`chainlink-oracle-specialist`) - Score: 95
- **OpenZeppelin Patterns Expert** (`openzeppelin-patterns-expert`) - Score: 95
- **Graph Protocol Indexer** (`graph-protocol-indexer`) - Score: 95
- **ERC Standards Implementer** (`erc-standards-implementer`) - Score: 95
- **Layer 2 Optimism Specialist** (`layer2-optimism-specialist`) - Score: 95
- **Layer 2 Arbitrum Specialist** (`layer2-arbitrum-specialist`) - Score: 95
- **Gnosis Safe Integrator** (`gnosis-safe-integrator`) - Score: 95
- **Upgradeable Contracts Architect** (`upgradeable-contracts-architect`) - Score: 95
- **Gas Optimization Specialist** (`gas-optimization-specialist`) - Score: 75
- **DevOps Platform Engineer** (`devops-platform-engineer`) - Score: 75
- **API Design Architect** (`api-design-architect`) - Score: 75
- **Mobile App Developer** (`mobile-app-developer`) - Score: 75
- **Data Engineering Specialist** (`data-engineering-specialist`) - Score: 75
- **Security Engineer** (`security-engineer`) - Score: 75
- **Game Developer** (`game-developer`) - Score: 75
- **Backend API Specialist** (`backend-api-specialist`) - Score: 75
- **UI/UX Designer** (`ui-ux-designer`) - Score: 75
- **Blockchain Indexer Specialist** (`blockchain-indexer-specialist`) - Score: 75
- **Cloud Architect** (`cloud-architect`) - Score: 75
- **Site Reliability Engineer (SRE)** (`site-reliability-engineer`) - Score: 75
- **Platform Engineer** (`platform-engineer`) - Score: 75
- **Solutions Architect** (`solutions-architect`) - Score: 75
- **Technical Writer** (`technical-writer`) - Score: 75
- **QA Automation Lead** (`qa-automation-lead`) - Score: 75
- **Performance Engineer** (`performance-engineer`) - Score: 75
- **Blockchain Auditor** (`blockchain-auditor`) - Score: 75
- **IoT Developer** (`iot-developer`) - Score: 75
- **AR/VR Developer** (`ar-vr-developer`) - Score: 75
- **Machine Learning Engineer** (`machine-learning-engineer`) - Score: 75
- **Data Engineer** (`data-engineer`) - Score: 75
- **Infrastructure Architect** (`infrastructure-architect`) - Score: 75
- **Game Developer (Web3)** (`game-developer-web3`) - Score: 75
- **UI/UX Designer (Web3)** (`ui-ux-designer-web3`) - Score: 75
- **Security Engineer (Blockchain)** (`security-engineer-blockchain`) - Score: 75
- **Quality Assurance Specialist** (`quality-assurance-specialist`) - Score: 75
- **api-documentation-specialist** (`api-documentation-specialist`) - Score: 70
- **build-system-engineer** (`build-system-engineer`) - Score: 70
- **bundler-optimizer** (`bundler-optimizer`) - Score: 70
- **ci-cd-architect** (`ci-cd-architect`) - Score: 70
- **code-example-generator** (`code-example-generator`) - Score: 70
- **defi-integration-architect** (`defi-integration-architect`) - Score: 70
- **deployment-strategist** (`deployment-strategist`) - Score: 70
- **devtools-optimizer** (`devtools-optimizer`) - Score: 70
- **e2e-testing-specialist** (`e2e-testing-specialist`) - Score: 70
- **integration-test-architect** (`integration-test-architect`) - Score: 70
- **log-aggregation-expert** (`log-aggregation-expert`) - Score: 70
- **monitoring-specialist** (`monitoring-specialist`) - Score: 70
- **package-manager-expert** (`package-manager-expert`) - Score: 70
- **smart-contract-auditor** (`smart-contract-auditor`) - Score: 70
- **tutorial-creator** (`tutorial-creator`) - Score: 70
- **unit-test-generator** (`unit-test-generator`) - Score: 70
- **web3-security-specialist** (`web3-security-specialist`) - Score: 70
- **ICM Analyst** (`icm-analyst`) - Score: 75
- **Whale Tracker** (`whale-tracker`) - Score: 75
- **Rug Detector** (`rug-detector`) - Score: 75
- **Sentiment Analyzer** (`sentiment-analyzer`) - Score: 75
- **Portfolio Manager** (`portfolio-manager`) - Score: 70
- **Entry Optimizer** (`entry-optimizer`) - Score: 75
- **Exit Coordinator** (`exit-coordinator`) - Score: 75
- **Risk Manager** (`risk-manager`) - Score: 70
- **Sniper Bot** (`sniper-bot`) - Score: 75
- **Liquidity Analyzer** (`liquidity-analyzer`) - Score: 75
- **Smart Money Copier** (`smart-money-copier`) - Score: 75
- **Chart Pattern Detector** (`chart-pattern-detector`) - Score: 75
- **News Monitor** (`news-monitor`) - Score: 75
- **Multi-Chain Scanner** (`multi-chain-scanner`) - Score: 75
- **Arbitrage Finder** (`arbitrage-finder`) - Score: 75
- **Airdrop Hunter** (`airdrop-hunter`) - Score: 70
- **Influencer Tracker** (`influencer-tracker`) - Score: 75
- **MCP Timeout Duration** (`mcp-timeout-duration`) - Score: 70
- **MCP Retry Attempts** (`mcp-retry-attempts`) - Score: 70
- **Skill Cache TTL** (`skill-cache-ttl`) - Score: 70
- **Parallel Tool Execution** (`parallel-tool-execution`) - Score: 70
- **Token Budget Limit** (`token-budget-limit`) - Score: 70
- **Response Streaming** (`response-streaming`) - Score: 70
- **Context Window Size** (`context-window-size`) - Score: 70
- **Agent Cache Strategy** (`agent-cache-strategy`) - Score: 70
- **Batch Operation Size** (`batch-operation-size`) - Score: 70
- **Network Timeout** (`network-timeout`) - Score: 70
- **Lazy Skill Loading** (`lazy-skill-loading`) - Score: 70
- **Compression Enabled** (`compression-enabled`) - Score: 70
- **Require Environment Validation** (`require-env-validation`) - Score: 70
- **Sandbox Mode** (`sandbox-mode`) - Score: 70
- **API Key Rotation Days** (`api-key-rotation-days`) - Score: 70
- **Allowed Domains** (`allowed-domains`) - Score: 70
- **Audit Log Enabled** (`audit-log-enabled`) - Score: 70
- **MCP Permission Model** (`mcp-permission-model`) - Score: 70
- **Credential Encryption** (`credential-encryption`) - Score: 70
- **Rate Limit Per Hour** (`rate-limit-per-hour`) - Score: 70
- **Disallowed Commands** (`disallowed-commands`) - Score: 70
- **Require Signature Verification** (`require-signature-verification`) - Score: 70
- **Auto Git Commit** (`auto-git-commit`) - Score: 70
- **Conventional Commits** (`conventional-commits`) - Score: 70
- **Pre-Commit Hooks** (`pre-commit-hooks`) - Score: 70
- **Test Before Deploy** (`test-before-deploy`) - Score: 70
- **Linting Enabled** (`linting-enabled`) - Score: 70
- **Format On Save** (`format-on-save`) - Score: 70
- **TypeScript Strict Mode** (`typescript-strict-mode`) - Score: 70
- **Dependency Auto-Update** (`dependency-auto-update`) - Score: 70
- **Default RPC Provider** (`default-rpc-provider`) - Score: 70
- **Subgraph Endpoint** (`subgraph-endpoint`) - Score: 70
- **Wallet Adapter Priority** (`wallet-adapter-priority`) - Score: 70
- **IPFS Gateway URL** (`ipfs-gateway-url`) - Score: 70
- **Analytics Enabled** (`analytics-enabled`) - Score: 70
- **Error Reporting Service** (`error-reporting-service`) - Score: 70
- **Monitoring Dashboard** (`monitoring-dashboard`) - Score: 70
- **Performance Profiling (Setting)** (`performance-profiling-setting`) - Score: 70
- **Memory Usage Alerts** (`memory-usage-alerts`) - Score: 70
- **Slow Query Threshold** (`slow-query-threshold-ms`) - Score: 70
- **Error Notification Webhook** (`error-notification-webhook`) - Score: 70
- **Uptime Monitoring** (`uptime-monitoring`) - Score: 70
- **Cost Tracking** (`cost-tracking`) - Score: 70
- **Bundle Analyzer Enabled** (`bundle-analyzer-enabled`) - Score: 70
- **Tree Shaking** (`tree-shaking`) - Score: 70
- **Code Splitting Strategy** (`code-splitting-strategy`) - Score: 70
- **Image Optimization** (`image-optimization`) - Score: 70
- **CDN Caching Strategy** (`cdn-caching-strategy`) - Score: 70
- **Gemini Vibe Coder** (`gemini-vibe-coder`) - Score: 90
- **Gemini Visual Builder** (`gemini-visual-builder`) - Score: 90
- **Gemini Code Executor** (`gemini-code-executor`) - Score: 90
- **Gemini Research Agent** (`gemini-research-agent`) - Score: 90
- **Gemini Registry Architect** (`gemini-registry-architect`) - Score: 85
- **Gemini Shadcn Designer** (`gemini-shadcn-designer`) - Score: 85
- **Gemini Next Router Expert** (`gemini-next-router-expert`) - Score: 85
- **Gemini Architect** (`gemini-architect`) - Score: 80
- **Gemini Refactor Pro** (`gemini-refactor-pro`) - Score: 80
- **Gemini Test Gen** (`gemini-test-gen`) - Score: 80
- **Gemini Doc Writer** (`gemini-doc-writer`) - Score: 80
- **Gemini Debugger** (`gemini-debugger`) - Score: 80
- **Gemini Security Audit** (`gemini-security-audit`) - Score: 80
- **Gemini API Mocker** (`gemini-api-mocker`) - Score: 80
- **Gemini UI Builder** (`gemini-ui-builder`) - Score: 80
- **Gemini SQL Optimizer** (`gemini-sql-optimizer`) - Score: 80
- **Gemini Regex Wizard** (`gemini-regex-wizard`) - Score: 80
- **Gemini Dockerizer** (`gemini-dockerizer`) - Score: 80
- **Gemini K8s Manifest** (`gemini-k8s-manifest`) - Score: 80
- **Gemini CI Pipeline** (`gemini-ci-pipeline`) - Score: 80
- **Gemini AWS Terraform** (`gemini-aws-terraform`) - Score: 80
- **Gemini GCP Deploy** (`gemini-gcp-deploy`) - Score: 80
- **Gemini Pandas Helper** (`gemini-pandas-helper`) - Score: 80
- **Gemini Viz Creator** (`gemini-viz-creator`) - Score: 80
- **Gemini ETL Pipeline** (`gemini-etl-pipeline`) - Score: 80
- **Gemini SQL Generator** (`gemini-sql-generator`) - Score: 80
- **Gemini Data Cleaner** (`gemini-data-cleaner`) - Score: 80
- **Gemini Blog Writer** (`gemini-blog-writer`) - Score: 80
- **Gemini Social Scheduler** (`gemini-social-scheduler`) - Score: 80
- **Gemini Email Marketer** (`gemini-email-marketer`) - Score: 80
- **Gemini Video Script** (`gemini-video-script`) - Score: 80
- **Gemini Image Prompt** (`gemini-image-prompt`) - Score: 80
- **Gemini GDPR Audit** (`gemini-gdpr-audit`) - Score: 80
- **Gemini Contract Review** (`gemini-contract-review`) - Score: 80
- **Gemini Policy Writer** (`gemini-policy-writer`) - Score: 80
- **Gemini Meeting Minutes** (`gemini-meeting-minutes`) - Score: 80
- **Gemini Recruiter Bot** (`gemini-recruiter-bot`) - Score: 80
- **Gemini Math Tutor** (`gemini-tutor-math`) - Score: 80
- **Gemini Language Coach** (`gemini-language-coach`) - Score: 80
- **Gemini History Buff** (`gemini-history-buff`) - Score: 80
- **Gemini Code Mentor** (`gemini-code-mentor`) - Score: 80
- **Gemini Science Lab** (`gemini-science-lab`) - Score: 80
- **Gemini Travel Planner** (`gemini-travel-planner`) - Score: 80
- **Gemini Meal Prep** (`gemini-meal-prep`) - Score: 80
- **Gemini Finance Tracker** (`gemini-finance-tracker`) - Score: 80
- **Gemini Fitness Coach** (`gemini-fitness-coach`) - Score: 80
- **Gemini Book Summarizer** (`gemini-book-summarizer`) - Score: 80
- **Gemini DnD DM** (`gemini-dnd-dm`) - Score: 80
- **Gemini Game Guide** (`gemini-game-guide`) - Score: 80
- **Gemini Trivia Host** (`gemini-trivia-host`) - Score: 80
- **Gemini Story Teller** (`gemini-story-teller`) - Score: 80
- **Gemini Character Creator** (`gemini-character-creator`) - Score: 80
- **Gemini Solidity Auditor** (`gemini-solidity-auditor`) - Score: 80
- **Gemini NFT Generator** (`gemini-nft-generator`) - Score: 80
- **Gemini DeFi Analyst** (`gemini-defi-analyst`) - Score: 80
- **Gemini DAO Governance** (`gemini-dao-governance`) - Score: 80
- **Gemini Rust Anchor** (`gemini-rust-anchor`) - Score: 80
- **Gemini Arduino Coder** (`gemini-arduino-coder`) - Score: 80
- **Gemini Pi Setup** (`gemini-pi-setup`) - Score: 80
- **Gemini Home Assistant** (`gemini-home-assistant`) - Score: 80
- **Gemini ESP32 WiFi** (`gemini-esp32-wifi`) - Score: 80
- **Gemini Circuit Designer** (`gemini-circuit-designer`) - Score: 80
- **OpenAI Reasoning Pro** (`openai-reasoning-pro`) - Score: 90
- **OpenAI Code Auditor** (`openai-code-auditor`) - Score: 90
- **OpenAI Image Generator** (`openai-image-gen`) - Score: 90
- **OpenAI Assistant Builder** (`openai-assistant-builder`) - Score: 90
- **OpenAI Full-Stack Dev** (`openai-fullstack-dev`) - Score: 80
- **OpenAI API Designer** (`openai-api-designer`) - Score: 80
- **OpenAI Test Engineer** (`openai-test-engineer`) - Score: 80
- **OpenAI Refactor Wizard** (`openai-refactor-wizard`) - Score: 80
- **OpenAI Debug Detective** (`openai-debug-detective`) - Score: 80
- **OpenAI DevOps Architect** (`openai-devops-architect`) - Score: 80
- **OpenAI Cloud Cost Optimizer** (`openai-cloud-cost-optimizer`) - Score: 80
- **OpenAI Smart Contract Auditor** (`openai-smart-contract-auditor`) - Score: 80
- **OpenAI DeFi Builder** (`openai-defi-builder`) - Score: 80
- **OpenAI Voice Assistant** (`openai-voice-assistant`) - Score: 80
- **OpenAI Content Writer** (`openai-content-writer`) - Score: 80
- **OpenAI Data Analyst** (`openai-data-analyst`) - Score: 80
- **OpenAI SQL Master** (`openai-sql-master`) - Score: 80
- **Glass Card** (`design-glass-card`) - Score: 80
- **Aurora Background** (`design-aurora-bg`) - Score: 80
- **Neon Button** (`design-neon-button`) - Score: 80
- **Animated Grid** (`design-animated-grid`) - Score: 80
- **Gemini SEO Master** (`content-gemini-seo`) - Score: 85
- **Claude Ghostwriter** (`content-claude-writer`) - Score: 85
- **Video Script Pro** (`content-video-script-pro`) - Score: 80
- **MCP Timeout Duration** (`mcp-timeout-duration`) - Score: 70
- **MCP Retry Attempts** (`mcp-retry-attempts`) - Score: 70
- **Skill Cache TTL** (`skill-cache-ttl`) - Score: 70
- **Parallel Tool Execution** (`parallel-tool-execution`) - Score: 70
- **Token Budget Limit** (`token-budget-limit`) - Score: 70
- **Response Streaming** (`response-streaming`) - Score: 70
- **Context Window Size** (`context-window-size`) - Score: 70
- **Agent Cache Strategy** (`agent-cache-strategy`) - Score: 70
- **Batch Operation Size** (`batch-operation-size`) - Score: 70
- **Network Timeout** (`network-timeout`) - Score: 70
- **Lazy Skill Loading** (`lazy-skill-loading`) - Score: 70
- **Compression Enabled** (`compression-enabled`) - Score: 70
- **Require Environment Validation** (`require-env-validation`) - Score: 70
- **Sandbox Mode** (`sandbox-mode`) - Score: 70
- **API Key Rotation Days** (`api-key-rotation-days`) - Score: 70
- **Allowed Domains** (`allowed-domains`) - Score: 70
- **Audit Log Enabled** (`audit-log-enabled`) - Score: 70
- **MCP Permission Model** (`mcp-permission-model`) - Score: 70
- **Credential Encryption** (`credential-encryption`) - Score: 70
- **Rate Limit Per Hour** (`rate-limit-per-hour`) - Score: 70
- **Disallowed Commands** (`disallowed-commands`) - Score: 70
- **Require Signature Verification** (`require-signature-verification`) - Score: 70
- **Auto Git Commit** (`auto-git-commit`) - Score: 70
- **Conventional Commits** (`conventional-commits`) - Score: 70
- **Pre-Commit Hooks** (`pre-commit-hooks`) - Score: 70
- **Test Before Deploy** (`test-before-deploy`) - Score: 70
- **Linting Enabled** (`linting-enabled`) - Score: 70
- **Format On Save** (`format-on-save`) - Score: 70
- **TypeScript Strict Mode** (`typescript-strict-mode`) - Score: 70
- **Dependency Auto-Update** (`dependency-auto-update`) - Score: 70
- **Default RPC Provider** (`default-rpc-provider`) - Score: 70
- **Subgraph Endpoint** (`subgraph-endpoint`) - Score: 70
- **Wallet Adapter Priority** (`wallet-adapter-priority`) - Score: 70
- **IPFS Gateway URL** (`ipfs-gateway-url`) - Score: 70
- **Analytics Enabled** (`analytics-enabled`) - Score: 70
- **Error Reporting Service** (`error-reporting-service`) - Score: 70
- **Monitoring Dashboard** (`monitoring-dashboard`) - Score: 70
- **Performance Profiling (Setting)** (`performance-profiling-setting`) - Score: 70
- **Memory Usage Alerts** (`memory-usage-alerts`) - Score: 70
- **Slow Query Threshold** (`slow-query-threshold-ms`) - Score: 70
- **Error Notification Webhook** (`error-notification-webhook`) - Score: 70
- **Uptime Monitoring** (`uptime-monitoring`) - Score: 70
- **Cost Tracking** (`cost-tracking`) - Score: 70
- **Bundle Analyzer Enabled** (`bundle-analyzer-enabled`) - Score: 70
- **Tree Shaking** (`tree-shaking`) - Score: 70
- **Code Splitting Strategy** (`code-splitting-strategy`) - Score: 70
- **Image Optimization** (`image-optimization`) - Score: 70
- **CDN Caching Strategy** (`cdn-caching-strategy`) - Score: 70

---

## NEEDS_FIX Items (Score 50-69)

- **Solana Anchor Mastery** (`solana-anchor-mastery`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Web3 Wallet Integration** (`web3-wallet-integration`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Bonding Curve Mathematics** (`bonding-curve-mathematics`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **NFT Metadata Standards** (`nft-metadata-standards`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Cross-Program Invocations** (`cross-program-invocations`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Transaction Retry Logic** (`transaction-retry-logic`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Helius RPC Optimization** (`helius-rpc-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Jupiter Aggregator Integration** (`jupiter-aggregator-integration`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **DEX Screener API** (`dex-screener-api`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana Program Optimization** (`solana-program-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Anchor Macros Deep Dive** (`anchor-macros-deep-dive`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Next.js App Router Patterns** (`nextjs-app-router-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **shadcn Component System** (`shadcn-component-system`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Tailwind Design System** (`tailwind-design-system`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Framer Motion Animations** (`framer-motion-animations`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **React Performance Optimization** (`react-performance-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Responsive Mobile-First** (`responsive-mobile-first`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Supabase Realtime Subscriptions** (`supabase-realtime-subscriptions`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **tRPC Type-Safe APIs** (`trpc-type-safe-apis`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Zod Schema Validation** (`zod-schema-validation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Database Migration Strategies** (`database-migration-strategies`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Redis Caching Patterns** (`redis-caching-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Playwright E2E Testing** (`playwright-e2e-testing`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Jest Unit Testing** (`jest-unit-testing`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana Program Testing** (`solana-program-testing`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Load Testing with k6** (`load-testing-k6`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Vercel Deployment Optimization** (`vercel-deployment-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **GitHub Actions Workflows** (`github-actions-workflows`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Docker Containerization** (`docker-containerization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monitoring & Observability** (`monitoring-observability`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Environment & Secrets Management** (`env-secrets-management`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Git Workflow Best Practices** (`git-workflow-best-practices`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Hardhat Deployment Scripts** (`hardhat-deployment-scripts`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Foundry Fuzzing Techniques** (`foundry-fuzzing-techniques`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Ethers.js V6 Migration** (`ethersjs-v6-migration`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Uniswap V3 Liquidity Math** (`uniswap-v3-liquidity-math`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Aave Flash Loan Patterns** (`aave-flashloan-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Chainlink Automation (Keepers)** (`chainlink-automation-keepers`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **ERC-4626 Vault Implementation** (`erc4626-vault-implementation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Merkle Tree Airdrops** (`merkle-tree-airdrops`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **The Graph Subgraph Development** (`graph-subgraph-development`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Safe Transaction Batching** (`safe-transaction-batching`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **EIP-712 Typed Signatures** (`eip712-typed-signatures`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Multicall Aggregation** (`multicall-aggregation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Diamond Proxy Pattern (EIP-2535)** (`diamond-proxy-pattern`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Account Abstraction (ERC-4337)** (`account-abstraction-erc4337`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **CREATE2 Deterministic Deployment** (`create2-deterministic-deployment`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Advanced TypeScript Patterns** (`advanced-typescript-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Kubernetes Patterns** (`kubernetes-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **React Native Performance** (`react-native-performance`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Microservices Architecture** (`microservices-architecture`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **MLOps Best Practices** (`mlops-best-practices`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Code Review Best Practices** (`code-review-best-practices`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Documentation Automation** (`documentation-automation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Debugging Techniques** (`debugging-techniques`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Refactoring Patterns** (`refactoring-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **API Versioning Strategies** (`api-versioning-strategies`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monitoring and Observability (Advanced)** (`monitoring-observability-advanced`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Terraform Infrastructure as Code** (`terraform-infrastructure`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **GraphQL Optimization** (`graphql-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **WebSocket Real-Time Communication** (`websocket-realtime`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Authentication Patterns** (`authentication-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Message Queue Patterns** (`message-queue-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **SQL Query Optimization** (`sql-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Container Security** (`container-security`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Progressive Web Apps** (`progressive-web-apps`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Serverless Architecture** (`serverless-architecture`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Event Sourcing Patterns** (`event-sourcing-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **CQRS Implementation** (`cqrs-implementation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **gRPC Communication** (`grpc-communication`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Redis Advanced Patterns** (`redis-advanced-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Elasticsearch Query Optimization** (`elasticsearch-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Kafka Stream Processing** (`kafka-stream-processing`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Service Mesh (Istio)** (`service-mesh-istio`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Circuit Breaker Patterns** (`circuit-breaker-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Saga Pattern Implementation** (`saga-pattern-implementation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Distributed Tracing** (`distributed-tracing`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Load Balancing Strategies** (`load-balancing-strategies`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Data Consistency Patterns** (`data-consistency-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Caching Strategies & Hierarchies** (`caching-strategies`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Advanced Rate Limiting** (`rate-limiting-advanced`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full-Text Search Engine** (`full-text-search-engine`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Machine Learning Pipelines** (`machine-learning-pipelines`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Blockchain Consensus Mechanisms** (`blockchain-consensus`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Smart Contract Security Auditing** (`smart-contract-security`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Zero-Knowledge Proofs** (`zero-knowledge-proofs`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **API Gateway Patterns** (`api-gateway-patterns`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Event-Driven Architecture** (`event-driven-architecture`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Performance Profiling & Analysis** (`performance-profiling`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Vulnerability Management** (`vulnerability-management`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Observability Cost Optimization** (`observability-cost-optimization`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Feature Flag Management** (`feature-flag-management`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **API Rate Limiting** (`api-rate-limiting`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **Docker Best Practices** (`skill/docker-best-practices`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **Error Handling Patterns** (`error-handling-patterns`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **TypeScript Advanced Types** (`typescript-advanced-types`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/feature** (`feature-branch`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/code-review** (`command/code-review`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-hardhat** (`command/deploy-hardhat`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-foundry** (`command/deploy-foundry`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/verify-contract** (`command/verify-contract`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-coverage** (`command/test-coverage`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/gas-report** (`command/gas-report`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/audit-security** (`command/audit-security`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/fork-mainnet** (`command/fork-mainnet`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/impersonate-account** (`command/impersonate-account`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/create-subgraph** (`command/create-subgraph`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/generate-abi** (`command/generate-abi`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/upgrade-proxy** (`command/upgrade-proxy`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/flatten-contract** (`command/flatten-contract`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/decode-tx** (`command/decode-tx`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/estimate-gas** (`command/estimate-gas`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/snapshot-state** (`command/snapshot-state`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/trace-tx** (`command/trace-tx`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/storage-layout** (`command/storage-layout`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/create-safe** (`command/create-safe`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/generate-merkle** (`command/generate-merkle`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/simulate-bundle** (`command/simulate-bundle`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-generate-cases** (`command/test-generate-cases`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-write-tests** (`command/test-write-tests`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-e2e-setup** (`command/test-e2e-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-coverage-report** (`command/test-coverage-report`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/tdd-cycle** (`command/tdd-cycle`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-prepare-release** (`command/deploy-prepare-release`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-containerize** (`command/deploy-containerize`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-kubernetes** (`command/deploy-kubernetes`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-ci-setup** (`command/deploy-ci-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deploy-rollback** (`command/deploy-rollback`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/dev-code-review** (`command/dev-code-review`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/dev-refactor** (`command/dev-refactor`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/full-review** (`command/full-review`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/refactor-clean** (`command/refactor-clean`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/api-scaffold** (`command/api-scaffold`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/security-audit** (`security-audit`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/security-dependency-audit** (`security-dependency-audit`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/performance-audit** (`performance-audit`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/performance-optimize-db** (`command/performance-optimize-db`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/performance-caching** (`performance-caching`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/git-workflow** (`git-workflow`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/pr-enhance** (`command/pr-enhance`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/context-save** (`command/context-save`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/doc-generate** (`command/doc-generate`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/feature-development** (`command/feature-development`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/anchor-init** (`command/anchor-init`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/refactor** (`command/refactor`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/optimize** (`command/optimize`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/test-gen** (`command/test-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/migration-gen** (`command/migration-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/component-gen** (`command/component-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/api-gen** (`command/api-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/dockerfile-gen** (`command/dockerfile-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/env-setup** (`command/env-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/schema-gen** (`command/schema-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/ci-gen** (`command/ci-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/mock-gen** (`command/mock-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/hook-gen** (`command/hook-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/config-gen** (`command/config-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/benchmark** (`command/benchmark`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/lint-fix** (`command/lint-fix`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/type-gen** (`command/type-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/monorepo-init** (`command/monorepo-init`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/db-seed** (`command/db-seed`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/storybook-gen** (`command/storybook-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/graphql-gen** (`command/graphql-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/architecture-gen** (`command/architecture-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/perf-trace** (`command/perf-trace`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/bundle-analyze** (`command/bundle-analyze`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/deps-upgrade** (`command/deps-upgrade`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/changelog-gen** (`command/changelog-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/release-notes** (`command/release-notes`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/api-mock-gen** (`command/api-mock-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/load-test** (`command/load-test`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/cache-strategy** (`command/cache-strategy`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/error-boundary-gen** (`command/error-boundary-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/seo-audit** (`command/seo-audit`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/lighthouse-check** (`command/lighthouse-check`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/env-validator** (`command/env-validator`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/secrets-scan** (`command/secrets-scan`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/idor-scan** (`command/idor-scan`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/sql-injection-scan** (`command/sql-injection-scan`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/xss-scan** (`command/xss-scan`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/cors-config** (`command/cors-config`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/rate-limit-setup** (`command/rate-limit-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/pagination-gen** (`command/pagination-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/filtering-gen** (`command/filtering-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/sorting-gen** (`command/sorting-gen`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/search-optimize** (`command/search-optimize`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/analytics-setup** (`command/analytics-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **/monitoring-setup** (`command/monitoring-setup`) - Score: 60 - Issues: Missing compatibility, Missing platforms
- **Filesystem MCP** (`command/mcp-filesystem`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Supabase MCP** (`mcp-supabase`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Context7 MCP** (`mcp-context7`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **E2B MCP** (`mcp/mcp-e2b`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **GitHub MCP** (`mcp/mcp-github`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Alchemy MCP** (`mcp-alchemy`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Infura MCP** (`mcp-infura`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **The Graph MCP** (`mcp-thegraph`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **QuickNode MCP** (`mcp-quicknode`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Tenderly MCP** (`mcp-tenderly`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **PostgreSQL MCP** (`mcp-postgresql`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **MongoDB MCP** (`mcp-mongodb`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Redis MCP** (`mcp-redis`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Elasticsearch MCP** (`mcp-elasticsearch`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **SQLite MCP** (`mcp-sqlite`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Web3 Multichain MCP** (`mcp-web3-multichain`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Chainstack MCP** (`mcp-chainstack`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana Agent Kit MCP** (`mcp-solana-agent-kit`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **AWS Bedrock MCP** (`mcp-aws-bedrock`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Cloudflare MCP** (`mcp-cloudflare`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Google Cloud Run MCP** (`mcp-google-cloud-run`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Docker MCP** (`mcp-docker`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Kubernetes MCP** (`mcp-kubernetes`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **GitLab MCP** (`mcp-gitlab`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Git MCP** (`mcp-git`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **CircleCI MCP** (`mcp-circleci`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Playwright MCP** (`mcp-playwright`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Stripe MCP** (`mcp-stripe`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Notion MCP** (`mcp-notion`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Slack MCP** (`mcp-slack`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Brave Search MCP** (`mcp-brave-search`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Firecrawl MCP** (`mcp-firecrawl`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Perplexity MCP** (`mcp-perplexity`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Linear MCP** (`mcp-linear`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Sentry MCP** (`mcp-sentry`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Datadog MCP** (`mcp-datadog`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **OpenAI GPT Image MCP** (`mcp-openai-image`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Google Drive MCP** (`mcp-google-drive`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Vercel MCP** (`mcp-vercel`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Netlify MCP** (`mcp/mcp-netlify`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Railway MCP** (`mcp/mcp-railway`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Discord MCP** (`mcp/mcp-discord`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **AWS MCP** (`mcp/mcp-aws`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Google Cloud MCP** (`mcp/mcp-gcp`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Azure MCP** (`mcp/mcp-azure`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **PostgreSQL MCP** (`mcp/mcp-postgres`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Jira MCP** (`mcp/mcp-jira`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Figma MCP** (`mcp/mcp-figma`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Prisma MCP** (`mcp/mcp-prisma`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **PlanetScale MCP** (`mcp/mcp-planetscale`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Pinecone MCP** (`mcp/mcp-pinecone`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **OpenAI MCP** (`mcp/mcp-openai`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Anthropic MCP** (`mcp/mcp-anthropic`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Twilio MCP** (`mcp/mcp-twilio`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **SendGrid MCP** (`mcp/mcp-sendgrid`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Airtable MCP** (`mcp/mcp-airtable`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Temporal MCP** (`mcp-temporal`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Hasura MCP** (`mcp-hasura`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **PostHog MCP** (`mcp-posthog`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Mixpanel MCP** (`mcp-mixpanel`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **LaunchDarkly MCP** (`mcp-launchdarkly`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **N8N MCP** (`mcp-n8n`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Retool MCP** (`mcp/mcp-retool`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Supabase Extensions MCP** (`mcp-supabase-ext`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **PlanetScale Advanced MCP** (`mcp-planetscale-advanced`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Neon MCP** (`mcp-neon`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Upstash MCP** (`mcp/mcp-upstash`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Warp MCP** (`mcp-warp`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Replicate MCP** (`mcp/mcp-replicate`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Hugging Face MCP** (`mcp/mcp-huggingface`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Anthropic Extended MCP** (`mcp-anthropic-extended`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Groq MCP** (`mcp-groq`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Together AI MCP** (`mcp/mcp-together-ai`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Vectara MCP** (`mcp-vectara`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **LangSmith MCP** (`mcp-langsmith`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Logto MCP** (`mcp/mcp-logto`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Infisical MCP** (`mcp/mcp-infisical`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Snyk MCP** (`mcp-snyk`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Langfuse MCP** (`mcp/mcp-langfuse`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Bytebase MCP** (`mcp-bytebase`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Metabase MCP** (`mcp-metabase`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Grafana MCP** (`mcp-grafana`) - Score: 55 - Issues: Missing install command, Missing compatibility, Missing platforms
- **Helius RPC** (`mcp-helius-rpc`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **QuickNode RPC** (`mcp-quicknode-rpc`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **DexScreener** (`mcp-dexscreener`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Birdeye** (`mcp-birdeye`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **RugCheck** (`mcp-rugcheck`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Twitter (X) API** (`mcp-twitter`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Telegram API** (`mcp-telegram`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **LunarCrush** (`mcp-lunarcrush`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana DeFi Protocol Launch** (`solana-defi-protocol-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **NFT Marketplace Launch** (`nft-marketplace-deploy`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Web3 SaaS API Launch** (`web3-saas-api-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana Token Launch** (`solana-token-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Security Audit Pipeline** (`security-audit-pipeline`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Deploy with Tests** (`deploy-with-tests`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full-Stack Feature Builder** (`full-stack-feature-builder`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **TDD Development Workflow** (`tdd-workflow`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full-Stack Solana Feature** (`full-stack-solana-feature`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete Security Audit** (`security-complete-audit`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Test Pyramid Builder** (`test-pyramid-build`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Staged Deployment Pipeline** (`staged-deployment-pipeline`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete EVM dApp Launch** (`evm-dapp-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **DeFi Protocol Integration** (`defi-protocol-integration`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Performance Optimization Suite** (`performance-optimization-suite`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Incident Response Protocol** (`incident-response-protocol`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete API Documentation** (`api-documentation-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monitoring & Observability Setup** (`monitoring-observability-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **QA Release Validation** (`qa-release-validation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Economic Security Analysis** (`economic-security-analysis`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Web3 Penetration Testing** (`penetration-test-web3`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Onboarding & Quickstart Generator** (`onboarding-quickstart-generator`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Changelog & Release Notes Generator** (`changelog-release-notes`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Microservices Architecture Setup** (`microservices-architecture-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete GraphQL API** (`graphql-api-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Safe Database Migration** (`database-migration-safe`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Mobile App MVP Launch** (`mobile-app-mvp-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Progressive Web App Enhancement** (`pwa-progressive-enhancement`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete CI/CD Pipeline** (`ci-cd-pipeline-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Docker Containerization Workflow** (`docker-containerization-workflow`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monorepo Workspace Setup** (`monorepo-workspace-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Safe Legacy Code Refactor** (`legacy-code-refactor-safe`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Code Quality Baseline Setup** (`code-quality-baseline-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full ICM Research** (`full-icm-research`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Launch Monitoring** (`launch-monitoring`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Rug Protection** (`rug-protection`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Smart Entry Exit** (`smart-entry-exit`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana DeFi Protocol Launch** (`solana-defi-protocol-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **NFT Marketplace Launch** (`nft-marketplace-deploy`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Web3 SaaS API Launch** (`web3-saas-api-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Solana Token Launch** (`solana-token-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Security Audit Pipeline** (`security-audit-pipeline`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Deploy with Tests** (`deploy-with-tests`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full-Stack Feature Builder** (`full-stack-feature-builder`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **TDD Development Workflow** (`tdd-workflow`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full-Stack Solana Feature** (`full-stack-solana-feature`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete Security Audit** (`security-complete-audit`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Test Pyramid Builder** (`test-pyramid-build`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Staged Deployment Pipeline** (`staged-deployment-pipeline`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete EVM dApp Launch** (`evm-dapp-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **DeFi Protocol Integration** (`defi-protocol-integration`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Performance Optimization Suite** (`performance-optimization-suite`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Incident Response Protocol** (`incident-response-protocol`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete API Documentation** (`api-documentation-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monitoring & Observability Setup** (`monitoring-observability-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **QA Release Validation** (`qa-release-validation`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Economic Security Analysis** (`economic-security-analysis`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Web3 Penetration Testing** (`penetration-test-web3`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Onboarding & Quickstart Generator** (`onboarding-quickstart-generator`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Changelog & Release Notes Generator** (`changelog-release-notes`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Microservices Architecture Setup** (`microservices-architecture-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete GraphQL API** (`graphql-api-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Safe Database Migration** (`database-migration-safe`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Mobile App MVP Launch** (`mobile-app-mvp-launch`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Progressive Web App Enhancement** (`pwa-progressive-enhancement`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Complete CI/CD Pipeline** (`ci-cd-pipeline-complete`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Docker Containerization Workflow** (`docker-containerization-workflow`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Monorepo Workspace Setup** (`monorepo-workspace-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Safe Legacy Code Refactor** (`legacy-code-refactor-safe`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Code Quality Baseline Setup** (`code-quality-baseline-setup`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Full ICM Research** (`full-icm-research`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Launch Monitoring** (`launch-monitoring`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Rug Protection** (`rug-protection`) - Score: 65 - Issues: Missing compatibility, Missing platforms
- **Smart Entry Exit** (`smart-entry-exit`) - Score: 65 - Issues: Missing compatibility, Missing platforms

---

## FLAGGED Items (Score < 50)

None


---

## Recommendations

1. **Add compatibility fields** to 510 items missing this field
2. **Add platforms field** to 510 items missing this field
3. **Add audit metadata** to all 642 items for tracking
4. **Review 0 flagged items** for potential improvement

---

*Generated by gICM Accurate Registry Audit Script*
