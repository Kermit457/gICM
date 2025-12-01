/**
 * Structured Brainstorming Methods for AI Agents
 * Inspired by github.com/Azzedde/brainstormers
 *
 * These methods can be embedded into agent prompts to improve
 * systematic thinking and decision-making quality.
 */

export type BrainstormMethod =
  | "scamper"
  | "six-hats"
  | "reverse"
  | "role-storming"
  | "starbursting"
  | "mind-mapping"
  | "swot"
  | "five-whys"
  | "brainwriting";

export interface BrainstormConfig {
  method: BrainstormMethod;
  topic: string;
  context?: string;
}

/**
 * SCAMPER Method
 * Systematic creative technique for improving/modifying ideas
 */
export const SCAMPER_PROMPT = `
Analyze using the SCAMPER method:

**S - Substitute**: What can be substituted? Different approach, tool, or resource?
**C - Combine**: What can be combined? Merge with other ideas or solutions?
**A - Adapt**: What can be adapted? Borrow from other domains or contexts?
**M - Modify**: What can be modified? Change size, shape, frequency, or intensity?
**P - Put to other uses**: What other uses exist? Repurpose for different markets?
**E - Eliminate**: What can be eliminated? Remove unnecessary complexity?
**R - Reverse/Rearrange**: What can be reversed? Change order or perspective?

For each SCAMPER element, provide:
1. Specific suggestion
2. Potential impact (High/Medium/Low)
3. Implementation difficulty (Easy/Medium/Hard)
`;

/**
 * Six Thinking Hats Method
 * Multi-perspective analysis from 6 angles
 */
export const SIX_HATS_PROMPT = `
Analyze using the Six Thinking Hats method:

🎩 **White Hat (Facts)**: What are the objective facts and data?
- Known information
- Data gaps to fill
- Verifiable metrics

🎩 **Red Hat (Emotions)**: What are the gut feelings and intuitions?
- Initial reactions
- Emotional appeal
- User sentiment

🎩 **Black Hat (Risks)**: What are the dangers and problems?
- Potential failures
- Worst-case scenarios
- Critical weaknesses

🎩 **Yellow Hat (Benefits)**: What are the positives and opportunities?
- Best-case scenarios
- Competitive advantages
- Growth potential

🎩 **Green Hat (Creativity)**: What are new ideas and alternatives?
- Novel approaches
- Unconventional solutions
- Innovation opportunities

🎩 **Blue Hat (Process)**: What's the next step and action plan?
- Decision summary
- Priority actions
- Success metrics

For each hat, provide 2-3 concrete points.
`;

/**
 * Reverse Brainstorming Method
 * Find problems to reveal solutions
 */
export const REVERSE_BRAINSTORM_PROMPT = `
Analyze using Reverse Brainstorming:

**Step 1 - Invert the Goal**: Instead of "How to succeed?", ask "How to fail?"
List 5 ways this could completely fail:
1.
2.
3.
4.
5.

**Step 2 - Reverse Each Failure**: For each failure mode, identify the opposite action
- Failure → Prevention Strategy
- Weakness → Strength to build

**Step 3 - Hidden Insights**: What problems reveal opportunities?
- Market gaps exposed
- Unmet needs discovered
- Competitive weaknesses to exploit

**Step 4 - Action Items**: Convert insights to specific actions
`;

/**
 * Role Storming Method
 * Think from different personas/perspectives
 */
