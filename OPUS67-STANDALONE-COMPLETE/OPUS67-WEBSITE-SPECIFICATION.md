# OPUS 67 Website Specification
## opus67.dev - Complete Build Guide

---

## Tech Stack

```
Frontend:       Next.js 14 (App Router)
Styling:        Tailwind CSS + shadcn/ui
Animations:     Framer Motion
Deployment:     Vercel
Analytics:      Vercel Analytics + PostHog
Backend:        GICM API (existing)
Docs:           Nextra or Fumadocs
```

---

## Site Map

```
opus67.dev/
│
├── /                           # Landing page
├── /features                   # Feature deep-dive
├── /pricing                    # Free vs Pro (future)
│
├── /docs/                      # Documentation hub
│   ├── /docs/quickstart        # 5-minute setup
│   ├── /docs/installation      # Detailed install
│   ├── /docs/cli               # CLI reference
│   ├── /docs/skills            # Skills documentation
│   │   ├── /docs/skills/solana
│   │   ├── /docs/skills/frontend
│   │   └── /docs/skills/[category]
│   ├── /docs/agents            # Agents documentation
│   ├── /docs/modes             # Modes documentation
│   └── /docs/mcps              # MCP configurations
│
├── /integrations/              # Platform integrations
│   ├── /integrations/claude-code
│   ├── /integrations/cursor
│   ├── /integrations/vscode
│   ├── /integrations/windsurf
│   ├── /integrations/codespaces
│   ├── /integrations/replit
│   └── /integrations/chatgpt
│
├── /changelog                  # Version history
├── /roadmap                    # Public roadmap
├── /blog                       # Content marketing
│
└── /dashboard (future)         # User dashboard
```

---

## Page Designs

### 1. Landing Page (/)

#### Hero Section

```tsx
// app/page.tsx

import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Comparison } from '@/components/comparison'
import { QuickStart } from '@/components/quickstart'
import { Testimonials } from '@/components/testimonials'
import { CTA } from '@/components/cta'

export default function Home() {
  return (
    <main>
      <Hero />
      <LogoCloud />
      <Features />
      <Comparison />
      <SolanaNative />
      <QuickStart />
      <Testimonials />
      <CompetitorTable />
      <CTA />
    </main>
  )
}
```

#### Hero Component

```tsx
// components/hero.tsx

'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/code-block'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background" />
      
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-violet-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            v4.0 — Now with 130 skills
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            The AI Engine That{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Ships Code
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            130 pre-built skills • 47 connected tools • 82 specialist agents
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn your AI assistant into a 10x engineer. 
            Works with Claude Code, Cursor, VS Code, and more.
          </p>

          {/* Install command */}
          <div className="mb-8">
            <CodeBlock 
              code="npx create-opus67@latest"
              language="bash"
              copyable
              className="max-w-md mx-auto"
            />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline">
              View Documentation
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

#### Logo Cloud Component

```tsx
// components/logo-cloud.tsx

const PLATFORMS = [
  { name: 'Claude Code', logo: '/logos/claude.svg' },
  { name: 'Cursor', logo: '/logos/cursor.svg' },
  { name: 'VS Code', logo: '/logos/vscode.svg' },
  { name: 'Windsurf', logo: '/logos/windsurf.svg' },
  { name: 'Codespaces', logo: '/logos/codespaces.svg' },
  { name: 'Replit', logo: '/logos/replit.svg' },
]

