"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Lightbulb,
  Wrench,
  RefreshCw,
  Send,
  History,
  Trash2,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

type BrainstormMethod =
  | "scamper"
  | "six-hats"
  | "reverse"
  | "role-storming"
  | "starbursting"
  | "mind-mapping"
  | "swot"
  | "five-whys"
  | "brainwriting";

interface BrainstormSession {
  id: string;
  method: BrainstormMethod;
  topic: string;
  response: string;
  timestamp: number;
}

const METHODS: Record<BrainstormMethod, {
  name: string;
  description: string;
  icon: string;
  color: string;
  prompt: string;
}> = {
  "scamper": {
    name: "SCAMPER",
    description: "Substitute, Combine, Adapt, Modify, Put to use, Eliminate, Reverse",
    icon: "🔧",
    color: "blue",
    prompt: `Analyze using the SCAMPER method:

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
3. Implementation difficulty (Easy/Medium/Hard)`,
  },
  "six-hats": {
    name: "Six Thinking Hats",
    description: "Facts, Emotions, Risks, Benefits, Creativity, Process",
    icon: "🎩",
    color: "purple",
    prompt: `Analyze using the Six Thinking Hats method:

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

For each hat, provide 2-3 concrete points.`,
  },
  "reverse": {
    name: "Reverse Brainstorming",
    description: "Find problems to reveal solutions",
    icon: "🔄",
    color: "red",
    prompt: `Analyze using Reverse Brainstorming:

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

**Step 4 - Action Items**: Convert insights to specific actions`,
  },
  "role-storming": {
    name: "Role Storming",
    description: "Think from Whale, Degen, Skeptic, Builder perspectives",
    icon: "👥",
    color: "green",
    prompt: `Analyze from multiple persona perspectives:

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
3. Suggested action`,
  },
  "starbursting": {
    name: "Starbursting",
    description: "5W1H structured questioning (Who, What, When, Where, Why, How)",
    icon: "⭐",
    color: "yellow",
    prompt: `Deep-dive using Starbursting (5W1H):

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

For each question category, identify the 2 most critical questions and answer them.`,
  },
  "mind-mapping": {
    name: "Mind Mapping",
    description: "Hierarchical idea expansion tree",
    icon: "🌳",
    color: "teal",
    prompt: `Expand using Mind Mapping structure:

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

For each branch, expand with 3-5 concrete sub-ideas.`,
  },
  "swot": {
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats",
    icon: "📊",
    color: "indigo",
    prompt: `Analyze using SWOT Analysis:

📊 **STRENGTHS (Internal Positives)**
What advantages do we have? What do we do well?

| Strength | Impact | Leverage Strategy |
|----------|--------|-------------------|
| 1. | High/Med/Low | How to maximize |
| 2. | High/Med/Low | How to maximize |
| 3. | High/Med/Low | How to maximize |

📊 **WEAKNESSES (Internal Negatives)**
What could be improved? Where are we vulnerable?

| Weakness | Severity | Mitigation Plan |
|----------|----------|-----------------|
| 1. | Critical/Moderate/Minor | How to address |
| 2. | Critical/Moderate/Minor | How to address |
| 3. | Critical/Moderate/Minor | How to address |

📊 **OPPORTUNITIES (External Positives)**
What trends could we capitalize on? What market gaps exist?

| Opportunity | Potential | Action Required |
|-------------|-----------|-----------------|
| 1. | High/Med/Low | Specific steps |
| 2. | High/Med/Low | Specific steps |
| 3. | High/Med/Low | Specific steps |

📊 **THREATS (External Negatives)**
What obstacles do we face? What are competitors doing?

| Threat | Probability | Contingency Plan |
|--------|-------------|------------------|
| 1. | High/Med/Low | Defense strategy |
| 2. | High/Med/Low | Defense strategy |
| 3. | High/Med/Low | Defense strategy |

**Strategic Recommendations:**
1. S-O Strategy: How to use strengths to capture opportunities
2. W-O Strategy: How to overcome weaknesses by pursuing opportunities
3. S-T Strategy: How to use strengths to avoid threats
4. W-T Strategy: How to minimize weaknesses and avoid threats`,
  },
  "five-whys": {
    name: "Five Whys",
    description: "Root cause analysis - ask why 5 times",
    icon: "🔍",
    color: "orange",
    prompt: `Analyze using the Five Whys technique:

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
| Address factor 1 | | | |
| Address factor 2 | | | |

**Preventive Measures:**
1. [Systemic change 1]
2. [Process improvement 2]
3. [Monitoring/alert setup]`,
  },
  "brainwriting": {
    name: "Brainwriting",
    description: "Silent idea generation and building (6-3-5)",
    icon: "✍️",
    color: "pink",
    prompt: `Generate ideas using Brainwriting (6-3-5 method):

**Topic**: [Subject for ideation]

---

**Round 1 - Initial Ideas**
Generate 3 independent ideas:

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

**Round 2 - Build on Ideas**
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

**Round 3 - Cross-pollinate**
Combine best elements:

🌟 Synthesis 1: [Combination]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

🌟 Synthesis 2: [Another combination]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

---

**Final Ranking:**
| Rank | Idea | Impact | Feasibility |
|------|------|--------|-------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Next Steps:**
1. [Immediate action for top idea]
2. [Validation approach]
3. [Resource requirements]`,
  },
};