export const ROLE_STORMING_PROMPT = `
Analyze from multiple persona perspectives:

👤 **The Conservative Investor**:
- Focus: Capital preservation, proven track record, risk management
- Question: "Is this safe enough? What's the downside protection?"
- Concern: Volatility, unproven concepts, regulatory risk

👤 **The Aggressive Degen**:
- Focus: Maximum upside, early entry, momentum plays
- Question: "What's the 10x potential? Where's the asymmetric bet?"
- Concern: Missing the pump, being too late

👤 **The Whale**:
- Focus: Liquidity, market impact, accumulation strategy
- Question: "Can I size in without moving the market? Exit strategy?"
- Concern: Slippage, liquidity traps, front-running

👤 **The Skeptic**:
- Focus: Red flags, team quality, tokenomics
- Question: "What's the catch? Who benefits if this fails?"
- Concern: Rug pulls, insider dumping, unsustainable mechanics

👤 **The Builder**:
- Focus: Technical quality, product-market fit, team execution
- Question: "Is this technically sound? Can they ship?"
- Concern: Vaporware, technical debt, scaling issues

For each persona, provide:
1. Their likely verdict (Bullish/Bearish/Neutral)
2. Key concern or opportunity they'd identify
3. Suggested action
`;

/**
 * Starbursting Method
 * 5W1H structured questioning
 */
export const STARBURSTING_PROMPT = `
Deep-dive using Starbursting (5W1H):

❓ **WHO**
- Who is the target user/customer?
- Who are the competitors?
- Who on the team is responsible?
- Who benefits most? Who loses?

❓ **WHAT**
- What problem does this solve?
- What is the core value proposition?
- What resources are needed?
- What could go wrong?

❓ **WHEN**
- When should we act?
- When is the optimal timing?
- When do we expect results?
- When should we reassess?

❓ **WHERE**
- Where is the opportunity?
- Where are similar solutions?
- Where should we focus first?
- Where are the blind spots?

❓ **WHY**
- Why does this matter now?
- Why would users choose this?
- Why hasn't this been done before?
- Why might this fail?

❓ **HOW**
- How will this be implemented?
- How will success be measured?
- How will we iterate?
- How much will it cost?

For each question category, identify the 2 most critical questions and answer them.
`;

/**
 * Mind Mapping Method
 * Hierarchical idea expansion
 */
export const MIND_MAPPING_PROMPT = `
Expand using Mind Mapping structure:

🌳 **CENTRAL IDEA**: [Topic]

├── 🌿 **Branch 1: Market Opportunity**
│   ├── Sub-idea 1.1
│   ├── Sub-idea 1.2
│   └── Sub-idea 1.3

├── 🌿 **Branch 2: Technical Approach**
│   ├── Sub-idea 2.1
│   ├── Sub-idea 2.2
│   └── Sub-idea 2.3

├── 🌿 **Branch 3: Competitive Landscape**
│   ├── Sub-idea 3.1
│   ├── Sub-idea 3.2
│   └── Sub-idea 3.3

├── 🌿 **Branch 4: Risks & Mitigations**
│   ├── Sub-idea 4.1
│   ├── Sub-idea 4.2
│   └── Sub-idea 4.3

└── 🌿 **Branch 5: Action Items**
    ├── Immediate (Today)
    ├── Short-term (This Week)
    └── Medium-term (This Month)

For each branch, expand with 3-5 concrete sub-ideas.
`;

/**
 * SWOT Analysis Method
 * Strategic planning tool for assessing strengths, weaknesses, opportunities, threats
 */