export function LogoCloud() {
  return (
    <section className="py-12 border-y border-border/50">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Works with your favorite tools
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {PLATFORMS.map((platform) => (
            <div 
              key={platform.name}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <img 
                src={platform.logo} 
                alt={platform.name}
                className="h-6 w-6 opacity-60"
              />
              <span className="text-sm font-medium">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

#### Features Grid

```tsx
// components/features.tsx

import { Rocket, Wrench, Users, Zap, Brain, Shield } from 'lucide-react'

const FEATURES = [
  {
    icon: Rocket,
    title: '130 Pre-built Skills',
    description: 'Workflows for every development task. From Solana programs to Next.js apps.',
    stat: '130',
  },
  {
    icon: Wrench,
    title: '47 Connected Tools',
    description: 'MCPs that actually DO things. Jupiter, Helius, GitHub, Supabase, and more.',
    stat: '47',
  },
  {
    icon: Users,
    title: '82 Specialist Agents',
    description: 'Domain experts on demand. DeFi architects, frontend masters, security auditors.',
    stat: '82',
  },
  {
    icon: Zap,
    title: '4ms Local Routing',
    description: 'Skills matched locally in milliseconds. No API calls, no token cost.',
    stat: '4ms',
  },
  {
    icon: Brain,
    title: '5-Tier Memory',
    description: 'Remembers context across sessions. Vector, graph, and temporal storage.',
    stat: '5',
  },
  {
    icon: Shield,
    title: 'Solana-Native',
    description: 'The only AI engine built specifically for Solana and Web3 development.',
    stat: '∞',
  },
]

export function Features() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why OPUS 67?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Not just another context tool. A complete capability layer for AI development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div 
              key={feature.title}
              className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card transition-colors"
            >
              <div className="absolute top-4 right-4 text-4xl font-bold text-violet-500/20 group-hover:text-violet-500/30 transition-colors">
                {feature.stat}
              </div>
              <feature.icon className="h-10 w-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

#### Before/After Comparison

```tsx
// components/comparison.tsx

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Comparison() {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after')

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Difference
          </h2>
          <p className="text-xl text-muted-foreground">
            Same prompt. Completely different results.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-lg bg-muted">
            <button
              onClick={() => setActiveTab('before')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'before' 
                  ? 'bg-background text-foreground shadow' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Without OPUS 67
            </button>
            <button
              onClick={() => setActiveTab('after')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'after' 
                  ? 'bg-violet-600 text-white shadow' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              With OPUS 67
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'before' ? (
              <motion.div
                key="before"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-xl border p-6"
              >
                <div className="font-mono text-sm space-y-4">
                  <div className="text-blue-400">
                    You: "Create a bonding curve token on Solana"
                  </div>
                  <div className="text-muted-foreground">
                    AI: "To create a bonding curve token on Solana, you'll need to:
                    <br />1. Set up an Anchor project...
                    <br />2. Define your curve parameters...
                    <br />3. Implement the mint logic...
                    <br />4. Add the transfer hooks...
                    <br /><br />
                    Here's a basic example of how to get started..."
                  </div>
                  <div className="pt-4 border-t border-border">
                    <span className="text-red-400">Result: </span>
                    <span className="text-muted-foreground">Advice. Still need to build everything yourself.</span>
                  </div>
                  <div className="text-muted-foreground/50">
                    ⏱️ 30+ minutes of back-and-forth
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-xl border border-violet-500/30 p-6"
              >
                <div className="font-mono text-sm space-y-4">
                  <div className="text-blue-400">
                    You: "Create a bonding curve token on Solana"
                  </div>
                  <div className="text-violet-400 text-xs">
                    [Loading solana-anchor-expert, bonding-curve-math skills...]
                  </div>
                  <div className="text-green-400">
                    AI: "Done.
                    <br /><br />
                    Program ID: 7xK2nR9vPqmWk8Yz...
                    <br />Token Mint: 5xM9pL4kHjN2rT...
                    <br />TX: 3qW8eR7tYu...
                    <br /><br />
                    View on Explorer: [link]
                    <br /><br />
                    Curve parameters:
                    <br />• Initial price: 0.001 SOL
                    <br />• Slope: 0.0001
                    <br />• Reserve ratio: 50%"
                  </div>
                  <div className="pt-4 border-t border-border">
                    <span className="text-green-400">Result: </span>
                    <span className="text-foreground">Deployed. Working. On-chain.</span>
                  </div>
                  <div className="text-green-400/50">
                    ⏱️ 3 minutes total
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
```

#### Quick Start Section

```tsx
// components/quickstart.tsx

import { CodeBlock } from '@/components/code-block'
import { Check } from 'lucide-react'

const STEPS = [
  {
    step: 1,
    title: 'Run the installer',
    code: 'npx create-opus67@latest',
  },
  {
    step: 2,
    title: 'Select your environment',
    code: `? Select environment:
❯ Claude Code
  Cursor
  VS Code`,
  },
  {
    step: 3,
    title: 'Start building',
    code: 'claude "Create a Solana bonding curve"',
  },
]

export function QuickStart() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started in 30 Seconds
          </h2>
          <p className="text-xl text-muted-foreground">
            No API keys. No Docker. No configuration.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {STEPS.map((step, index) => (
            <div key={step.step} className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold">
                {step.step}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">{step.title}</h3>
                <CodeBlock code={step.code} language="bash" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Free forever
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Works offline
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Open source
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
```

#### Competitor Table

```tsx
// components/competitor-table.tsx

import { Check, X } from 'lucide-react'

const COMPETITORS = [
  { name: 'OPUS 67', skills: 130, tools: 47, agents: 82, solana: true, free: true, highlight: true },
  { name: 'Nia', skills: 0, tools: 0, agents: 0, solana: false, free: 'Limited' },
  { name: 'Context7', skills: 0, tools: 0, agents: 0, solana: false, free: true },
  { name: 'Cursor', skills: 0, tools: 0, agents: 0, solana: false, free: false },
]

export function CompetitorTable() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Compare
          </h2>
          <p className="text-xl text-muted-foreground">
            OPUS 67 vs the alternatives
          </p>
        </div>

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                {COMPETITORS.map((c) => (
                  <th 
                    key={c.name}
                    className={`text-center py-4 px-4 ${c.highlight ? 'text-violet-400' : ''}`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-4 text-muted-foreground">Pre-built skills</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="text-center py-4 px-4">
                    {c.skills > 0 ? (
                      <span className={c.highlight ? 'text-violet-400 font-bold' : ''}>
                        {c.skills}
                      </span>
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-muted-foreground">Connected tools</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="text-center py-4 px-4">
                    {c.tools > 0 ? (
                      <span className={c.highlight ? 'text-violet-400 font-bold' : ''}>
                        {c.tools}
                      </span>
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-muted-foreground">Specialist agents</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="text-center py-4 px-4">
                    {c.agents > 0 ? (
                      <span className={c.highlight ? 'text-violet-400 font-bold' : ''}>
                        {c.agents}
                      </span>
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-muted-foreground">Solana-native</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="text-center py-4 px-4">
                    {c.solana ? (
                      <Check className={`h-5 w-5 mx-auto ${c.highlight ? 'text-violet-400' : 'text-green-500'}`} />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-muted-foreground">Free tier</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="text-center py-4 px-4">
                    {c.free === true ? (
                      <Check className={`h-5 w-5 mx-auto ${c.highlight ? 'text-violet-400' : 'text-green-500'}`} />
                    ) : c.free === 'Limited' ? (
                      <span className="text-sm text-muted-foreground">Limited</span>
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
```

---

### 2. Documentation (/docs)

#### Structure

```
docs/
├── quickstart.mdx              # 5-minute guide
├── installation/
│   ├── claude-code.mdx
│   ├── cursor.mdx
│   ├── vscode.mdx
│   └── ...
├── cli/
│   ├── overview.mdx
│   ├── commands.mdx
│   └── configuration.mdx
├── skills/
│   ├── overview.mdx
│   ├── solana.mdx
│   ├── frontend.mdx
│   └── [category].mdx
├── agents/
│   └── ...
├── modes/
│   └── ...
└── mcps/
    └── ...
```

#### Quickstart Page

```mdx
---
title: Quick Start
description: Get started with OPUS 67 in 5 minutes
---

# Quick Start

OPUS 67 turns your AI assistant into a 10x engineer. This guide will have you up and running in under 5 minutes.

## Installation

Run the installer:

```bash
npx create-opus67@latest
```

Select your environment when prompted:

```bash
? Select environment:
❯ Claude Code (Recommended)
  Cursor
  VS Code + Continue
  GitHub Codespaces
  Windsurf
  Manual
```

## Verify Installation

Check that OPUS 67 is working:

```bash
opus67 status
```

You should see:

```bash
OPUS 67 v4.0.0
──────────────

Environment: Claude Code
Components:
  ✓ Skills:  130/130 loaded
  ✓ MCPs:    47/47 configured
  ✓ Agents:  82/82 available
  ✓ Modes:   30/30 ready
```

## Your First Task

Try it out:

```bash
claude "Create a Solana token with 2% transfer fee"
```

OPUS 67 will automatically:
1. Load the relevant skills (solana-anchor-expert, token-extensions)
2. Switch to the appropriate agent (Solana DeFi Architect)
3. Generate, build, and deploy the program
4. Return the program ID and transaction link

## Next Steps

- [Browse Skills](/docs/skills) - Explore 130 pre-built workflows
- [Configure Agents](/docs/agents) - Customize specialist personas
- [Connect MCPs](/docs/mcps) - Add more tools

## Need Help?

- [Discord Community](https://discord.gg/opus67)
- [GitHub Issues](https://github.com/icm-motion/opus67/issues)
```

---

### 3. Integrations Pages

#### Template Structure

```tsx
// app/integrations/[platform]/page.tsx

import { CodeBlock } from '@/components/code-block'

const PLATFORMS = {
  'claude-code': {
    name: 'Claude Code',
    logo: '/logos/claude.svg',
    description: 'Native integration with Claude Code CLI',
    status: 'stable',
  },
  'cursor': {
    name: 'Cursor',
    logo: '/logos/cursor.svg',
    description: 'Full support via .cursorrules',
    status: 'stable',
  },
  // ...
}

export default function IntegrationPage({ params }) {
  const platform = PLATFORMS[params.platform]
  
  return (
    <div className="container mx-auto py-16">
      <div className="flex items-center gap-4 mb-8">
        <img src={platform.logo} className="h-12 w-12" />
        <div>
          <h1 className="text-3xl font-bold">{platform.name}</h1>
          <p className="text-muted-foreground">{platform.description}</p>
        </div>
      </div>
      
      {/* Installation steps */}
      {/* Configuration */}
      {/* Usage examples */}
    </div>
  )
}
```

---

## Project Structure

```
opus67-website/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── features/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── docs/
│   │   ├── [[...slug]]/
│   │   │   └── page.tsx            # MDX docs
│   │   └── layout.tsx
│   ├── integrations/
│   │   ├── page.tsx                # Integration list
│   │   └── [platform]/
│   │       └── page.tsx
│   ├── changelog/
│   │   └── page.tsx
│   ├── roadmap/
│   │   └── page.tsx
│   └── blog/
│       ├── page.tsx
│       └── [slug]/
│           └── page.tsx
├── components/
│   ├── ui/                         # shadcn components
│   ├── hero.tsx
│   ├── features.tsx
│   ├── comparison.tsx
│   ├── quickstart.tsx
│   ├── competitor-table.tsx
│   ├── code-block.tsx
│   ├── navbar.tsx
│   └── footer.tsx
├── content/
│   ├── docs/                       # MDX documentation
│   └── blog/                       # Blog posts
├── lib/
│   ├── utils.ts
│   └── api.ts
├── public/
│   ├── logos/
│   └── og/
├── styles/
│   └── globals.css
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/github",
      "destination": "https://github.com/icm-motion/opus67",
      "permanent": false
    }
  ]
}
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.gicm.ai
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_SITE_URL=https://opus67.dev
```

---

## Timeline

| Day | Task |
|-----|------|
| 1 | Project setup, Tailwind, shadcn |
| 2 | Landing page hero + features |
| 3 | Comparison + quickstart sections |
| 4 | Footer, navbar, responsive polish |
| 5 | Docs setup (Nextra/Fumadocs) |
| 6 | Quickstart + installation docs |
| 7 | Integration pages (Claude, Cursor, VS Code) |
| 8 | Testing, SEO, deploy to Vercel |

**Total: ~2 weeks to production-ready site**

---

## SEO Strategy

### Target Keywords

- "AI coding assistant"
- "Claude Code skills"
- "Solana AI development"
- "Cursor alternatives"
- "AI code generation tools"
- "MCP servers"

### Meta Tags

```tsx
// app/layout.tsx

export const metadata = {
  title: 'OPUS 67 - The AI Engine That Ships Code',
  description: '130 pre-built skills, 47 connected tools, 82 specialist agents. Turn your AI assistant into a 10x engineer.',
  openGraph: {
    title: 'OPUS 67 - The AI Engine That Ships Code',
    description: '130 skills • 47 tools • 82 agents • Solana-native',
    url: 'https://opus67.dev',
    siteName: 'OPUS 67',
    images: [
      {
        url: 'https://opus67.dev/og/home.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPUS 67 - The AI Engine That Ships Code',
    description: '130 skills • 47 tools • 82 agents',
    images: ['https://opus67.dev/og/home.png'],
  },
}
```