const STORAGE_KEY = "gicm-brainstorm-history";

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
    red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
    green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400" },
  };
  return colors[color] || colors.blue;
}

function MethodCard({
  method,
  selected,
  onClick,
}: {
  method: BrainstormMethod;
  selected: boolean;
  onClick: () => void;
}) {
  const info = METHODS[method];
  const colors = getColorClasses(info.color);

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-left ${
        selected
          ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-offset-gicm-dark ring-${info.color}-500/50`
          : "bg-gicm-card border-gicm-border hover:border-gicm-primary/30"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{info.icon}</span>
        <span className={`font-semibold ${selected ? colors.text : "text-white"}`}>
          {info.name}
        </span>
      </div>
      <p className="text-xs text-gray-400 line-clamp-2">{info.description}</p>
    </button>
  );
}

function SessionItem({
  session,
  onSelect,
  onDelete,
}: {
  session: BrainstormSession;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const info = METHODS[session.method];
  const colors = getColorClasses(info.color);

  return (
    <div
      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{info.icon}</span>
          <span className={`text-sm font-medium ${colors.text}`}>{info.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-400" />
        </button>
      </div>
      <p className="text-sm text-white truncate">{session.topic}</p>
      <p className="text-xs text-gray-500 mt-1">
        {new Date(session.timestamp).toLocaleDateString()}
      </p>
    </div>
  );
}

function BrainstormPageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<BrainstormMethod>("six-hats");
  const [topic, setTopic] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BrainstormSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage and URL params
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // Invalid data, ignore
      }
    }

    // Read URL params for pre-filled topic and method
    const urlTopic = searchParams.get("topic");
    const urlMethod = searchParams.get("method");

    if (urlTopic) {
      setTopic(decodeURIComponent(urlTopic));
    }
    if (urlMethod && Object.keys(METHODS).includes(urlMethod)) {
      setSelectedMethod(urlMethod as BrainstormMethod);
    }
  }, [searchParams]);

  // Save history to localStorage
  useEffect(() => {
    if (mounted && history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20))); // Keep last 20
    }
  }, [history, mounted]);

  const handleSubmit = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    setResponse("");

    const methodInfo = METHODS[selectedMethod];
    const fullPrompt = `# Brainstorming Analysis

**Topic**: ${topic}

${methodInfo.prompt}

Provide a thorough analysis following the structure above.`;

    try {
      // Call the AI API (using hub endpoint)
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          topic,
          prompt: fullPrompt,
        }),
      });

      if (!res.ok) {
        // Fallback to simulated response if API not available
        const simulatedResponse = generateSimulatedResponse(selectedMethod, topic);
        setResponse(simulatedResponse);
      } else {
        const data = await res.json();
        setResponse(data.response || "No response generated.");
      }

      // Save to history
      const session: BrainstormSession = {
        id: crypto.randomUUID(),
        method: selectedMethod,
        topic,
        response: response || "See above",
        timestamp: Date.now(),
      };
      setHistory((prev) => [session, ...prev]);
    } catch {
      // Generate local response as fallback
      const simulatedResponse = generateSimulatedResponse(selectedMethod, topic);
      setResponse(simulatedResponse);

      const session: BrainstormSession = {
        id: crypto.randomUUID(),
        method: selectedMethod,
        topic,
        response: simulatedResponse,
        timestamp: Date.now(),
      };
      setHistory((prev) => [session, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSession = (session: BrainstormSession) => {
    setSelectedMethod(session.method);
    setTopic(session.topic);
    setResponse(session.response);
    setShowHistory(false);
  };

  const deleteSession = (id: string) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Brainstorm...</div>
      </div>
    );
  }

  const methodInfo = METHODS[selectedMethod];
  const colors = getColorClasses(methodInfo.color);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Lightbulb className="w-6 h-6 text-gicm-primary" />
            </div>
            Brainstorm
          </h1>
          <p className="text-gray-400 mt-1 ml-12">
            Structured AI-powered ideation using 9 proven methods
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showHistory
                ? "bg-gicm-primary text-black"
                : "bg-gicm-card border border-gicm-border hover:border-gicm-primary/30"
            }`}
          >
            <History className="w-4 h-4" />
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Method Selector */}
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gicm-primary/10">
            <Wrench className="w-5 h-5 text-gicm-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Select Method</h3>
            <p className="text-sm text-gray-400">Choose a brainstorming framework</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(METHODS) as BrainstormMethod[]).map((method) => (
            <MethodCard
              key={method}
              method={method}
              selected={selectedMethod === method}
              onClick={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Topic Input */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <span className="text-xl">{methodInfo.icon}</span>
              </div>
              <div>
                <h3 className={`font-semibold ${colors.text}`}>{methodInfo.name}</h3>
                <p className="text-sm text-gray-400">{methodInfo.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Topic or Question</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the topic, idea, or question you want to brainstorm..."
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-gicm-border rounded-lg focus:outline-none focus:border-gicm-primary/50 resize-none text-white placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  !topic.trim() || loading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gicm-primary text-black hover:bg-gicm-primary/90"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Brainstorm
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Section */}
          {response && (
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gicm-primary/10">
                    <Sparkles className="w-5 h-5 text-gicm-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Analysis Result</h3>
                    <p className="text-sm text-gray-400">AI-generated insights</p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div
                ref={responseRef}
                className="prose prose-invert prose-sm max-w-none bg-white/5 rounded-lg p-4 max-h-[500px] overflow-y-auto"
              >
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                  {response}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className={`${showHistory ? "block" : "hidden lg:block"}`}>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gicm-primary/10">
                  <History className="w-5 h-5 text-gicm-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">History</h3>
                  <p className="text-sm text-gray-400">{history.length} sessions</p>
                </div>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No sessions yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  Your brainstorm sessions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    onSelect={() => loadSession(session)}
                    onDelete={() => deleteSession(session.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback simulated response when API is not available
function generateSimulatedResponse(method: BrainstormMethod, topic: string): string {
  const info = METHODS[method];

  return `# ${info.name} Analysis

**Topic**: ${topic}

---

${info.prompt}

---

> This is a placeholder response. Connect the AI API endpoint at \`/api/brainstorm\` for real AI-powered analysis.

## Quick Tips:
1. Be specific with your topic for better results
2. Try different methods for varied perspectives
3. Use the history feature to compare approaches
4. Copy results to share with your team

---

*Powered by gICM Brainstorm Engine*`;
}

// Loading fallback for Suspense boundary
function BrainstormLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading Brainstorm...</div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function BrainstormPage() {
  return (
    <Suspense fallback={<BrainstormLoading />}>
      <BrainstormPageContent />
    </Suspense>
  );
}