export const SWOT_PROMPT = `
Analyze using SWOT Analysis:

📊 **STRENGTHS (Internal Positives)**
What advantages do we have? What do we do well?
- Core competencies
- Unique resources or capabilities
- Competitive advantages
- Strong areas

| Strength | Impact | Leverage Strategy |
|----------|--------|-------------------|
| 1. | High/Med/Low | How to maximize |
| 2. | High/Med/Low | How to maximize |
| 3. | High/Med/Low | How to maximize |

📊 **WEAKNESSES (Internal Negatives)**
What could be improved? Where are we vulnerable?
- Resource gaps
- Skill deficiencies
- Process inefficiencies
- Competitive disadvantages

| Weakness | Severity | Mitigation Plan |
|----------|----------|-----------------|
| 1. | Critical/Moderate/Minor | How to address |
| 2. | Critical/Moderate/Minor | How to address |
| 3. | Critical/Moderate/Minor | How to address |

📊 **OPPORTUNITIES (External Positives)**
What trends could we capitalize on? What market gaps exist?
- Market trends
- Emerging technologies
- Regulatory changes
- Competitor weaknesses

| Opportunity | Potential | Action Required |
|-------------|-----------|-----------------|
| 1. | High/Med/Low | Specific steps |
| 2. | High/Med/Low | Specific steps |
| 3. | High/Med/Low | Specific steps |

📊 **THREATS (External Negatives)**
What obstacles do we face? What are competitors doing?
- Market risks
- Economic factors
- Competitive pressures
- Regulatory threats

| Threat | Probability | Contingency Plan |
|--------|-------------|------------------|
| 1. | High/Med/Low | Defense strategy |
| 2. | High/Med/Low | Defense strategy |
| 3. | High/Med/Low | Defense strategy |

**Strategic Recommendations:**
Based on the SWOT analysis, identify:
1. S-O Strategy: How to use strengths to capture opportunities
2. W-O Strategy: How to overcome weaknesses by pursuing opportunities
3. S-T Strategy: How to use strengths to avoid threats
4. W-T Strategy: How to minimize weaknesses and avoid threats
`;

/**
 * Five Whys Method
 * Root cause analysis technique
 */
export const FIVE_WHYS_PROMPT = `
Analyze using the Five Whys technique:

🔍 **Problem Statement**: [State the problem clearly]

**Why #1**: Why is this happening?
→ Answer: [First level cause]

**Why #2**: Why is [answer #1] happening?
→ Answer: [Second level cause]

**Why #3**: Why is [answer #2] happening?
→ Answer: [Third level cause]

**Why #4**: Why is [answer #3] happening?
→ Answer: [Fourth level cause]

**Why #5**: Why is [answer #4] happening?
→ Answer: [Root cause identified]

---

**Root Cause Analysis Summary:**
- Surface symptom: [Original problem]
- Root cause: [Final answer]
- Contributing factors: [List 2-3 factors]

**Corrective Actions:**
| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|----------------|
| Fix root cause | | | |
| Address contributing factor 1 | | | |
| Address contributing factor 2 | | | |

**Preventive Measures:**
How to prevent this from recurring:
1. [Systemic change 1]
2. [Process improvement 2]
3. [Monitoring/alert setup]

Note: If you reach the root cause before 5 whys, stop there.
If you need more than 5, continue until you find a actionable root cause.
`;

/**
 * Brainwriting Method (6-3-5)
 * Silent idea generation and building
 */
export const BRAINWRITING_PROMPT = `
Generate ideas using Brainwriting (6-3-5 method adapted for AI):

**Topic**: [Subject for ideation]

---

**Round 1 - Initial Ideas (Fresh thinking)**
Generate 3 completely independent ideas:

💡 Idea 1.1: [Novel approach]
- Description:
- Key benefit:
- Implementation:

💡 Idea 1.2: [Different angle]
- Description:
- Key benefit:
- Implementation:

💡 Idea 1.3: [Unconventional solution]
- Description:
- Key benefit:
- Implementation:

---

**Round 2 - Build on Ideas (Expand and improve)**
Take each idea and enhance it:

💡 Idea 2.1 (building on 1.1):
- Enhancement:
- New feature:
- Combination potential:

💡 Idea 2.2 (building on 1.2):
- Enhancement:
- New feature:
- Combination potential:

💡 Idea 2.3 (building on 1.3):
- Enhancement:
- New feature:
- Combination potential:

---

**Round 3 - Cross-pollinate (Combine and synthesize)**
Combine the best elements from previous rounds:

🌟 Synthesis 1: [Combination of ideas]
- Source elements: From ideas X and Y
- Unique value:
- Feasibility: High/Medium/Low

🌟 Synthesis 2: [Different combination]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

🌟 Synthesis 3: [Best overall concept]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

---

**Final Ranking:**
Rank all ideas by potential impact × feasibility:

| Rank | Idea | Impact | Feasibility | Score |
|------|------|--------|-------------|-------|
| 1 | | High/Med/Low | High/Med/Low | |
| 2 | | High/Med/Low | High/Med/Low | |
| 3 | | High/Med/Low | High/Med/Low | |

**Recommended Next Steps:**
1. [Immediate action for top idea]
2. [Validation approach]
3. [Resource requirements]
`;

/**
 * Get the prompt template for a brainstorming method
 */
export function getBrainstormPrompt(method: BrainstormMethod): string {
  const prompts: Record<BrainstormMethod, string> = {
    "scamper": SCAMPER_PROMPT,
    "six-hats": SIX_HATS_PROMPT,
    "reverse": REVERSE_BRAINSTORM_PROMPT,
    "role-storming": ROLE_STORMING_PROMPT,
    "starbursting": STARBURSTING_PROMPT,
    "mind-mapping": MIND_MAPPING_PROMPT,
    "swot": SWOT_PROMPT,
    "five-whys": FIVE_WHYS_PROMPT,
    "brainwriting": BRAINWRITING_PROMPT,
  };
  return prompts[method];
}

/**
 * Build a complete brainstorming prompt with context
 */
export function buildBrainstormPrompt(config: BrainstormConfig): string {
  const methodPrompt = getBrainstormPrompt(config.method);

  return `
# Brainstorming Analysis

**Topic**: ${config.topic}
${config.context ? `**Context**: ${config.context}` : ""}

${methodPrompt}

Provide a thorough analysis following the structure above.
`;
}

/**
 * Method metadata for UI display
 */
export const BRAINSTORM_METHODS: Record<BrainstormMethod, {
  name: string;
  description: string;
  icon: string;
  color: string;
  useCases: string[];
}> = {
  "scamper": {
    name: "SCAMPER",
    description: "Systematic creative technique for improving ideas",
    icon: "🔧",
    color: "blue",
    useCases: ["Product improvement", "Feature ideation", "Process optimization"],
  },
  "six-hats": {
    name: "Six Thinking Hats",
    description: "Multi-perspective analysis from 6 angles",
    icon: "🎩",
    color: "purple",
    useCases: ["Decision making", "Risk assessment", "Team discussions"],
  },
  "reverse": {
    name: "Reverse Brainstorming",
    description: "Find problems to reveal solutions",
    icon: "🔄",
    color: "red",
    useCases: ["Problem solving", "Risk identification", "Innovation"],
  },
  "role-storming": {
    name: "Role Storming",
    description: "Think from different personas/perspectives",
    icon: "👥",
    color: "green",
    useCases: ["User research", "Market analysis", "Strategy planning"],
  },
  "starbursting": {
    name: "Starbursting",
    description: "5W1H structured questioning",
    icon: "⭐",
    color: "yellow",
    useCases: ["Due diligence", "Project planning", "Market research"],
  },
  "mind-mapping": {
    name: "Mind Mapping",
    description: "Hierarchical idea expansion",
    icon: "🌳",
    color: "teal",
    useCases: ["Brainstorming", "Note-taking", "Concept exploration"],
  },
  "swot": {
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats assessment",
    icon: "📊",
    color: "indigo",
    useCases: ["Strategic planning", "Competitive analysis", "Business decisions"],
  },
  "five-whys": {
    name: "Five Whys",
    description: "Root cause analysis technique",
    icon: "🔍",
    color: "orange",
    useCases: ["Problem solving", "Root cause analysis", "Process improvement"],
  },
  "brainwriting": {
    name: "Brainwriting",
    description: "Silent idea generation and building (6-3-5 method)",
    icon: "✍️",
    color: "pink",
    useCases: ["Ideation", "Creative sessions", "Building on ideas"],
  },
};
